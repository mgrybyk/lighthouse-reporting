import path from 'path'
import fse from 'fs-extra'

export interface LighthouseResult {
    lhr: {
        categories: {
            [k: string]: {
                score: number
            }
        }
    }
    comparisonError?: string
}

export const writeCsvResult = async (
    reportDir: string,
    name: string,
    scores: Record<string, number>,
    thresholds: Record<string, number>,
    swimlanes: Array<string> = []
) => {
    let csvData = Object.keys(scores).join(',')
    if (swimlanes.length > 0) {
        csvData += ',' + swimlanes.map((swimlane) => `${swimlane}_threshold`)
    }
    csvData += '\n'
    csvData += Object.values(scores).join(',')
    if (swimlanes.length > 0) {
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
