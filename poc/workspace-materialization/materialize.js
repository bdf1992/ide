(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpenChatWorkspaceMaterialization = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_ROOT = '/workspace/views';
  const MAX_FILES = 5000;
  const MAX_TOTAL_CHARS = 20_000_000;

  class MaterializationError extends Error {
    constructor(kind, message, details = {}) {
      super(message);
      this.name = 'MaterializationError';
      this.kind = kind;
      this.details = details;
    }
  }

  function fnv1a(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  function normalizeWorkspacePath(input) {
    if (typeof input !== 'string' || !input.length) {
      throw new MaterializationError('invalid_path', 'Workspace path must be a non-empty string.', { path: input });
    }
    if (input.includes('\0')) {
      throw new MaterializationError('invalid_path', 'Workspace path may not contain NUL.', { path: input });
    }
    const slash = input.replace(/\\/g, '/');
    if (slash.startsWith('/') || /^[A-Za-z]:\//.test(slash)) {
      throw new MaterializationError('absolute_path', 'Absolute workspace paths are not allowed.', { path: input });
    }
    const rawSegments = slash.split('/');
    if (rawSegments.some((segment) => segment === '..')) {
      throw new MaterializationError('path_traversal', 'Parent traversal is not allowed in workspace paths.', { path: input });
    }
    const segments = rawSegments.filter((segment) => segment && segment !== '.');
    if (!segments.length) {
      throw new MaterializationError('invalid_path', 'Workspace path resolves to an empty path.', { path: input });
    }
    return segments.join('/');
  }

  function joinUnder(rootPath, relativePath) {
    return `${rootPath.replace(/\/$/, '')}/${relativePath}`;
  }

  function collectDirectories(paths) {
    const dirs = new Set();
    for (const path of paths) {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i += 1) dirs.add(parts.slice(0, i).join('/'));
    }
    return [...dirs].sort((a, b) => {
      const depth = a.split('/').length - b.split('/').length;
      return depth || a.localeCompare(b);
    });
  }

  function createPlan(snapshot, options = {}) {
    if (!snapshot || !Object.prototype.hasOwnProperty.call(snapshot, 'revision')) {
      throw new MaterializationError('invalid_snapshot', 'Workspace snapshot requires revision.');
    }
    if (!snapshot.files || typeof snapshot.files !== 'object' || Array.isArray(snapshot.files)) {
      throw new MaterializationError('invalid_snapshot', 'Workspace snapshot requires a files object.');
    }

    const sourceEntries = Object.entries(snapshot.files);
    if (sourceEntries.length > (options.maxFiles || MAX_FILES)) {
      throw new MaterializationError('too_many_files', `Workspace exceeds ${options.maxFiles || MAX_FILES} files.`);
    }

    const normalized = new Map();
    let totalChars = 0;
    for (const [originalPath, content] of sourceEntries) {
      if (typeof content !== 'string') {
        throw new MaterializationError('unsupported_file', 'Only text workspace files can be materialized by this POC.', { path: originalPath });
      }
      const path = normalizeWorkspacePath(originalPath);
      if (normalized.has(path)) {
        throw new MaterializationError('path_collision', 'Two workspace paths normalize to the same materialized path.', { path, source_paths: [normalized.get(path).sourcePath, originalPath] });
      }
      totalChars += content.length;
      if (totalChars > (options.maxTotalChars || MAX_TOTAL_CHARS)) {
        throw new MaterializationError('workspace_too_large', `Workspace exceeds ${options.maxTotalChars || MAX_TOTAL_CHARS} text characters.`);
      }
      normalized.set(path, { path, content, sourcePath: originalPath });
    }

    const files = [...normalized.values()].sort((a, b) => a.path.localeCompare(b.path));
    const manifestText = files.map((entry) => `${entry.path}\0${entry.content.length}\0${entry.content}`).join('\0');
    const manifestId = `fnv1a32-${fnv1a(manifestText)}`;
    const revisionId = fnv1a(String(snapshot.revision));
    const baseRoot = options.rootBase || DEFAULT_ROOT;
    if (!baseRoot.startsWith('/')) throw new MaterializationError('invalid_root', 'Materialization root must be absolute and provider-owned.');
    const rootPath = `${baseRoot.replace(/\/$/, '')}/r-${revisionId}-${manifestId.replace('fnv1a32-', '')}`;

    return Object.freeze({
      protocol: 'WORKSPACE_MATERIALIZATION_PLAN/1',
      revision: snapshot.revision,
      root: rootPath,
      manifest_id: manifestId,
      file_count: files.length,
      total_chars: totalChars,
      directories: collectDirectories(files.map((entry) => entry.path)),
      files: files.map((entry) => Object.freeze({ path: entry.path, content: entry.content })),
    });
  }

  async function materialize(plan, fs) {
    if (!plan || plan.protocol !== 'WORKSPACE_MATERIALIZATION_PLAN/1') {
      throw new MaterializationError('invalid_plan', 'Expected WORKSPACE_MATERIALIZATION_PLAN/1.');
    }
    if (!fs || typeof fs.resetRoot !== 'function' || typeof fs.mkdir !== 'function' || typeof fs.writeFile !== 'function') {
      throw new MaterializationError('invalid_filesystem', 'Filesystem adapter requires resetRoot, mkdir, and writeFile.');
    }

    await fs.resetRoot(plan.root);
    await fs.mkdir(plan.root);
    for (const relativeDir of plan.directories) await fs.mkdir(joinUnder(plan.root, relativeDir));
    for (const file of plan.files) await fs.writeFile(joinUnder(plan.root, file.path), file.content);

    return Object.freeze({
      protocol: 'WORKSPACE_MATERIALIZATION/1',
      revision: plan.revision,
      root: plan.root,
      manifest_id: plan.manifest_id,
      file_count: plan.file_count,
      total_chars: plan.total_chars,
      authority: 'derived-read-view',
    });
  }

  function capabilityResult(request, status, extra = {}) {
    return {
      protocol: 'CAPABILITY_RESULT/1',
      request_id: request?.request_id || 'unknown',
      capability: request?.capability || 'workspace.materialize',
      status,
      ...extra,
    };
  }

  async function executeCapability(request, fs, options = {}) {
    if (!request || request.protocol !== 'CAPABILITY_REQUEST/1' || request.capability !== 'workspace.materialize') {
      return capabilityResult(request, 'unsupported', { error: { kind: 'unsupported_capability', message: 'Expected workspace.materialize.' } });
    }
    if (!request.actor || typeof request.actor.kind !== 'string' || typeof request.actor.id !== 'string') {
      return capabilityResult(request, 'failed', { error: { kind: 'invalid_request', message: 'actor.kind and actor.id are required.' } });
    }
    try {
      const snapshot = request.input?.snapshot;
      const plan = createPlan(snapshot, options);
      if (request.workspace_revision != null && String(request.workspace_revision) !== String(plan.revision)) {
        return capabilityResult(request, 'refused', {
          error: { kind: 'stale_workspace_revision', message: `Request revision ${request.workspace_revision} does not match snapshot revision ${plan.revision}.` },
        });
      }
      const descriptor = await materialize(plan, fs);
      return capabilityResult(request, 'completed', {
        output: descriptor,
        workspace_revision_before: plan.revision,
        workspace_revision_after: plan.revision,
      });
    } catch (error) {
      const kind = error instanceof MaterializationError ? error.kind : 'materialization_failed';
      return capabilityResult(request, kind === 'path_traversal' || kind === 'absolute_path' ? 'refused' : 'failed', {
        error: { kind, message: String(error?.message || error) },
      });
    }
  }

  return Object.freeze({
    MaterializationError,
    normalizeWorkspacePath,
    createPlan,
    materialize,
    executeCapability,
  });
});
