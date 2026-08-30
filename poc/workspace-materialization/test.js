'use strict';

const assert = require('node:assert/strict');
const {
  normalizeWorkspacePath,
  createPlan,
  materialize,
  executeCapability,
} = require('./materialize.js');

class MemoryFS {
  constructor() {
    this.dirs = new Set(['/']);
    this.files = new Map();
  }
  async resetRoot(root) {
    for (const path of [...this.files.keys()]) if (path === root || path.startsWith(`${root}/`)) this.files.delete(path);
    for (const path of [...this.dirs]) if (path === root || path.startsWith(`${root}/`)) this.dirs.delete(path);
  }
  async mkdir(path) { this.dirs.add(path); }
  async writeFile(path, content) { this.files.set(path, String(content)); }
  readFile(path) { return this.files.get(path); }
  exists(path) { return this.files.has(path) || this.dirs.has(path); }
}

function request(snapshot, revision = snapshot.revision) {
  return {
    protocol: 'CAPABILITY_REQUEST/1',
    request_id: `test-${revision}`,
    capability: 'workspace.materialize',
    actor: { kind: 'system', id: 'workspace-materialization-test' },
    workspace_revision: revision,
    input: { snapshot },
    requested_effect: 'derived workspace read view',
  };
}

(async () => {
  assert.equal(normalizeWorkspacePath('pkg\\math.py'), 'pkg/math.py');
  assert.throws(() => normalizeWorkspacePath('../escape.py'), /Parent traversal/);
  assert.throws(() => normalizeWorkspacePath('/absolute.py'), /Absolute/);

  const snapshot = {
    revision: 7,
    files: {
      'main.py': 'from lib.math_core import multiply\nprint(multiply(6, 7))\n',
      'lib/math_core.py': 'def multiply(a, b): return a * b\n',
    },
  };

  const planA = createPlan(snapshot);
  const planB = createPlan({ revision: 7, files: { 'lib/math_core.py': snapshot.files['lib/math_core.py'], 'main.py': snapshot.files['main.py'] } });
  assert.equal(planA.manifest_id, planB.manifest_id, 'manifest must be ordering-independent');
  assert.equal(planA.root, planB.root, 'same revision/content should resolve to same derived root');

  const fs = new MemoryFS();
  const descriptor = await materialize(planA, fs);
  assert.equal(descriptor.authority, 'derived-read-view');
  assert.equal(fs.readFile(`${descriptor.root}/lib/math_core.py`), snapshot.files['lib/math_core.py']);

  await fs.writeFile(`${descriptor.root}/runtime-created.txt`, 'derived');
  assert.equal(fs.exists(`${descriptor.root}/runtime-created.txt`), true);
  await materialize(planA, fs);
  assert.equal(fs.exists(`${descriptor.root}/runtime-created.txt`), false);
  assert.equal(Object.prototype.hasOwnProperty.call(snapshot.files, 'runtime-created.txt'), false);

  const snapshot2 = { revision: 8, files: { 'main.py': 'print("new")\n' } };
  const plan2 = createPlan(snapshot2);
  assert.notEqual(plan2.root, planA.root);
  await materialize(plan2, fs);
  assert.equal(fs.exists(`${plan2.root}/lib/math_core.py`), false);
  assert.equal(fs.readFile(`${plan2.root}/main.py`), 'print("new")\n');

  const completed = await executeCapability(request(snapshot2), fs);
  assert.equal(completed.status, 'completed');
  assert.equal(completed.output.revision, 8);
  assert.equal(completed.workspace_revision_before, 8);
  assert.equal(completed.workspace_revision_after, 8);

  const stale = await executeCapability(request(snapshot2, 7), fs);
  assert.equal(stale.status, 'refused');
  assert.equal(stale.error.kind, 'stale_workspace_revision');

  const traversal = await executeCapability(request({ revision: 9, files: { '../escape.py': 'nope' } }), fs);
  assert.equal(traversal.status, 'refused');
  assert.equal(traversal.error.kind, 'path_traversal');

  const collision = await executeCapability(request({ revision: 10, files: { 'a//b.py': '1', 'a/b.py': '2' } }), fs);
  assert.equal(collision.status, 'failed');
  assert.equal(collision.error.kind, 'path_collision');

  console.log('workspace-materialization: PASS');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
