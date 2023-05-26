import fse from 'fs-extra'
import { BrowserContext, expect } from '@playwright/test'

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

    captureScreenshot: async (
        story: StorybookIndexStory,
        context: BrowserContext,
        /** Playwright toHaveScreenshot options */
        screenshotOptions?: {
            /**
             * When set to `"disabled"`, stops CSS animations, CSS transitions and Web Animations. Animations get different
             * treatment depending on their duration:
             * - finite animations are fast-forwarded to completion, so they'll fire `transitionend` event.
             * - infinite animations are canceled to initial state, and then played over after the screenshot.
             *
             * Defaults to `"disabled"` that disables animations.
             */
            animations?: 'disabled' | 'allow'

            /**
             * When set to `"hide"`, screenshot will hide text caret. When set to `"initial"`, text caret behavior will not be
             * changed.  Defaults to `"hide"`.
             */
            caret?: 'hide' | 'initial'

            /**
             * An object which specifies clipping of the resulting image.
             */
            clip?: {
                /**
                 * x-coordinate of top-left corner of clip area
                 */
                x: number

                /**
                 * y-coordinate of top-left corner of clip area
                 */
                y: number

                /**
                 * width of clipping area
                 */
                width: number

                /**
                 * height of clipping area
                 */
                height: number
            }
        }
    ) => {
        const page = context.pages()[0]

        await page.goto(`/iframe.html?id=${story.id}`)
        await expect(page.locator('.sb-show-main')).toBeVisible()
        await expect(page.locator('.sb-show-errordisplay')).not.toBeVisible()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveScreenshot(`${story.id}.png`, screenshotOptions)
    },
}
