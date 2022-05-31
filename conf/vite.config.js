const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
    build: {
        outDir: 'dist/main',
        lib: {
            entry: path.resolve(__dirname, '../src/main/index.ts'),
            name: 'oidcsw',
            fileName: (format) => `main.${format}.js`,
        },
    },
});
