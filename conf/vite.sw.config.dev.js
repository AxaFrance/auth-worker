const path = require('path');
const { defineConfig } = require('vite');

module.exports = defineConfig({
    build: {
        emptyOutDir: false,
        outDir: 'dev',
        lib: {
            entry: path.resolve(__dirname, '../src/worker/serviceWorker.ts'),
            name: 'sw',
            fileName: (format) =>
                format === 'es' ? `oidcsw.${format}.js` : `oidcsw.js`,
        },
    },
});
