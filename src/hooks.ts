import os from 'os'
import path from 'path'
import fse from 'fs-extra'
import url from 'url'
import { INDEX_HTML, LH_OUT_DIR, PW_TMP_DIR } from './constants'

let dirname
if (typeof __dirname !== 'string') {
    const filename = url.fileURLToPath(import.meta.url)
    dirname = path.dirname(filename)
} else {
    dirname = __dirname
}

const reportDir = path.join(process.cwd(), process.env.LH_REPORT_DIR || LH_OUT_DIR)
const htmlTemplatePath = path.join(dirname, 'lighthouse.html')

export async function lighthouseSetup() {
    await fse.ensureDir(reportDir)
    await fse.copyFile(htmlTemplatePath, path.join(reportDir, INDEX_HTML))
}

export async function lighthousePlaywrightTeardown() {
    await fse.remove(path.join(os.tmpdir(), PW_TMP_DIR))
}
