// Extracts the <script id="seam"> block from index.html and runs it under
// Node against a fixture services object, without a browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const indexHtml = readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const stateSchema = JSON.parse(readFileSync(path.join(repoRoot, 'contracts', 'ide-state-packet.schema.json'), 'utf8'));

function extractSeamBlock(html) {
  const match = html.match(/<script id="seam">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No <script id="seam"> block found in index.html');
  return match[1];
}

// Minimal checker for the fields ide-state-packet.schema.json actually requires.
function assertMatchesStatePacketSchema(packet, schema) {
  assert.equal(typeof packet, 'object', 'packet must be an object');
  for (const field of schema.required) {
    assert.ok(field in packet, `packet missing required field "${field}"`);
  }
  assert.equal(packet.protocol, schema.properties.protocol.const, 'protocol must match schema const');
  assert.ok(
    typeof packet.workspace_revision === 'number' || typeof packet.workspace_revision === 'string',
    'workspace_revision must be integer or string'
  );
  assert.equal(typeof packet.active_file, 'string', 'active_file must be a string');
  assert.ok(Array.isArray(packet.open_tabs), 'open_tabs must be an array');
  for (const tab of packet.open_tabs) assert.equal(typeof tab, 'string', 'open_tabs items must be strings');
  assert.equal(new Set(packet.open_tabs).size, packet.open_tabs.length, 'open_tabs must have unique items');
  assert.equal(typeof packet.files, 'object', 'files must be an object');
  for (const [, content] of Object.entries(packet.files)) {
    assert.equal(typeof content, 'string', 'each files value must be a string');
  }
}

const seamSource = extractSeamBlock(indexHtml);
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(seamSource, sandbox, { filename: 'index.html#seam' });
const IdeSeam = sandbox.window.IdeSeam;
assert.ok(IdeSeam, 'window.IdeSeam was not defined by the seam block');
assert.equal(typeof IdeSeam.buildStatePacket, 'function', 'IdeSeam.buildStatePacket must be a function');
assert.equal(typeof IdeSeam.applyPatch, 'function', 'IdeSeam.applyPatch must be a function');

function makeFixtureServices() {
  const files = { 'main.py': 'print(1)\n', 'README.md': '# fixture\n' };
  const state = { revision: 5, files };
  return {
    workspace: { revision: state.revision, files: state.files, canonical_repo: 'https://github.com/bdf1992/ide' },
    editor: { active_file: 'main.py', open_tabs: ['main.py', 'README.md'], selection: '' },
    terminal: { lines: '$ python main.py\n1\n' },
    write(p, content) { state.files[p] = content; },
    bumpRevision() { state.revision += 1; },
    _state: state
  };
}

// 1. buildStatePacket() output validates against contracts/ide-state-packet.schema.json.
const services = makeFixtureServices();
const packet = IdeSeam.buildStatePacket(services);
assertMatchesStatePacketSchema(packet, stateSchema);

// 2. A stale base_revision is refused with the exact message.
const staleServices = makeFixtureServices();
const stalePatch = { protocol: 'IDE_PATCH/1', base_revision: staleServices.workspace.revision - 1, changes: [{ path: 'main.py', content: 'print(2)\n' }] };
assert.throws(
  () => IdeSeam.applyPatch(staleServices, stalePatch),
  (err) => err.message === `Stale patch: expected revision ${stalePatch.base_revision}, current revision ${staleServices.workspace.revision}`,
  'stale base_revision must be refused with the exact message'
);
assert.equal(staleServices._state.files['main.py'], 'print(1)\n', 'a refused patch must not write files');

// 3. An in-revision patch changes the fixture files.
const applyServices = makeFixtureServices();
const inRevisionPatch = {
  protocol: 'IDE_PATCH/1',
  base_revision: applyServices.workspace.revision,
  changes: [{ path: 'main.py', content: 'print(2)\n' }, { path: 'notes.txt', content: 'hello\n' }]
};
IdeSeam.applyPatch(applyServices, inRevisionPatch);
assert.equal(applyServices._state.files['main.py'], 'print(2)\n', 'in-revision patch must overwrite an existing file');
assert.equal(applyServices._state.files['notes.txt'], 'hello\n', 'in-revision patch must write a new file');
assert.equal(applyServices._state.revision, 6, 'in-revision patch must bump the revision by one');

console.log('seam_test: ok (3 assertions: schema-valid packet, stale-revision refusal, in-revision patch write)');
