import React from '@theia/core/shared/react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { IdeSeamService } from './ide-seam-service';

@injectable()
export class SeamWidget extends ReactWidget {

    static readonly ID = 'ide-seam:seam-widget';
    static readonly LABEL = 'Seam';

    @inject(IdeSeamService)
    protected readonly seamService!: IdeSeamService;

    @postConstruct()
    protected init(): void {
        this.id = SeamWidget.ID;
        this.title.label = SeamWidget.LABEL;
        this.title.caption = SeamWidget.LABEL;
        this.title.closable = true;
        this.title.iconClass = 'codicon codicon-json';
        this.seamService.onDidChange(() => this.update());
        this.update();
    }

    protected render(): React.ReactNode {
        const packet = this.seamService.lastPacket;
        const patch = this.seamService.pendingPatch;
        return <div style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
            <h3>Current IDE_STATE_PACKET/1</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {packet ? JSON.stringify(packet, undefined, 2) : '(none emitted yet — run "Seam: Emit State Packet")'}
            </pre>
            <h3>Pending IDE_PATCH/1 diff</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {patch ? this.renderPatchDiff(patch) : '(no pending patch)'}
            </pre>
        </div>;
    }

    protected renderPatchDiff(patch: { base_revision?: number | string | null; changes: Array<{ path: string; content: string }> }): string {
        const lines: string[] = [`base_revision: ${patch.base_revision}`];
        for (const change of patch.changes) {
            lines.push(`--- ${change.path}`);
            lines.push(`+++ ${change.path}`);
            const before = this.seamService.lastFiles?.[change.path] ?? '';
            const beforeLines = before.split('\n');
            const afterLines = change.content.split('\n');
            for (const l of beforeLines) {
                lines.push(`- ${l}`);
            }
            for (const l of afterLines) {
                lines.push(`+ ${l}`);
            }
        }
        return lines.join('\n');
    }
}
