import { defineConfig } from 'vite'
import { alias, entry, external, globals } from './vite.constants'

export default defineConfig({
    resolve: {
        alias,
    },
    build: {
        emptyOutDir: false,
        minify: false,
        lib: {
            entry,
            name: 'lh_rep',
            formats: ['umd'],
        },
        rollupOptions: {
            external,
            output: {
                format: 'umd',
                globals,
            },
        },
    },
})
