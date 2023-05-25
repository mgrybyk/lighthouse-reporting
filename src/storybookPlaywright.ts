import fse from 'fs-extra'
import type { BrowserContext } from '@playwright/test'
import { expect } from '@playwright/test'

interface StorybookIndexJSON {
    v: number
    entries: Record<string, StorybookIndexStory>
}

export interface StorybookIndexStory {
    id: string // composite-typography--variants
    title: string // Composite/Typography
    name: string // Variants
    importPath: string // ./components/Typography/Typography.stories.tsx
    tags: Array<string> // ["story", "customTag"]
    type: 'story' | 'docs'
}

type StoriesFilterFn = (story: StorybookIndexStory) => boolean

export const storybookPlaywright = {
    getStories: (pathToStorybookIndexJson: string, storyFilterFn: StoriesFilterFn) => {
        if (!fse.existsSync(pathToStorybookIndexJson)) {
            console.log(pathToStorybookIndexJson, "doesn't exist.")
            throw new Error('Please build storybook before running tests!')
        }
        const storybookIndexJson: StorybookIndexJSON = fse.readJsonSync(pathToStorybookIndexJson)

        const stories = Object.values(storybookIndexJson.entries).filter(storyFilterFn)

        return stories
    },

    captureScreenshot: async (story: StorybookIndexStory, context: BrowserContext) => {
        const page = context.pages()[0]

        await page.goto(`/iframe.html?id=${story.id}`)
        await expect(page.locator('.sb-show-main')).toBeVisible()
        await expect(page.locator('.sb-show-errordisplay')).not.toBeVisible()
        await page.waitForLoadState('networkidle')

        await expect(page).toHaveScreenshot(`${story.id}.png`)
    },
}
