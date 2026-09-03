# Theia host spike

A Theia 1.75.0 browser application under `poc/theia-host`, carrying one
extension (`extension/`, package `@poc/ide-seam`) that emits an
`IDE_STATE_PACKET/1` for the opened workspace and applies an `IDE_PATCH/1`
with the same base-revision staleness refusal `index.html` enforces, plus an
adversarial `python.run` command wrapping Python execution as
`EXECUTION_RESULT/1`.

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

`poc/theia-host/extension/src/seam.ts` (`checkPatch`) reproduces these three
checks and messages exactly; `poc/theia-host/test/seam.test.mjs` asserts both
the stale-revision and malformed-patch cases against the literal strings
above.

## Build

Environment: node v24.11.1, npm 11.6.2, yarn 1.22.22 (Windows, git-bash).

Install (yarn install, workspace root, warm yarn cache, clean node_modules/lib/src-gen):
- wall time: 29s (`yarn` reported "Done in 26.56s").
- node_modules size: 386M, 549 top-level entries.
- no native module was compiled from source (keytar, drivelist and other native deps used prebuilt binaries).
- full log: `evidence/yarn-install-fresh.log`.

Build (`tsc` for the extension, then `theia build --mode production` for browser-app):
- wall time: 9s ("[build/browser] Finished with 0 errors in 1950ms"; "[build/node] Finished with 0 errors in 1023ms").
- optional `@theia/electron` peer dependency skipped — no Electron packages installed or built.
- full log: `evidence/theia-build.log`.

`@theia/core` 1.75.0 declares `react`/`react-dom` `^19.0.0` as peer
dependencies and its compiled browser code imports the bare `react`,
`react-dom` and `react/jsx-runtime` specifiers directly (not only through
`@theia/core/shared/react`). Neither `browser-app` nor the extension declared
these as real dependencies at first, which failed the build with 38 esbuild
"Could not resolve react..." errors; fixed by adding `react`/`react-dom`
`^19.0.0` to `browser-app`'s dependencies and `@types/react`/`@types/react-dom`
`^19.0.0` to the extension's devDependencies.

Two defects were found and fixed after the first clean build and evidence
run, both in this spike's own code, not upstream:

