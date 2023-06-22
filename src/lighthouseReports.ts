import path from 'path'
import fse from 'fs-extra'

interface NodeDetails {
    lhId: string
    devtoolsNodePath: string
    selector: string
    boudingRect: { [k: string]: number }
    snippet: string
    nodeLabel: string
}

interface RuleExecutionError {
    name: string
    message: string
}

interface AxeRuleResult {
    id: string
    impact?: string
    tags: Array<string>
    nodes: Array<{
        target: Array<string>
        failureSummary?: string
        node: NodeDetails
        relatedNodes: NodeDetails[]
    }>
    error?: RuleExecutionError
}

export interface LighthouseResult {
    lhr: {
        categories: {
            [k: string]: {
                score: number
            }
        }
        audits: {
            [k: string]: {
                title: string
            }
        }
    }
    artifacts: {
        Accessibility: {
            violations: Array<AxeRuleResult>
        }
    }
    comparisonError?: string
}

interface AccessibilityViolations {
    title: string
    nodes: number
}

export const writeCsvResult = async (
    reportDir: string,
    name: string,
    scores: Record<string, number>,
    thresholds: Record<string, number> = {},
    swimlanes: Array<string> = []
) => {
    let csvData = Object.keys(scores).join(',')
    if (swimlanes.length > 0) {
        csvData += ',' + swimlanes.map((swimlane) => `${swimlane}_threshold`)
    }
    csvData += '\n'
    csvData += Object.values(scores).join(',')
    if (swimlanes.length > 0 && Object.keys(thresholds).length > 0) {
        csvData += ',' + swimlanes.map((swimlane) => thresholds[swimlane])
    }
    await fse.writeFile(path.join(reportDir, `${name}.csv`), csvData)
}

const writeHtmlListEntry = async (
    htmlFilePath: string,
    name: string,
    scores: Record<string, number>,
    thresholds: Record<string, number>,
    error?: string,
    addReportLink?: boolean
) => {
    const htmlFileData = (await fse.readFile(htmlFilePath)).toString('utf-8').split('\n')
    const insertIdx = htmlFileData.findIndex((v) => v.includes('// lighthouse-page-results'))
    if (insertIdx < 0) {
        throw new Error('Failed to write results to index.html')
    }
    htmlFileData.splice(insertIdx + 1, 0, JSON.stringify({ href: `${name}.html`, name, scores, thresholds, error, addReportLink }) + ',')
    await fse.writeFile(htmlFilePath, htmlFileData.join('\n'))
}

/**
 * workaround conflicts when multiple threads write the same file
 */
export const writeHtmlListEntryWithRetry = async (
    htmlFilePath: string,
    name: string,
    scores: Record<string, number>,
    thresholds: Record<string, number>,
    comparisonError?: string,
    addReportLink = true
) => {
    let attempts = 10
    let error
    while (attempts > 0) {
        attempts--
        try {
            await writeHtmlListEntry(htmlFilePath, name, scores, thresholds, comparisonError, addReportLink)
            return
        } catch (e) {
            error = e
        }
        await new Promise((resolve) => setTimeout(resolve, 10))
    }
    throw error
}

export const getScores = (result: LighthouseResult) =>
    Object.entries(result.lhr.categories).reduce((prev, [key, c]) => {
        prev[key] = Math.floor(c.score * 100)
        return prev
    }, {} as Record<string, number>)

export const writeScoresToJson = async (lhScoresDir: string, name: string, scores: Record<string, number>, result: LighthouseResult) => {
    const json = Object.entries(scores).reduce((prev, [k, score]) => {
        prev[k] = { score }
        return prev
    }, {} as Record<string, { score: number; issues?: AccessibilityViolations[] }>)
    const accessibilityViolations: AccessibilityViolations[] = result.artifacts.Accessibility.violations.map((v) => {
        return {
            title: result.lhr.audits[v.id].title,
            nodes: v.nodes.length,
        }
    })
    if (accessibilityViolations.length > 0) {
        json.accessibility.issues = accessibilityViolations
    }

    await fse.writeFile(path.join(lhScoresDir, `${name}.json`), JSON.stringify(json, null, 2))
}

/**
 * Generate average csv file. Make sure to use `writeScoresToJson` in your test!
 * @param lhScoresDir path to folder with lighthouse json files. See `writeScoresToJson`.
 * @param reportDir folder where `_AVERAGE_.json` will be generated
 */
export const buildAverageCsv = async (lhScoresDir: string, reportDir: string) => {
    const files = await fse.readdir(lhScoresDir)
    const jsonFiles = files.filter((f) => f.endsWith('.json'))

    if (jsonFiles.length === 0) {
        return
    }

    // sum all the scores
    const scores: Record<string, number> = {}
    for (const fileName of jsonFiles) {
        const score: Record<string, { score: number; issues?: AccessibilityViolations[] }> = await fse.readJson(
            path.join(lhScoresDir, fileName)
        )
        Object.entries(score).forEach(([k, v]) => {
            if (!scores[k]) {
                scores[k] = 0
            }
            scores[k] += v.score
        })
    }

    // calculate average score
    Object.entries(scores).forEach(([k, v]) => {
        scores[k] = v / jsonFiles.length
    })

    await writeCsvResult(reportDir, '_AVERAGE_', scores)
}
