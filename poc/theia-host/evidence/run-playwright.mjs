import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(here, '..', '.tools', 'node_modules', 'playwright'));
const url = 'http://127.0.0.1:3033';

async function runCommand(page, commandLabel) {
    await page.keyboard.press('Control+Shift+P');
    const input = page.locator('.quick-input-widget input');
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(commandLabel);
    await page.waitForTimeout(700);
    const firstRow = page.locator('.quick-input-widget .monaco-list-row').first();
    if (await firstRow.isVisible().catch(() => false)) {
        await firstRow.click();
    } else {
        await page.keyboard.press('Enter');
    }
    await input.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function main() {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const consoleErrors = [];
    page.on('pageerror', e => consoleErrors.push('pageerror: ' + String(e)));
    page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
            consoleErrors.push(`console.${msg.type()}: ${msg.text()}`);
        }
    });

    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    // Theia's shell renders after the frontend application starts; wait for the statusbar.
    await page.locator('#theia-statusBar').waitFor({ state: 'visible', timeout: 60000 });
    await page.waitForTimeout(1000);
    const trustButton = page.getByRole('button', { name: 'Yes, I trust the authors' });
    if (await trustButton.isVisible().catch(() => false)) {
        await trustButton.click();
        await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: path.join(here, '01-workbench-loaded.png') });

    // Discoverability evidence: the command is reachable from the palette.
    await runCommand(page, 'Seam: Emit State Packet');
    await page.waitForTimeout(500);
    // Invoke directly (window.__ideSeamCommands, set by the extension's
    // FrontendApplicationContribution.onStart) rather than racing the
    // quick-open palette's click/close animation for the actual evidence.
    await page.evaluate(() => window.__ideSeamCommands.emitStatePacket());
    await page.waitForTimeout(5500);
    await page.screenshot({ path: path.join(here, '02-state-packet-emitted.png') });

    await runCommand(page, 'Seam: Apply Patch');
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__ideSeamCommands.applyPatch());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(here, '03-patch-applied.png') });

    // Open main.py (F1 here is bound to "Search files by name") so python.run has an active .py file.
    await page.keyboard.press('F1');
    const quickOpenInput = page.locator('.quick-input-widget input');
    await quickOpenInput.waitFor({ state: 'visible', timeout: 15000 });
    await quickOpenInput.fill('main.py');
    await page.waitForTimeout(700);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await runCommand(page, 'Seam: Run Python (python.run)');
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__ideSeamCommands.runPython());
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(here, '04-run-python.png') });

    await runCommand(page, 'Seam: Toggle Seam View');
    await page.waitForTimeout(500);
    await page.evaluate(() => window.__ideSeamCommands.toggleSeamView());
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(here, '05-seam-view.png') });

    const seamViewText = await page.locator('[id="ide-seam:seam-widget"]').innerText().catch(() => '(seam view not found)');
    writeFileSync(path.join(here, 'seam-view.txt'), seamViewText);
    writeFileSync(path.join(here, 'console-errors.json'), JSON.stringify(consoleErrors, null, 2));

    const evidence = await page.evaluate(() => (window).__ideSeamEvidence ?? {});
    if (evidence.statePacket) {
        writeFileSync(path.join(here, 'ide-state-packet.json'), JSON.stringify(evidence.statePacket, null, 2));
    }
    if (evidence.appliedPatch) {
        writeFileSync(path.join(here, 'ide-patch-applied.json'), JSON.stringify(evidence.appliedPatch, null, 2));
    }
    if (evidence.executionResult) {
        writeFileSync(path.join(here, 'execution-result.json'), JSON.stringify(evidence.executionResult, null, 2));
    }

    await browser.close();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
