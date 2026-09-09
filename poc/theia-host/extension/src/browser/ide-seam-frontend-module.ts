import { ContainerModule } from '@theia/core/shared/inversify';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { IdeSeamContribution } from './ide-seam-contribution';
import { IdeSeamService } from './ide-seam-service';
import { SeamWidget } from './seam-widget';

export default new ContainerModule(bind => {
    bind(IdeSeamService).toSelf().inSingletonScope();

    // bindViewContribution already binds CommandContribution, MenuContribution
    // and KeybindingContribution to IdeSeamContribution; binding them again here
    // registered every command twice.
    bindViewContribution(bind, IdeSeamContribution);
    bind(FrontendApplicationContribution).toService(IdeSeamContribution);

    bind(SeamWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SeamWidget.ID,
        createWidget: () => ctx.container.get(SeamWidget)
    })).inSingletonScope();
});