- **Double command registration.** `ide-seam-frontend-module.ts` bound
  `CommandContribution`, `MenuContribution` and `KeybindingContribution` to
  `IdeSeamContribution` explicitly, on top of `bindViewContribution()`, which
  already binds all three for any `AbstractViewContribution` subclass. Every
  `ideSeam.*` command (and the view's own toggle command) was registered
  twice, logged as `core:CommandRegistry WARN A command ... is already
  registered.` on every frontend connection. Fixed by dropping the redundant
  explicit binds; `FrontendApplicationContribution` still needs its own bind
  since `bindViewContribution()` does not provide it.
- **Wrong CLI working directory.** The `theia` CLI's `start` command resolves
  the app directory (and its generated `src-gen/backend/main.js`) from
  `process.cwd()`, not from a path argument. Launching it from
  `poc/theia-host` (which still has its own stale `src-gen` from an earlier
  scaffolding step) instead of `poc/theia-host/browser-app` loaded the wrong,
  incomplete backend bundle and crashed with `No matching bindings found for
  serviceIdentifier: Symbol(RequestService)`. Fixed by starting the server
  with a small wrapper (`evidence/start-server.cjs`) that `process.chdir()`s
  into `browser-app` before requiring the CLI.

## Extension

`extension/src/seam.ts` holds every envelope rule (`buildStatePacket`,
`checkPatch`, `applyPatch`, `buildExecutionResult`) with no Theia import, so
`test/seam.test.mjs` runs it under plain Node against the schemas in
`contracts/`.

`extension/src/browser/` is the Theia-side adapter:

- `ide-seam-service.ts` — gathers packet fields from Theia's own services
  (`WorkspaceService`, `FileService`, `EditorManager`, `TerminalService`)
  rather than tracking them itself, and owns the seam's revision counter,
  incremented on every applied patch and on every editor save observed
  through `EditorManager`'s `Saveable#onDirtyChanged`.
- `ide-seam-contribution.ts` — a `CommandContribution` (`ideSeam.statePacket`,
  `ideSeam.applyPatch`, `ideSeam.runPython`), `MenuContribution` (Edit menu),
  `KeybindingContribution`, and an `AbstractViewContribution` opening the
  `SeamWidget`.
- `seam-widget.tsx` — a `ReactWidget` ("Seam" view) rendering the current
  `IDE_STATE_PACKET/1` as JSON and the pending `IDE_PATCH/1` as a diff.
- `ide-seam-frontend-module.ts` — the Inversify container module wiring the
  above (`extension/package.json`'s `theiaExtensions[0].frontend`; the
  package's top-level `main` field must not also point at it, or the module
  loads twice, see above).

`ideSeam.applyPatch` looks for a pending patch at a well-known workspace path
(`patch.json` in the workspace root) since this extension has no
paste-JSON input widget the way `index.html` does; absence or invalid JSON
leaves no pending patch, which is refused the same way index.html refuses
"no patch" (`applyPendingPatch` throws `No pending patch to apply`).

## Real terminal vs index.html's shell() shim

`index.html`'s `shell()` is a bounded command shim: it recognizes a fixed set
of strings (`help`, `ls`, `cat FILE`, `clear`, `python FILE`) and never spawns
a real process or shell.

`ideSeam.statePacket` instead opens a real Theia terminal through
`TerminalService.newTerminal()` / `TerminalWidget.start()`, sends
`echo seam-terminal-check` to it, and reads back the rendered screen via
`TerminalWidget.buffer.getLines()` before building the packet. A captured
`terminal` field looks like:

```
Microsoft Windows [Version 10.0.26200.9168]
(c) Microsoft Corporation. All rights reserved.
c:\...\poc\theia-host\fixtures\workspace>echo seam-terminal-check
```

(`evidence/ide-state-packet.json` has the full captured packet.)

What the packet gained from the real terminal that `shell()` cannot provide:
an actual OS shell process (`cmd.exe` here) with its own banner, working
directory, and process lifecycle, driven through the same `TerminalService`
a human user's terminal panel uses — not a hardcoded string-match dispatcher.

What the `IDE_STATE_PACKET/1` schema cannot carry: the schema's `terminal`
field is a single string, so it flattens shell banner, prompt, echoed input
and command output into one undifferentiated blob with no way to tell input
from output, no exit code, no distinction between "this terminal's scrollback"
and "the last command's result", and no reference to *which* terminal (a
workspace can have several). `EXECUTION_RESULT/1` (used by `python.run`, see
below) captures an explicit `status` and `observations` array instead, which
is the shape a caller actually needs to tell success from failure — the
`IDE_STATE_PACKET/1` terminal field is descriptive context, not a result to
act on.

Reading the terminal via `buffer.getLines()` (the rendered xterm screen) was
also a fix in this session: reading `TerminalWidget.onData` instead only
captured a stray `\u001b[I` (a terminal focus-report escape sequence) because
raw PTY output includes control sequences a real shell emits around normal
text; the buffer already holds the rendered, escape-free screen content.

## Adversarial next load: python.run

`ideSeam.runPython` runs the active editor's `.py` file through
`TaskService.runTask()` (a `type: 'shell'` task, matching how `tasks.json`
tasks work) and wraps the result as `EXECUTION_RESULT/1` via
`buildExecutionResult`.

This composed entirely from services the first two commands already used
(`TaskService` is new; `EditorManager` for the active file and `seam.ts`'s
`buildExecutionResult` were already in place) — no bespoke process-spawning
or transport was written. The command handler
(`IdeSeamContribution.runPython`, `extension/src/browser/ide-seam-contribution.ts`)
is about 50 lines including its error path, roughly half of which is the two
`EXECUTION_RESULT/1` constructions (success and failure) using the
already-shared `buildExecutionResult` from `seam.ts`.

## Evidence

`evidence/run-playwright.mjs` drives the built browser app
(`evidence/start-server.cjs` starts it on port 3033 against
`fixtures/workspace`) with Playwright: it opens the command palette to show
each command is discoverable, then invokes
`window.__ideSeamCommands.{emitStatePacket,applyPatch,runPython,toggleSeamView}`
directly (a test-only hook set by `IdeSeamContribution.onStart`, avoiding a
race against the palette's own open/close animation) and captures:

- `evidence/01-workbench-loaded.png` … `evidence/05-seam-view.png` — screenshots.
- `evidence/ide-state-packet.json`, `evidence/ide-patch-applied.json`,
  `evidence/execution-result.json` — the emitted envelopes, read back from
  `window.__ideSeamEvidence` (another test-only hook, set by
  `IdeSeamService.publishEvidence`).
- `evidence/console-errors.json` — zero warnings/errors after the double
  registration fix above.
- `evidence/seam-view.txt` — the Seam view's rendered text content.

`test/seam.test.mjs` validates an emitted packet and an execution result
against `contracts/ide-state-packet.schema.json` and
`contracts/execution-result.schema.json` with ajv, applies
`fixtures/patch.json` to `fixtures/workspace.json` and asserts the resulting
file contents, and asserts a stale `base_revision` and a malformed patch are
each refused with the exact index.html message.

## License inventory

See [`LICENSES.md`](LICENSES.md) — generated with `npx license-checker
--json` (raw output in `evidence/license-checker.json`, grouped in
`evidence/license-summary.json`). Of 727 installed packages: 556 MIT, 25
EPL-2.0-family (every `@theia/*` runtime package), 146 other non-MIT
(ISC, Apache-2.0, BSD variants, and others — see `LICENSES.md` for the full
per-package list).

## Leverage

Facts only; no recommendation or disposition is recorded here.

### Capability leverage — what performed each job

| Capability / module | Upstream service or primitive that performed it in this spike |
|---|---|
| workspace.snapshot | `WorkspaceService.roots` + `FileService.resolve`/`read` (`IdeSeamService.buildPacket`) |
| file.read | `FileService.read` |
| file.patch | `FileService.write`, one call per change (`IdeSeamService.applyPendingPatch`); the refusal/shape check itself is ours (`seam.ts#checkPatch`, matching index.html) |
| editor.* (Monaco) | none — this extension does not open or drive Monaco; `active_file`/`open_tabs`/`selection` come from `EditorManager`, not the editor widget's rendering |
| terminal.exec | `TerminalService.newTerminal`/`TerminalWidget.start`/`sendText`/`buffer.getLines` |
| python.run | `TaskService.runTask` (a `type: 'shell'` task) |
| vcs.status | none — no VCS-facing code was written or exercised |
| language.hover | none — no language service code was written or exercised |
| index.html `loadMonaco` | none — not attempted; the spike has no code editor of its own, it edits through Theia's own Monaco integration when a user opens a file, which this extension never touches |
| index.html `shell` | `TerminalService` (see "Real terminal" above) |
| index.html `save` (persist + bump revision) | `EditorManager` + `Saveable#onDirtyChanged` (`IdeSeamService.observeSaves`) for the revision bump; `FileService.write` for `file.patch` writes |
| index.html packet builder | `IdeSeamService.buildPacket`, calling the same Theia services listed above; the envelope shape itself is ours (`seam.ts#buildStatePacket`) |
| index.html patch applier | `IdeSeamService.applyPendingPatch`, calling `FileService.write`; the refusal logic is ours (`seam.ts#checkPatch`/`applyPatch`) |

### Adapter size

| Metric | Value |
|---|---|
| Lines of code we wrote (extension/src) | 681 (`seam.ts` 140, `ide-seam-service.ts` 186, `ide-seam-contribution.ts` 191, `seam-widget.tsx` 58, `ide-seam-frontend-module.ts` 21, plus `test/seam.test.mjs` 85) |
| Upstream concepts the adapter had to learn | Inversify `ContainerModule`/`@injectable`/`@inject`/`@postConstruct`; `bindViewContribution` (and that it already binds `CommandContribution`/`MenuContribution`/`KeybindingContribution`); `AbstractViewContribution` lifecycle (`openView`, `toggleCommandId`); `WidgetFactory` registration; `ReactWidget#render`/`update`; `WorkspaceService.roots`; `FileService.resolve`/`read`/`write` and `FileStat`; `EditorManager`/`EditorWidget`/`Saveable#onDirtyChanged` (no dedicated "save completed" event exists); `TerminalService.newTerminal`/`TerminalWidget.start`/`sendText`/`buffer.getLines` (vs. the noisier `onData`); `TaskService.runTask`/`isTaskRunning`/`getExitCode` and the `type: 'shell'` task shape; `theiaExtensions` package.json wiring and that a top-level `main` pointing at the same frontend module double-loads it; the `theia` CLI's `start` command resolving the app directory from `process.cwd()` rather than a path argument |
| Upstream packages depended on (extension + browser-app, direct deps) | 11: `@theia/core`, `@theia/editor`, `@theia/filesystem`, `@theia/workspace`, `@theia/terminal`, `@theia/task`, `@theia/process`, `@theia/messages`, `@theia/monaco`, `@theia/navigator`, `@theia/preferences` (browser-app also depends on the `@theia/cli` build tool) |
| node_modules size | 386M |
| Build wall time | 9s (browser bundle + node bundle, warm; see Build above) |
| Node/tool version required | Node v24.11.1, yarn 1.22.22 (as installed; `@theia/core` 1.75.0 itself targets Node >=18 per its own engines field) |
| Native modules compiled | none — all native deps (keytar, drivelist, etc.) used prebuilt binaries |

### Upgrade burden

`@theia/core` release cadence, last four published versions (from the npm registry):

| Version | Published |
|---|---|
| 1.73.1 | 2026-07-01 |
| 1.74.0 | 2026-07-31 |
| 1.74.1 | 2026-08-06 |
| 1.75.0 | 2026-08-27 |

Every upstream import in `extension/src` goes through a package's public
`lib/...` entry point (e.g. `@theia/workspace/lib/browser/workspace-service`,
`@theia/terminal/lib/browser/base/terminal-service`) or a documented
extension mechanism (`theiaExtensions` in `package.json`,
`bindViewContribution`, `AbstractViewContribution`). No file in
`extension/src` imports from a package's internal/generated output
(`src-gen`, `lib/generated`) or reaches past a package's exported index. The
one upstream internal this spike did touch is not a package export at all:
the `theia` CLI's `start` command resolving the app directory from
`process.cwd()` (undocumented behavior, discovered by the wrong-cwd defect
above, worked around in `evidence/start-server.cjs` rather than in the
extension or `browser-app` itself).

### What we could plausibly stop owning

| File / function | Whose job it is |
|---|---|
| `extension/src/browser/ide-seam-service.ts` (`buildPacket`, `observeSaves`, `loadPendingPatchFromWorkspace`, `applyPendingPatch`, `recordTerminalCommand`) | Upstream performed the actual reads/writes/terminal I/O; this file is the glue deciding which Theia calls to make and in what order — still ours |
| `extension/src/browser/ide-seam-contribution.ts`, `ide-seam-frontend-module.ts`, `seam-widget.tsx` | Command/menu/keybinding/view wiring and rendering are Theia contribution points; the specific commands, labels, and JSON/diff rendering are still ours |
| `extension/src/seam.ts` (`buildStatePacket`, `checkPatch`, `applyPatch`, `buildExecutionResult`) | Fully ours — no Theia service performs envelope shaping, the base-revision refusal, or execution-result wrapping; this is the actual seam contract logic, independent of which IDE it runs in |
| index.html's `loadMonaco` | Not reproduced or needed here — Theia's own Monaco integration already exists and this extension never opens a file itself |
| index.html's `shell` | Superseded by `TerminalService` (see "Real terminal" above); nothing left to own here if hosted on Theia |
| index.html's packet builder / patch applier (field gathering, file I/O) | Superseded by `WorkspaceService`/`FileService`/`EditorManager`; the refusal rule and envelope shape (`seam.ts`) remain ours regardless of host |

### Adversarial next load

`python.run` composed from the same primitives the first two commands
already used, plus one new one (`TaskService`, a documented Theia service for
running `tasks.json`-shaped tasks) — no bespoke process-spawning or transport
was written. `IdeSeamContribution.runPython` is about 50 lines including its
error path, roughly half of which is building the two `EXECUTION_RESULT/1`
envelopes (success and failure) with the already-shared `buildExecutionResult`
from `seam.ts`.
