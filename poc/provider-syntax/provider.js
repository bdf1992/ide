(() => {
  'use strict';

  const DEFAULTS = Object.freeze({
    runtimeWasmUrl: 'https://cdn.jsdelivr.net/npm/@vscode/tree-sitter-wasm@0.3.1/wasm/tree-sitter.wasm',
    pythonWasmUrl: 'https://cdn.jsdelivr.net/npm/@vscode/tree-sitter-wasm@0.3.1/wasm/tree-sitter-python.wasm',
    providerId: 'vscode-tree-sitter-wasm',
    providerVersion: '0.3.1',
    treeSitterVersion: '0.25.10',
    maxSourceChars: 200000,
    maxCaptures: 200,
    maxTreeDepth: 5,
    maxChildrenPerNode: 40,
  });

  const SUPPORTED = new Set(['syntax.tree', 'syntax.query']);
  let runtimeInitPromise = null;

  function capabilityResult(request, status, extra = {}) {
    return {
      protocol: 'CAPABILITY_RESULT/1',
      request_id: request?.request_id || 'unknown',
      capability: request?.capability || 'unknown',
      status,
      ...extra,
    };
  }

  function invalidRequest(request, message) {
    return capabilityResult(request, 'failed', {
      error: { kind: 'invalid_request', message },
    });
  }

  function validateRequest(request) {
    if (!request || request.protocol !== 'CAPABILITY_REQUEST/1') return 'Expected CAPABILITY_REQUEST/1.';
    if (typeof request.request_id !== 'string' || !request.request_id) return 'request_id is required.';
    if (typeof request.capability !== 'string' || !request.capability) return 'capability is required.';
    if (!request.actor || typeof request.actor.kind !== 'string' || typeof request.actor.id !== 'string') return 'actor.kind and actor.id are required.';
    if (!Object.prototype.hasOwnProperty.call(request, 'input')) return 'input is required.';
    return null;
  }

  function rangeOf(node) {
    return {
      start: { row: node.startPosition.row, column: node.startPosition.column, index: node.startIndex },
      end: { row: node.endPosition.row, column: node.endPosition.column, index: node.endIndex },
    };
  }

  function textOf(source, node, limit = 240) {
    const text = source.slice(node.startIndex, node.endIndex);
    return text.length <= limit ? text : `${text.slice(0, limit)}…`;
  }

  function summarizeNode(node, source, depth, limits) {
    const summary = {
      type: node.type,
      named: node.isNamed,
      range: rangeOf(node),
    };
    if (node.namedChildCount === 0) summary.text = textOf(source, node, 120);
    if (depth >= limits.maxTreeDepth) {
      if (node.namedChildCount) summary.truncated_children = node.namedChildCount;
      return summary;
    }
    const count = Math.min(node.namedChildCount, limits.maxChildrenPerNode);
    if (count) {
      summary.children = [];
      for (let i = 0; i < count; i += 1) {
        const child = node.namedChild(i);
        if (child) summary.children.push(summarizeNode(child, source, depth + 1, limits));
      }
      if (node.namedChildCount > count) summary.truncated_children = node.namedChildCount - count;
    }
    return summary;
  }

  class TreeSitterSyntaxProvider {
    constructor(options = {}) {
      this.options = { ...DEFAULTS, ...options };
      this.ready = false;
      this.initializing = null;
      this.parser = null;
      this.language = null;
      this.Query = null;
    }

    descriptor() {
      return {
        id: this.options.providerId,
        version: this.options.providerVersion,
        substrate: 'tree-sitter',
        substrate_version: this.options.treeSitterVersion,
        language: 'python',
        operations: [...SUPPORTED],
        authority: 'read-only syntax observation',
      };
    }

    async init() {
      if (this.ready) return this;
      if (this.initializing) return this.initializing;
      this.initializing = (async () => {
        const api = globalThis.TreeSitter;
        if (!api?.Parser || !api?.Language) throw new Error('TreeSitter browser runtime is unavailable.');
        const { Parser, Language, Query } = api;
        if (!runtimeInitPromise) {
          runtimeInitPromise = Parser.init({
            locateFile: (name) => name.endsWith('.wasm') ? this.options.runtimeWasmUrl : name,
          }).catch((error) => { runtimeInitPromise = null; throw error; });
        }
        await runtimeInitPromise;
        const language = await Language.load(this.options.pythonWasmUrl);
        const parser = new Parser();
        parser.setLanguage(language);
        this.parser = parser;
        this.language = language;
        this.Query = Query || null;
        this.ready = true;
        return this;
      })();
      try {
        return await this.initializing;
      } finally {
        this.initializing = null;
      }
    }

    async execute(request) {
      const validationError = validateRequest(request);
      if (validationError) return invalidRequest(request, validationError);
      if (!SUPPORTED.has(request.capability)) {
        return capabilityResult(request, 'unsupported', {
          error: { kind: 'unsupported_capability', message: `Unsupported capability: ${request.capability}` },
        });
      }
      const input = request.input || {};
      if (input.language !== 'python') {
        return capabilityResult(request, 'unsupported', {
          error: { kind: 'unsupported_language', message: `Unsupported language: ${String(input.language)}` },
        });
      }
      if (typeof input.source !== 'string') return invalidRequest(request, 'input.source must be a string.');
      if (input.source.length > this.options.maxSourceChars) {
        return capabilityResult(request, 'refused', {
          error: { kind: 'source_too_large', message: `Source exceeds ${this.options.maxSourceChars} characters.` },
        });
      }

      try {
        await this.init();
      } catch (error) {
        return capabilityResult(request, 'failed', {
          error: { kind: 'provider_unavailable', message: String(error?.message || error) },
        });
      }

      try {
        if (request.capability === 'syntax.tree') return this.syntaxTree(request);
        if (request.capability === 'syntax.query') return this.syntaxQuery(request);
        return capabilityResult(request, 'unsupported');
      } catch (error) {
        return capabilityResult(request, 'failed', {
          error: { kind: 'provider_error', message: String(error?.message || error) },
        });
      }
    }

    syntaxTree(request) {
      const source = request.input.source;
      const tree = this.parser.parse(source);
      try {
        return capabilityResult(request, 'completed', {
          output: {
            provider: this.descriptor(),
            language: 'python',
            has_error: Boolean(tree.rootNode.hasError),
            tree: summarizeNode(tree.rootNode, source, 0, this.options),
          },
        });
      } finally {
        tree.delete();
      }
    }

    syntaxQuery(request) {
      const source = request.input.source;
      const querySource = request.input.query;
      if (typeof querySource !== 'string' || !querySource.trim()) return invalidRequest(request, 'input.query must be a non-empty Tree-sitter query string.');
      const tree = this.parser.parse(source);
      let query = null;
      try {
        query = this.Query ? new this.Query(this.language, querySource) : this.language.query(querySource);
        const captures = query.captures(tree.rootNode).slice(0, this.options.maxCaptures).map((capture) => ({
          name: capture.name,
          node_type: capture.node.type,
          text: textOf(source, capture.node),
          range: rangeOf(capture.node),
        }));
        return capabilityResult(request, 'completed', {
          output: {
            provider: this.descriptor(),
            language: 'python',
            has_error: Boolean(tree.rootNode.hasError),
            capture_count: captures.length,
            captures,
          },
        });
      } finally {
        if (query?.delete) query.delete();
        tree.delete();
      }
    }
  }

  globalThis.OpenChatSyntaxProvider = Object.freeze({
    TreeSitterSyntaxProvider,
    defaults: DEFAULTS,
  });
})();
