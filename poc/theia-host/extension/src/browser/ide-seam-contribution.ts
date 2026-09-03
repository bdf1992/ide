import { injectable, inject } from '@theia/core/shared/inversify';
import {
    CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService
} from '@theia/core/lib/common';
import { KeybindingContribution, KeybindingRegistry } from '@theia/core/lib/browser';
import { AbstractViewContribution } from '@theia/core/lib/browser/shell/view-contribution';
import { CommonMenus } from '@theia/core/lib/browser/common-frontend-contribution';
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { TaskService } from '@theia/task/lib/browser/task-service';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { SeamWidget } from './seam-widget';
import { IdeSeamService } from './ide-seam-service';
import { buildExecutionResult, Patch } from '../seam';

export namespace IdeSeamCommands {
    export const STATE_PACKET = {
        id: 'ideSeam.statePacket',
        label: 'Seam: Emit State Packet'
    };
    export const APPLY_PATCH = {
        id: 'ideSeam.applyPatch',
        label: 'Seam: Apply Patch'
    };
    export const RUN_PYTHON = {
        id: 'ideSeam.runPython',
        label: 'Seam: Run Python (python.run)'
    };
}

@injectable()
export class IdeSeamContribution extends AbstractViewContribution<SeamWidget>
    implements CommandContribution, MenuContribution, KeybindingContribution {

    @inject(IdeSeamService)
    protected readonly seamService!: IdeSeamService;

    @inject(MessageService)
    protected readonly messageService!: MessageService;

    @inject(EditorManager)
    protected readonly editorManager!: EditorManager;

    @inject(TaskService)
    protected readonly taskService!: TaskService;

    @inject(WorkspaceService)
    protected readonly workspaceService!: WorkspaceService;

    constructor() {
        super({
            widgetId: SeamWidget.ID,
            widgetName: SeamWidget.LABEL,
            defaultWidgetOptions: { area: 'right' },
            toggleCommandId: 'ideSeam.toggleSeamView'
        });
    }

    /**
     * Test/evidence-only hook: lets the Playwright evidence run
     * (poc/theia-host/evidence/run-playwright.mjs) invoke each command
     * directly instead of racing the quick-open palette's animation.
     */
    onStart(): void {
        const w = window as unknown as { __ideSeamCommands?: Record<string, () => Promise<void>> };
        w.__ideSeamCommands = {
            emitStatePacket: () => this.emitStatePacket(),
            applyPatch: () => this.applyPatch(),
            runPython: () => this.runPython(),
            toggleSeamView: () => this.openView({ activate: true }).then(() => undefined)
        };
    }

    registerCommands(registry: CommandRegistry): void {
        super.registerCommands(registry);
        registry.registerCommand(IdeSeamCommands.STATE_PACKET, {
            execute: () => this.emitStatePacket()
        });
        registry.registerCommand(IdeSeamCommands.APPLY_PATCH, {
            execute: () => this.applyPatch()
        });
        registry.registerCommand(IdeSeamCommands.RUN_PYTHON, {
            execute: () => this.runPython()
        });
    }

    registerMenus(menus: MenuModelRegistry): void {
        super.registerMenus(menus);
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: IdeSeamCommands.STATE_PACKET.id,
            label: IdeSeamCommands.STATE_PACKET.label
        });
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: IdeSeamCommands.APPLY_PATCH.id,
            label: IdeSeamCommands.APPLY_PATCH.label
        });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        super.registerKeybindings(keybindings);
        keybindings.registerKeybinding({
            command: IdeSeamCommands.STATE_PACKET.id,
            keybinding: 'ctrlcmd+alt+p'
        });
        keybindings.registerKeybinding({
            command: IdeSeamCommands.APPLY_PATCH.id,
            keybinding: 'ctrlcmd+alt+shift+p'
        });
    }

    protected async emitStatePacket(): Promise<void> {
        await this.openView({ activate: true });
        // Contract step 5: exercise a real Theia terminal (TerminalService),
        // not index.html's bounded shell() shim, so the packet's terminal
        // field reflects an actual workbench primitive.
        await this.seamService.recordTerminalCommand('echo seam-terminal-check');
        const packet = await this.seamService.buildPacket();
        this.messageService.info(`IDE_STATE_PACKET/1 emitted at revision ${packet.workspace_revision}`);
    }

    protected async applyPatch(): Promise<void> {
        try {
            if (!this.seamService.pendingPatch) {
                await this.seamService.loadPendingPatchFromWorkspace();
            }
            await this.seamService.applyPendingPatch();
            this.messageService.info('IDE_PATCH/1 applied');
        } catch (e) {
            this.messageService.error(String((e as Error).message));
        }
    }

    /**
     * Adversarial next load: run a workspace Python file through Theia's
     * TaskService (a tasks.json task) rather than bespoke process-spawning,
     * and wrap the result as EXECUTION_RESULT/1.
     */
    protected async runPython(): Promise<void> {
        const editor = this.editorManager.currentEditor;
        const activeFile = editor?.editor.uri.path.base ?? '';
        if (!activeFile.endsWith('.py')) {
            this.messageService.warn('Seam: Run Python needs an open .py file');
            return;
        }
        const roots = await this.workspaceService.roots;
        const workspaceUri = roots[0]?.resource;
        const taskConfig = {
            type: 'shell',
            label: 'ideSeam:python.run',
            command: 'python',
            args: [activeFile],
            _scope: workspaceUri?.toString()
        };
        const executionId = `exec-${Date.now()}`;
        try {
            const taskInfo = await this.taskService.runTask(taskConfig as never);
            const taskId = taskInfo?.taskId;
            if (taskId === undefined) {
                throw new Error('Task did not start');
            }
            while (this.taskService.isTaskRunning(taskId)) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            const exitCode = (await this.taskService.getExitCode(taskId)) ?? 0;
            const result = buildExecutionResult({
                executionId,
                runtimeKind: 'other',
                runtimeVersion: 'system-python',
                status: exitCode === 0 ? 'success' : 'failure',
                observations: [{ exitCode }],
                error: exitCode === 0 ? null : { kind: 'NonZeroExit', message: `exit code ${exitCode}` },
                programId: activeFile
            });
            this.messageService.info(`EXECUTION_RESULT/1: ${JSON.stringify(result)}`);
            this.seamService.publishEvidence('executionResult', result);
        } catch (e) {
            const result = buildExecutionResult({
                executionId,
                runtimeKind: 'other',
                runtimeVersion: 'system-python',
                status: 'failure',
                observations: [],
                error: { kind: 'TaskFailed', message: String((e as Error).message) },
                programId: activeFile
            });
            this.messageService.error(`EXECUTION_RESULT/1: ${JSON.stringify(result)}`);
            this.seamService.publishEvidence('executionResult', result);
        }
    }
}

export type { Patch };
