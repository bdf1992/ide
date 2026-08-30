(() => {
  'use strict';

  const PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v314.0.6/full/';
  const FIXTURES = {
    'scientific_calculator.py': '../../examples/core-acceptance/scientific_calculator.py',
    'kanban.py': '../../examples/core-acceptance/kanban.py',
    'multifile/main.py': '../../examples/core-acceptance/multifile/main.py',
    'multifile/math_core.py': '../../examples/core-acceptance/multifile/math_core.py',
  };

  const $ = (id) => document.getElementById(id);
  let runtimePromise = null;
  let requestCounter = 0;

  function show(value) {
    $('output').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  function status(text, kind = '') {
    $('status').textContent = text;
    $('status').dataset.kind = kind;
  }

  async function loadPyodideRuntime() {
    if (runtimePromise) return runtimePromise;
    runtimePromise = (async () => {
      status('Loading Pyodide 314.0.6…');
      const module = await import(`${PYODIDE_INDEX}pyodide.mjs`);
      const pyodide = await module.loadPyodide({ indexURL: PYODIDE_INDEX });
      status('Pyodide ready.');
      return pyodide;
    })().catch((error) => {
      runtimePromise = null;
      throw error;
    });
    return runtimePromise;
  }

  async function loadSnapshot() {
    const files = {};
    for (const [path, url] of Object.entries(FIXTURES)) {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Fixture fetch failed for ${path}: ${response.status}`);
      files[path] = await response.text();
    }
    return { revision: 'core-acceptance-1', files };
  }

  function request(snapshot, revision = snapshot.revision) {
    requestCounter += 1;
    return {
      protocol: 'CAPABILITY_REQUEST/1',
      request_id: `workspace-materialization-lab-${requestCounter}`,
      capability: 'workspace.materialize',
      actor: { kind: 'system', id: 'workspace-materialization-lab' },
      workspace_revision: revision,
      input: { snapshot },
      requested_effect: 'derived workspace read view',
    };
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  async function runAcceptance() {
    const report = [];
    const check = async (name, fn) => {
      try {
        const details = await fn();
        report.push({ name, status: 'PASS', ...(details ? { details } : {}) });
      } catch (error) {
        report.push({ name, status: 'FAIL', error: String(error?.message || error) });
      }
    };

    status('Running workspace materialization acceptance…');
    let pyodide;
    let adapter;
    let snapshot;
    let materialized;

    await check('load Pyodide runtime', async () => {
      pyodide = await loadPyodideRuntime();
      adapter = new OpenChatPyodideWorkspace.PyodideFilesystemAdapter(pyodide);
      return { version: '314.0.6' };
    });

    await check('load canonical acceptance snapshot', async () => {
      snapshot = await loadSnapshot();
      assert(Object.keys(snapshot.files).length === 4, 'expected four fixture files');
      return { revision: snapshot.revision, files: Object.keys(snapshot.files) };
    });

    await check('workspace.materialize completes', async () => {
      const result = await OpenChatWorkspaceMaterialization.executeCapability(request(snapshot), adapter);
      assert(result.status === 'completed', `${result.status}: ${result.error?.kind || ''}`);
      materialized = result.output;
      assert(materialized.authority === 'derived-read-view', `authority=${materialized.authority}`);
      assert(materialized.file_count === 4, `file_count=${materialized.file_count}`);
      return materialized;
    });

    await check('calculator executes from materialized view', async () => {
      const result = await OpenChatPyodideWorkspace.runPythonFile(pyodide, materialized, 'scientific_calculator.py');
      assert(result.status === 'completed', result.error || 'calculator failed');
      assert(result.stdout.includes('calculator: PASS'), result.stdout || 'missing calculator PASS');
      return { stdout: result.stdout.trim() };
    });

    await check('kanban executes from materialized view', async () => {
      const result = await OpenChatPyodideWorkspace.runPythonFile(pyodide, materialized, 'kanban.py');
      assert(result.status === 'completed', result.error || 'kanban failed');
      assert(result.stdout.includes('kanban: PASS'), result.stdout || 'missing kanban PASS');
      return { final_line: result.stdout.trim().split('\n').at(-1) };
    });

    await check('multi-file sibling import executes generically', async () => {
      const result = await OpenChatPyodideWorkspace.runPythonFile(pyodide, materialized, 'multifile/main.py');
      assert(result.status === 'completed', result.error || 'multifile failed');
      assert(result.stdout.includes('multifile: PASS'), result.stdout || 'missing multifile PASS');
      return { stdout: result.stdout.trim() };
    });

    await check('runtime writes disappear on rematerialization', async () => {
      const derivedPath = `${materialized.root}/runtime-created.txt`;
      await adapter.writeFile(derivedPath, 'derived only');
      assert(adapter.exists(derivedPath), 'derived write was not created');
      assert(!Object.prototype.hasOwnProperty.call(snapshot.files, 'runtime-created.txt'), 'canonical snapshot was mutated');
      const result = await OpenChatWorkspaceMaterialization.executeCapability(request(snapshot), adapter);
      assert(result.status === 'completed', `rematerialize status=${result.status}`);
      assert(!adapter.exists(derivedPath), 'derived write survived rematerialization');
      materialized = result.output;
    });

    await check('path traversal is refused before filesystem write', async () => {
      const bad = { revision: 'bad-path', files: { '../escape.py': 'print(1)' } };
      const result = await OpenChatWorkspaceMaterialization.executeCapability(request(bad), adapter);
      assert(result.status === 'refused', `status=${result.status}`);
      assert(result.error?.kind === 'path_traversal', `kind=${result.error?.kind}`);
    });

    await check('stale workspace revision is refused', async () => {
      const result = await OpenChatWorkspaceMaterialization.executeCapability(request(snapshot, 'older-revision'), adapter);
      assert(result.status === 'refused', `status=${result.status}`);
      assert(result.error?.kind === 'stale_workspace_revision', `kind=${result.error?.kind}`);
    });

    const passed = report.filter((item) => item.status === 'PASS').length;
    const failed = report.length - passed;
    const result = {
      protocol: 'WORKSPACE_MATERIALIZATION_ACCEPTANCE/1',
      passed,
      failed,
      checks: report,
      stable_ide_modified: false,
    };
    show(result);
    status(`Acceptance: ${passed}/${report.length} passed`, failed ? 'fail' : 'pass');
  }

  $('run').addEventListener('click', () => runAcceptance().catch((error) => {
    status('Acceptance crashed', 'fail');
    show({ error: String(error?.stack || error) });
  }));
})();
