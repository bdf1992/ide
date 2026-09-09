import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { SaveableSource } from '@theia/core/lib/browser/saveable';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { EditorWidget } from '@theia/editor/lib/browser/editor-widget';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';
import { StatePacket, Patch, buildStatePacket, applyPatch as applySeamPatch } from '../seam';

/**
 * Gathers packet fields from Theia's own services (workspace/file/editor/
 * terminal) rather than parallel tracking, and owns the seam's revision
 * counter, per contract steps 3-4.
 */
@injectable()
export class IdeSeamService {

    @inject(WorkspaceService)
    protected readonly workspaceService!: WorkspaceService;

    @inject(FileService)
    protected readonly fileService!: FileService;

    @inject(EditorManager)
    protected readonly editorManager!: EditorManager;

    @inject(TerminalService)
    protected readonly terminalService!: TerminalService;

    protected revision = 0;
    protected lastTerminalOutput = '';

    lastPacket: StatePacket | undefined;
    lastFiles: Record<string, string> | undefined;
    pendingPatch: Patch | undefined;

    protected readonly onDidChangeEmitter = new Emitter<void>();
    readonly onDidChange = this.onDidChangeEmitter.event;

    protected readonly observedSaveables = new Set<unknown>();

    @postConstruct()
    protected init(): void {
        this.editorManager.all.forEach(widget => this.observeSaves(widget));
        this.editorManager.onCreated(widget => this.observeSaves(widget));
    }

    /**
     * EditorManager has no dedicated "save completed" event; a save is
     * observed as the editor's Saveable going from dirty to clean, per
     * contract step 4.
     */
    protected observeSaves(widget: EditorWidget & Partial<SaveableSource>): void {
        const saveable = widget.saveable;
        if (!saveable || this.observedSaveables.has(saveable)) {
            return;
        }
        this.observedSaveables.add(saveable);
        saveable.onDirtyChanged(() => {
            if (!saveable.dirty) {
                this.revision++;
                this.onDidChangeEmitter.fire();
            }
        });
    }

    get currentRevision(): number {
        return this.revision;
    }

    /**
     * Reads back the terminal's rendered xterm buffer (TerminalWidget#buffer)
     * rather than accumulating raw onData bytes: onData carries unprocessed
     * PTY escape sequences (cursor moves, focus reports) that a real shell
     * emits before and around the echoed command, while the buffer holds the
     * already-rendered screen content.
     */
    async recordTerminalCommand(command: string): Promise<string> {
        const terminal = await this.terminalService.newTerminal({});
        await terminal.start();
        this.terminalService.open(terminal);
        // The PTY needs a moment after start() before it accepts input; without
        // this, sendText races the shell's own startup and the command is lost.
        await new Promise(resolve => setTimeout(resolve, 1000));
        terminal.sendText(command + '\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
        const lines = terminal.buffer.getLines(0, terminal.buffer.length, true).filter(line => line.length > 0);
        this.lastTerminalOutput = lines.join('\n');
        return this.lastTerminalOutput;
    }

    async buildPacket(): Promise<StatePacket> {
        const roots = await this.workspaceService.roots;
        const workspaceUris: string[] = [];
        const files: Record<string, string> = {};
        for (const root of roots) {
            const stat = await this.fileService.resolve(root.resource, { resolveMetadata: false });
            for (const child of stat.children ?? []) {
                if (!child.isDirectory) {
                    workspaceUris.push(child.resource.toString());
                    const content = await this.fileService.read(child.resource);
                    const relative = root.resource.relative(child.resource)?.toString() ?? child.name;
                    files[relative] = content.value;
                }
            }
        }

        const openTabs = this.editorManager.all.map(widget => widget.editor.uri.toString());
        const activeEditor = this.editorManager.currentEditor;
        const activeFile = activeEditor ? activeEditor.editor.uri.path.base : '';
        const selection = activeEditor ? activeEditor.editor.document.getText(activeEditor.editor.selection) : '';

        const packet = buildStatePacket({
            workspaceRevision: this.revision,
            activeFile,
            openTabs,
            selection,
            files,
            terminal: this.lastTerminalOutput,
            canonicalRepo: 'https://github.com/bdf1992/ide',
            request: 'Act as the IDE over this exact workspace. Prefer ordinary IDE primitives and the smallest explainable change.'
        });
        this.lastPacket = packet;
        this.lastFiles = files;
        this.onDidChangeEmitter.fire();
        this.publishEvidence('statePacket', packet);
        return packet;
    }

    setPendingPatch(patch: Patch): void {
        this.pendingPatch = patch;
        this.onDidChangeEmitter.fire();
    }

    /**
     * ideSeam.applyPatch applies whatever patch is already pending; index.html
     * gets its pending patch from the pasted-JSON textarea. This extension has
     * no such input widget, so it looks for the same shape at a well-known
     * workspace path (an agent would drop the patch there before invoking the
     * command). Absence or bad JSON leaves pendingPatch unset, which
     * applyPendingPatch already refuses.
     */
    async loadPendingPatchFromWorkspace(): Promise<void> {
        const roots = await this.workspaceService.roots;
        const root = roots[0];
        if (!root) {
            return;
        }
        const uri = root.resource.resolve('patch.json');
        try {
            const content = await this.fileService.read(uri);
            this.setPendingPatch(JSON.parse(content.value));
        } catch {
            // no patch.json in the workspace root, or it is not valid JSON
        }
    }

    async applyPendingPatch(): Promise<void> {
        if (!this.pendingPatch) {
            throw new Error('No pending patch to apply');
        }
        const roots = await this.workspaceService.roots;
        const root = roots[0];
        const { files, revision } = applySeamPatch(this.lastFiles ?? {}, this.pendingPatch, this.revision);
        for (const change of this.pendingPatch.changes) {
            const uri = root.resource.resolve(change.path);
            await this.fileService.write(uri, change.content);
        }
        this.lastFiles = files;
        this.revision = revision;
        this.pendingPatch = undefined;
        this.onDidChangeEmitter.fire();
        this.publishEvidence('appliedPatch', { files, revision });
    }

    /**
     * Test/evidence-only hook: exposes the last emitted envelope on `window`
     * so the Playwright evidence run (poc/theia-host/evidence/run-playwright.mjs)
     * can capture it as JSON without a bespoke transport of its own.
     */
    publishEvidence(key: string, value: unknown): void {
        const w = window as unknown as { __ideSeamEvidence?: Record<string, unknown> };
        w.__ideSeamEvidence = { ...(w.__ideSeamEvidence ?? {}), [key]: value };
    }
}
