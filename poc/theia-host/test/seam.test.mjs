import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

import { buildStatePacket, applyPatch, buildExecutionResult, checkPatch } from '../extension/lib/seam.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

const ajv = new Ajv2020({ strict: false });

function loadSchema(name) {
  return JSON.parse(readFileSync(path.join(repoRoot, 'contracts', name), 'utf8'));
}

const statePacketSchema = loadSchema('ide-state-packet.schema.json');
const executionResultSchema = loadSchema('execution-result.schema.json');

test('emitted state packet validates against IDE_STATE_PACKET/1', () => {
  const packet = buildStatePacket({
    workspaceRevision: 0,
    activeFile: 'main.py',
    openTabs: ['main.py', 'notes.md'],
    selection: '',
    files: { 'main.py': "print('hi')\n" },
    terminal: '$ python main.py\nhi\n'
  });
  const validate = ajv.compile(statePacketSchema);
  const valid = validate(packet);
  assert.equal(valid, true, JSON.stringify(validate.errors));
  assert.equal(packet.protocol, 'IDE_STATE_PACKET/1');
});

test('execution result validates against EXECUTION_RESULT/1', () => {
  const result = buildExecutionResult({
    executionId: 'exec-test-1',
    runtimeKind: 'other',
    runtimeVersion: 'system-python',
    status: 'success',
    observations: [{ exitCode: 0 }],
    programId: 'main.py'
  });
  const validate = ajv.compile(executionResultSchema);
  const valid = validate(result);
  assert.equal(valid, true, JSON.stringify(validate.errors));
});

test('applying fixtures/patch.json to fixtures/workspace.json updates file contents', () => {
  const workspace = JSON.parse(readFileSync(path.join(here, '..', 'fixtures', 'workspace.json'), 'utf8'));
  const patch = JSON.parse(readFileSync(path.join(here, '..', 'fixtures', 'patch.json'), 'utf8'));
  const result = applyPatch(workspace.files, patch, workspace.revision);
  assert.equal(result.files['main.py'], "print('hello from the applied patch')\n");
  assert.equal(result.revision, workspace.revision + 1);
  assert.equal(result.files['notes.md'], workspace.files['notes.md']);
});

test('a stale base_revision is refused with the exact index.html message', () => {
  const workspace = JSON.parse(readFileSync(path.join(here, '..', 'fixtures', 'workspace.json'), 'utf8'));
  const stalePatch = {
    protocol: 'IDE_PATCH/1',
    base_revision: 99,
    changes: [{ path: 'main.py', content: 'x' }]
  };
  assert.throws(
    () => checkPatch(stalePatch, workspace.revision),
    (err) => err.message === `Stale patch: expected revision 99, current revision ${workspace.revision}`
  );
});

test('a malformed protocol/changes patch is refused with the exact message', () => {
  assert.throws(
    () => checkPatch({ protocol: 'IDE_PATCH/1', changes: 'not-an-array' }, 0),
    (err) => err.message === 'Expected IDE_PATCH/1 with changes[]'
  );
});

test('a change missing path or content is refused with the exact message', () => {
  assert.throws(
    () => checkPatch({ protocol: 'IDE_PATCH/1', base_revision: 0, changes: [{ path: 'a.py' }] }, 0),
    (err) => err.message === 'Each change needs path and content'
  );
});
