import { Config } from '../types';

const config: Config = {
    shouldLog: false,
};

export const getConfig = () => config;

export const updateLogConfig = (value: boolean) => {
    config.shouldLog = value;
};

export const logger = (msg: string, ...args: any[]): void => {
    if (config.shouldLog) {
        console.log(msg, args);
    }
};
