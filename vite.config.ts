import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { alias, external, globals } from './vite.constants'

export default defineConfig({
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'src/lighthouse.html',
                    dest: '',
                },
            ],
        }),
    ],
    resolve: {
        alias,
    },
    build: {
        emptyOutDir: true,
        minify: false,
        lib: {
            entry: ['./src/index.ts', './src/hooks.ts', './src/lighthouseReports.ts', './src/lighthouseTest.ts'],
            formats: ['cjs', 'es'],
        },
        rollupOptions: {
            external: [...external, 'get-port'],
            output: {
                globals: {
                    ...globals,
                    'get-port': 'getPort',
                },
            },
        },
    },
})
