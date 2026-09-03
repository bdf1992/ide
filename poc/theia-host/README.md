# Theia host spike (blocked)

Blocked before scaffolding: see the contract-engineer session's report for
ide-theia-hosts-the-state-packet-seam. No shell command (Bash or PowerShell)
could execute in this session — every invocation, including trivial ones like
`node --version` on the second attempt, `git --version`, and `ws --help`,
returned "This command requires approval" with no interactive approver
available to grant it. yarn/npm install and build, the ajv test run, the
Theia browser build, license-checker, and screenshot capture all require a
working shell and could not be attempted.

## IDE_PATCH/1 refusal (from index.html, copied verbatim per contract step 1)

Protocol/shape check (index.html `#previewPatch` handler):

```
if(p.protocol!=='IDE_PATCH/1'||!Array.isArray(p.changes))throw Error('Expected IDE_PATCH/1 with changes[]');
if(p.base_revision!=null&&String(p.base_revision)!==String(state.rev))throw Error(`Stale patch: expected revision ${p.base_revision}, current revision ${state.rev}`);
for(const c of p.changes)if(typeof c.path!=='string'||typeof c.content!=='string')throw Error('Each change needs path and content');
```

Exact refusal messages:

- `Expected IDE_PATCH/1 with changes[]` — wrong protocol string or `changes` is not an array.
- `` Stale patch: expected revision ${p.base_revision}, current revision ${state.rev} `` — `base_revision` is set and does not match the current workspace revision (`state.rev`), compared as strings.
- `Each change needs path and content` — a `changes[]` entry is missing a string `path` or `content`.
