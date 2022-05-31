#! /usr/bin/env node
const chalk = require('chalk');
const yargs = require('yargs/yargs');
const fs = require('fs');
const pathLib = require('path');
const { hideBin } = require('yargs/helpers');

const errorStyle = chalk.bold.red;
const successStyle = chalk.bold.greenBright;

yargs(hideBin(process.argv))
    .command(
        'copy',
        'Copy the service worker to the desired path',
        async () => {
            const currentDir = pathLib.dirname(__dirname);
            const nodeModulesDir = pathLib.dirname(currentDir);
            const projectDir = pathLib.dirname(nodeModulesDir);

            try {
                const src = await pathLib.resolve(
                    `${currentDir}/dist/sw`,
                    'oidcsw.js'
                );
                const dest = await pathLib.resolve(
                    `${projectDir}/public`,
                    'oidcsw.js'
                );

                await fs.promises.copyFile(src, dest);
                console.log(successStyle('service worker copied succesfully'));
            } catch (err) {
                console.log(errorStyle(err));
                console.log(
                    errorStyle(
                        `Consider running 'npx auth-worker init <absolute desired destination path of the service worker>'`
                    )
                );
            }
        }
    )
    .command(
        'init [path]',
        'Copy the service worker to the public path',
        (yargs) => {
            return yargs.positional('path', {
                describe: 'service worker destination ',
                default: undefined,
            });
        },
        async (argv) => {
            const { path } = argv;
            if (path) {
                try {
                    if (fs.existsSync(path)) {
                        const src = await pathLib.resolve(
                            `${pathLib.dirname(__dirname)}/dist/sw`,
                            'oidcsw.js'
                        );
                        const dest = await pathLib.resolve(path, 'oidcsw.js');

                        await fs.promises.copyFile(src, dest);
                        console.log(
                            successStyle('service worker copied succesfully')
                        );
                    } else {
                        console.log(
                            errorStyle(`Directory ${path} doesn't exist.`)
                        );
                        console.log(
                            errorStyle(
                                `Consider running 'npx auth-worker init <desired destination path of the service worker>'`
                            )
                        );
                    }
                } catch (err) {
                    console.log(errorStyle(err));
                }
            } else {
                console.log(errorStyle('missing path'));
            }
        }
    )
    .option('path', {
        alias: 'p',
        type: 'string',
        description: 'Absolute destination path of the service worker',
    }).argv;
