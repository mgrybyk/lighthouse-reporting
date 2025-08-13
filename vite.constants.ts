import * as path from 'path'

export const globals = {
    path: 'path',
    net: 'net',
    os: 'os',
    url: 'url',
    'fs-extra': 'fse',
    '@playwright/test': '@playwright/test',
}
// get-port is not included because it cannot be imported in umd mode due to its package type module.
export const external = ['path', 'os', 'net', 'url', 'fs-extra', '@playwright/test']
export const alias = {
    'node:net': 'net',
    'node:os': 'os',
}
export const entry = path.resolve(__dirname, './src/index.ts')
