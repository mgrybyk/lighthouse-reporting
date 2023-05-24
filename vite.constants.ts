import * as path from 'path'

export const globals = {
    path: 'path',
    net: 'net',
    os: 'os',
    url: 'url',
    'fs-extra': 'fse',
}
export const external = ['path', 'os', 'net', 'url', 'fs-extra', '@playwright/test']
export const alias = {
    'node:net': 'net',
    'node:os': 'os',
}
export const entry = path.resolve(__dirname, './src/index.ts')
