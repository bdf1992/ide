# Chapter 1 Closure Harness

This is the single browser acceptance surface for the first Open Chat IDE chapter.

It does **not** implement another IDE or another copy of the POCs. It resolves one exact
`main` commit at run start, fetches the existing canonical browser artifacts from that
commit, and drives their existing acceptance controls inside isolated frames.

## Gates

1. **Chat shell boot** — canonical `index.html` reaches an explicit editor state and
   Pyodide / CPython 3.14 becomes available. The harness substitutes only the
   `localStorage` key with a closure-only key so acceptance cannot overwrite the user's
   normal Chat workspace.
2. **Tree-sitter syntax provider** — drives `poc/provider-syntax/` and records its
   existing `PROVIDER_ACCEPTANCE/1` report.
3. **Workspace materialization** — drives `poc/workspace-materialization/` and records
   its existing acceptance report. Generic sibling import must end in `multifile: PASS`.
4. **Semantic POC 0.1** — drives the existing browser defeat suite in
   `poc/semantic-poc.html`.

The skill-build kernel is intentionally not reimplemented here. PR #27 already carries
its deterministic Node evidence; browser duplication would add a second test
implementation without closing a browser-specific risk.

## Result

The page emits `CHAPTER_1_RECEIPT/1` with:

- exact repository revision;
- Chat/browser host profile;
- PASS / FAIL / BLOCKED standing for each gate;
- captured underlying acceptance evidence where available;
- a computed `chapter_closable` boolean.

A green receipt is evidence for the next repository actions. It does not itself promote
a POC, update `STATUS.md`, close an issue, or cut a baseline tag.

## Chat artifact

The harness is a single HTML file and can use the existing byte-for-byte Chat artifact
exporter:

```bash
python scripts/build_chat_artifact.py \
  --source poc/chapter-1-closure/index.html \
  --output dist/open-chat-ide-chapter-1.html \
  --marker "<title>Open Chat IDE — Chapter 1 Closure</title>"
```

Then attach `dist/open-chat-ide-chapter-1.html` to normal Chat and run **Run chapter
acceptance**.

## Authority

The harness is observational/test infrastructure.

- It does not gain workspace write authority.
- It does not treat a POC PASS as stable product promotion.
- It does not allow Work/local evidence to substitute for required Chat evidence.
- It pins one commit per run so mixed-revision evidence cannot be reported as one receipt.

Campaign ledger: issue #31.
