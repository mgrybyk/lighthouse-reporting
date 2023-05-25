import os from 'os'
import path from 'path'
import getPort from 'get-port'
import type { BrowserContext } from '@playwright/test'
import { chromium, test as base } from '@playwright/test'
import { PW_TMP_DIR } from './constants'

export const playwrightLighthouseTest = base.extend<{ context: BrowserContext }, { port: number }>({
    port: [
        // eslint-disable-next-line no-empty-pattern
        async ({}, use) => {
            // Assign a unique port for each playwright worker to support parallel tests
            const port = await getPort()
            await use(port)
        },
        { scope: 'worker' },
    ],

    context: [
        async ({ port, launchOptions }, use) => {
            const context = await chromium.launchPersistentContext(
                path.join(os.tmpdir(), PW_TMP_DIR, `${Math.random()}`.replace('.', '')),
                {
                    args: [...(launchOptions.args || []), `--remote-debugging-port=${port}`],
                }
            )

            await use(context)
            await context.close()
        },
        { scope: 'test' },
    ],
})
