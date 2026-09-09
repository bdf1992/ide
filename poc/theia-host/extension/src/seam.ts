/**
 * Envelope rules for the IDE_STATE_PACKET/1, IDE_PATCH/1 and EXECUTION_RESULT/1
 * seam. No Theia import here: this file runs under plain Node so
 * `test/seam.test.mjs` can validate it against the schemas in `contracts/`
 * without a Theia runtime.
 */

export interface StatePacketInput {
  workspaceRevision: number | string;
  activeFile: string;
  openTabs: string[];
  selection?: string;
  files: Record<string, string>;
  terminal?: string;
  canonicalRepo?: string;
  request?: string;
}

export interface StatePacket {
  protocol: 'IDE_STATE_PACKET/1';
  workspace_revision: number | string;
  active_file: string;
  open_tabs: string[];
  selection: string;
  files: Record<string, string>;
  terminal: string;
  canonical_repo?: string;
  request?: string;
}

export function buildStatePacket(input: StatePacketInput): StatePacket {
  const packet: StatePacket = {
    protocol: 'IDE_STATE_PACKET/1',
    workspace_revision: input.workspaceRevision,
    active_file: input.activeFile,
    open_tabs: [...input.openTabs],
    selection: input.selection ?? '',
    files: { ...input.files },
    terminal: input.terminal ?? ''
  };
  if (input.canonicalRepo !== undefined) {
    packet.canonical_repo = input.canonicalRepo;
  }
  if (input.request !== undefined) {
    packet.request = input.request;
  }
  return packet;
}

export interface PatchChange {
  path: string;
  content: string;
}

export interface Patch {
  protocol: string;
  base_revision?: number | string | null;
  proposal_id?: string;
  proposed_by?: string;
  note?: string;
  changes: PatchChange[];
}

/**
 * Same refusal rule and exact messages as index.html's `#previewPatch`
 * handler (copied verbatim into poc/theia-host/README.md per contract step 1).
 */
export function checkPatch(p: Patch, currentRevision: number | string): void {
  if (p.protocol !== 'IDE_PATCH/1' || !Array.isArray(p.changes)) {
    throw new Error('Expected IDE_PATCH/1 with changes[]');
  }
  if (p.base_revision != null && String(p.base_revision) !== String(currentRevision)) {
    throw new Error(`Stale patch: expected revision ${p.base_revision}, current revision ${currentRevision}`);
  }
  for (const c of p.changes) {
    if (typeof c.path !== 'string' || typeof c.content !== 'string') {
      throw new Error('Each change needs path and content');
    }
  }
}

export interface ApplyPatchResult {
  files: Record<string, string>;
  revision: number;
}

/**
 * Applies a checked patch to `files`, returning updated file contents and
 * the incremented revision. Throws the same refusal as `checkPatch` if the
 * patch does not pass.
 */
export function applyPatch(
  files: Record<string, string>,
  patch: Patch,
  currentRevision: number
): ApplyPatchResult {
  checkPatch(patch, currentRevision);
  const next = { ...files };
  for (const c of patch.changes) {
    next[c.path] = c.content;
  }
  return { files: next, revision: currentRevision + 1 };
}

export type RuntimeKind = 'kernel-reference' | 'cpython-pyodide' | 'other';

export interface ExecutionResultInput {
  executionId: string;
  runtimeKind: RuntimeKind;
  runtimeVersion: string;
  status: 'success' | 'failure';
  observations: unknown[];
  error?: { kind: string; message?: string } | null;
  programId?: string;
}

export interface ExecutionResult {
  protocol: 'EXECUTION_RESULT/1';
  execution_id: string;
  program_id?: string;
  runtime: { kind: RuntimeKind; version: string };
  status: 'success' | 'failure';
  error: { kind: string; message?: string } | null;
  observations: unknown[];
}

export function buildExecutionResult(input: ExecutionResultInput): ExecutionResult {
  const result: ExecutionResult = {
    protocol: 'EXECUTION_RESULT/1',
    execution_id: input.executionId,
    runtime: { kind: input.runtimeKind, version: input.runtimeVersion },
    status: input.status,
    error: input.error ?? null,
    observations: input.observations
  };
  if (input.programId !== undefined) {
    result.program_id = input.programId;
  }
  return result;
}
