import fse from 'fs-extra'
import { BrowserContext, Locator, Page, expect } from '@playwright/test'

interface StorybookIndexJSON {
    v: number
    entries: Record<string, StorybookIndexStory>
    stories: Record<string, StorybookStoriesStory>
}

/**
 * Storybook v7
 */
export interface StorybookIndexStory {
    id: string // composite-typography--variants
    title: string // Composite/Typography
    name: string // Variants
    importPath: string // ./components/Typography/Typography.stories.tsx
    tags: Array<string> // ["story", "customTag"]
    type: 'story' | 'docs'
}

/**
 * Storybook v6
 */
export interface StorybookStoriesStory {
    id: string // composite-typography--variants
    title: string // Composite/Typography
    name: string // Variants
    importPath: string // ./components/Typography/Typography.stories.tsx
    kind: string
    story: string
    parameters: {
        __id: string
        docsOnly: boolean
        fileName: string
    }
}

type StoriesFilterFn = <V7 = true>(story: V7 extends true ? StorybookIndexStory : StorybookStoriesStory) => boolean

export const storybookPlaywright = {
    getStories: (pathToStorybookIndexJson: string, storyFilterFn: StoriesFilterFn) => {
        if (!fse.existsSync(pathToStorybookIndexJson)) {
            console.log(pathToStorybookIndexJson, "doesn't exist.")
            throw new Error('Please build storybook before running tests!')
        }
        const storybookIndexJson: StorybookIndexJSON = fse.readJsonSync(pathToStorybookIndexJson)

        const storyObject = storybookIndexJson.entries || storybookIndexJson.stories

        const stories = Object.values(storyObject).filter(storyFilterFn)

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

            /**
             * When true, takes a screenshot of the full scrollable page, instead of the currently visible viewport. Defaults to
             * `false`.
             */
            fullPage?: boolean

            /**
             * Specify locators that should be masked when the screenshot is taken. Masked elements will be overlaid with a pink
             * box `#FF00FF` that completely covers its bounding box.
             */
            mask?: Array<Locator>

            /**
             * An acceptable ratio of pixels that are different to the total amount of pixels, between `0` and `1`. Default is
             * configurable with `TestConfig.expect`. Unset by default.
             */
            maxDiffPixelRatio?: number

            /**
             * An acceptable amount of pixels that could be different. Default is configurable with `TestConfig.expect`. Unset by
             * default.
             */
            maxDiffPixels?: number

            /**
             * Hides default white background and allows capturing screenshots with transparency. Not applicable to `jpeg` images.
             * Defaults to `false`.
             */
            omitBackground?: boolean

            /**
             * When set to `"css"`, screenshot will have a single pixel per each css pixel on the page. For high-dpi devices, this
             * will keep screenshots small. Using `"device"` option will produce a single pixel per each device pixel, so
             * screenshots of high-dpi devices will be twice as large or even larger.
             *
             * Defaults to `"css"`.
             */
            scale?: 'css' | 'device'

            /**
             * An acceptable perceived color difference in the [YIQ color space](https://en.wikipedia.org/wiki/YIQ) between the
             * same pixel in compared images, between zero (strict) and one (lax), default is configurable with
             * `TestConfig.expect`. Defaults to `0.2`.
             */
            threshold?: number

            /**
             * Time to retry the assertion for. Defaults to `timeout` in `TestConfig.expect`.
             */
            timeout?: number
        },
        actionBeforeScreenshot?: (page: Page) => Promise<void>
    ) => {
        const page = context.pages()[0]

        await page.goto(`/iframe.html?id=${story.id}`)
        await expect(page.locator('.sb-show-main')).toBeVisible()
        await expect(page.locator('.sb-show-errordisplay')).not.toBeVisible()
        await page.waitForLoadState('networkidle')
        if (actionBeforeScreenshot) {
            await actionBeforeScreenshot(page)
        }
        await expect(page).toHaveScreenshot(`${story.id}.png`, screenshotOptions)
    },
}
