(() => {
  'use strict';

  const FIXTURES = {
    calculator: '../../examples/core-acceptance/scientific_calculator.py',
    kanban: '../../examples/core-acceptance/kanban.py',
  };

  const FUNCTION_QUERY = '(function_definition name: (identifier) @name) @definition.function';
  const CLASS_QUERY = '(class_definition name: (identifier) @name) @definition.class';
  const $ = (id) => document.getElementById(id);
  const provider = new OpenChatSyntaxProvider.TreeSitterSyntaxProvider();
  let requestCounter = 0;

  function request(capability, input) {
    requestCounter += 1;
    return {
      protocol: 'CAPABILITY_REQUEST/1',
      request_id: `syntax-lab-${requestCounter}`,
      capability,
      actor: { kind: 'system', id: 'provider-syntax-lab' },
      input,
      requested_effect: 'read-only syntax observation',
    };
  }

  function show(value) {
    $('output').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }

  function status(text, kind = '') {
    const node = $('status');
    node.textContent = text;
    node.dataset.kind = kind;
  }

  async function loadFixture(name) {
    const response = await fetch(FIXTURES[name], { cache: 'no-store' });
    if (!response.ok) throw new Error(`Fixture fetch failed: ${response.status} ${response.statusText}`);
    const source = await response.text();
    $('source').value = source;
    $('fixture').value = name;
    return source;
  }

  async function runCapability(capability, input) {
    status(`Running ${capability}…`);
    const result = await provider.execute(request(capability, input));
    show(result);
    status(`${capability}: ${result.status}`, result.status === 'completed' ? 'pass' : 'fail');
    return result;
  }

  async function parseTree() {
    return runCapability('syntax.tree', { language: 'python', source: $('source').value });
  }

  async function runQuery() {
    return runCapability('syntax.query', {
      language: 'python',
      source: $('source').value,
      query: $('query').value,
    });
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function capturedNames(result) {
    return (result.output?.captures || []).filter((capture) => capture.name === 'name').map((capture) => capture.text);
  }

  async function selfTest() {
    const report = [];
    const check = async (name, fn) => {
      try {
        await fn();
        report.push({ name, status: 'PASS' });
      } catch (error) {
        report.push({ name, status: 'FAIL', error: String(error?.message || error) });
      }
    };

    status('Running provider acceptance…');

    let calculator = '';
    let kanban = '';

    await check('load calculator fixture', async () => { calculator = await (await fetch(FIXTURES.calculator, { cache: 'no-store' })).text(); assert(calculator.includes('calculator: PASS'), 'calculator fixture did not load'); });
    await check('load kanban fixture', async () => { kanban = await (await fetch(FIXTURES.kanban, { cache: 'no-store' })).text(); assert(kanban.includes('kanban: PASS'), 'kanban fixture did not load'); });

    await check('calculator parses without syntax error', async () => {
      const result = await provider.execute(request('syntax.tree', { language: 'python', source: calculator }));
      assert(result.status === 'completed', `status=${result.status}`);
      assert(result.output?.has_error === false, 'calculator parse has syntax error');
    });

    await check('calculator function definitions are addressable', async () => {
      const result = await provider.execute(request('syntax.query', { language: 'python', source: calculator, query: FUNCTION_QUERY }));
      assert(result.status === 'completed', `status=${result.status}`);
      const names = capturedNames(result);
      assert(names.length >= 2, `expected multiple functions, got ${names.length}`);
    });

    await check('kanban parses without syntax error', async () => {
      const result = await provider.execute(request('syntax.tree', { language: 'python', source: kanban }));
      assert(result.status === 'completed', `status=${result.status}`);
      assert(result.output?.has_error === false, 'kanban parse has syntax error');
    });

    await check('Task and Board class definitions are addressable', async () => {
      const result = await provider.execute(request('syntax.query', { language: 'python', source: kanban, query: CLASS_QUERY }));
      assert(result.status === 'completed', `status=${result.status}`);
      const names = capturedNames(result);
      assert(names.includes('Task'), `Task missing: ${names.join(', ')}`);
      assert(names.includes('Board'), `Board missing: ${names.join(', ')}`);
    });

    await check('malformed Python returns typed parse evidence', async () => {
      const result = await provider.execute(request('syntax.tree', { language: 'python', source: 'def broken(:\n    pass\n' }));
      assert(result.status === 'completed', `status=${result.status}`);
      assert(result.output?.has_error === true, 'malformed Python was not marked has_error');
    });

    await check('unsupported language is explicit', async () => {
      const result = await provider.execute(request('syntax.tree', { language: 'javascript', source: 'const x = 1;' }));
      assert(result.status === 'unsupported', `status=${result.status}`);
      assert(result.error?.kind === 'unsupported_language', `kind=${result.error?.kind}`);
    });

    await check('provider-unavailable failure is bounded', async () => {
      const unavailable = new OpenChatSyntaxProvider.TreeSitterSyntaxProvider({
        pythonWasmUrl: './definitely-missing-tree-sitter-python.wasm',
      });
      const result = await unavailable.execute(request('syntax.tree', { language: 'python', source: 'x = 1\n' }));
      assert(result.status === 'failed', `status=${result.status}`);
      assert(result.error?.kind === 'provider_unavailable', `kind=${result.error?.kind}`);
    });

    const passed = report.filter((item) => item.status === 'PASS').length;
    const failed = report.length - passed;
    show({
      protocol: 'PROVIDER_ACCEPTANCE/1',
      provider: provider.descriptor(),
      passed,
      failed,
      checks: report,
    });
    status(`Acceptance: ${passed}/${report.length} passed`, failed ? 'fail' : 'pass');
  }

  $('fixture').addEventListener('change', () => loadFixture($('fixture').value).catch((error) => { status('Fixture load failed', 'fail'); show(String(error)); }));
  $('tree').addEventListener('click', () => parseTree().catch((error) => { status('syntax.tree failed', 'fail'); show(String(error)); }));
  $('runQuery').addEventListener('click', () => runQuery().catch((error) => { status('syntax.query failed', 'fail'); show(String(error)); }));
  $('functions').addEventListener('click', () => { $('query').value = FUNCTION_QUERY; runQuery().catch((error) => { status('function query failed', 'fail'); show(String(error)); }); });
  $('classes').addEventListener('click', () => { $('query').value = CLASS_QUERY; runQuery().catch((error) => { status('class query failed', 'fail'); show(String(error)); }); });
  $('selfTest').addEventListener('click', () => selfTest().catch((error) => { status('Acceptance crashed', 'fail'); show(String(error)); }));

  $('query').value = FUNCTION_QUERY;
  loadFixture('calculator').then(() => status('Fixture loaded. Provider initializes on first request.')).catch((error) => { status('Fixture load failed', 'fail'); show(String(error)); });
})();
