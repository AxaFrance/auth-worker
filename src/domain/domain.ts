import { logger } from '../main/config';
import { dropOidcConfig, getOidcConfig } from '../repository/workerRepository';
import { WorkerMsg } from '../types';
import { OidcConfiguration } from './model/OidcConfiguration';
import { TokenInfos } from './model/TokenInfos';
import { UserInfos } from './model/UserInfos';

export const isCallback = (location: string, oidcConfCallbacUrk: string) =>
    location.includes(oidcConfCallbacUrk);

export const isAlreadyAuthenticaded = (tokenInfo: TokenInfos): boolean =>
    !!tokenInfo;

export const updateContextWithTokenInfos = (
    worker: Worker,
    tokenInfos: TokenInfos,
    urls: string[],
    configuration: OidcConfiguration
): Promise<void> =>
    new Promise((resolve) => {
        logger('Auth done, updating context');

        worker.postMessage({
            type: WorkerMsg.UPDATE_CONTEXT,
            payload: {
                tokenInfos,
                configuration,
                location: JSON.stringify(window.location),
                urlToHandle: urls,
            },
        });

        worker.onmessage = (event) => {
            if (event.isTrusted) {
                switch (event.data.type as WorkerMsg) {
                    case WorkerMsg.UPDATE_CONTEXT_RES:
                        resolve();

                        break;
                    default:
                        break;
                }
            }
        };
    });

export const onCallback = async (worker: Worker): Promise<void> =>
    new Promise(async (resolve) => {
        const oidcConfig = await getOidcConfig();

        worker.postMessage({
            type: WorkerMsg.CALLBACK,
            payload: {
                location: JSON.stringify(window.location),
                configuration: {
                    ...oidcConfig,
                },
            },
        });

        worker.onmessage = async (event) => {
            if (event.isTrusted) {
                switch (event.data.type as WorkerMsg) {
                    case WorkerMsg.AUTH_DONE:
                        await dropOidcConfig();
                        window.location.assign(event.data.payload);

                        break;
                    default:
                        resolve();

                        break;
                }
            }
        };
    });

export const onAuthentication = (
    worker: Worker,
    urls: string[],
    configuration: OidcConfiguration
): Promise<void> =>
    new Promise((resolve) => {
        worker.postMessage({
            type: WorkerMsg.MAKE_AUTH,
            payload: {
                location: JSON.stringify(window.location),
                urlToHandle: urls,
                configuration,
            },
        });

        worker.onmessage = (event) => {
            if (event.isTrusted) {
                switch (event.data.type as WorkerMsg) {
                    case WorkerMsg.URL:
                        window.location.assign(event.data.payload);
                        break;
                    default:
                        resolve();
                        break;
                }
            }
        };
    });

export const getTokenForSw = async (urlToCheck: string): Promise<string> =>
    new Promise((resolve) => {
        const channel = new BroadcastChannel('oidcsw-messages');

        channel.addEventListener('message', (event) => {
            if (event.isTrusted) {
                switch (event.data.type as WorkerMsg) {
                    case WorkerMsg.GET_TOKEN_RES:
                        if (event.data.payload.urlToCheck === urlToCheck) {
                            channel.close();
                            resolve(event.data.payload.accessToken);
                        }
                        break;
                    default:
                        break;
                }
            } else {
                channel.close();
                resolve('');
            }
        });

        channel.postMessage({
            type: WorkerMsg.GET_TOKEN,
            payload: urlToCheck,
        });
    });

export const onGetUserInfos = (
    worker: Worker
): Promise<UserInfos | undefined> =>
    new Promise((resolve) => {
        worker.postMessage({
            type: WorkerMsg.GET_USER_INFO,
            payload: {},
        });

        worker.onmessage = async (event) => {
            if (event.isTrusted) {
                switch (event.data.type as WorkerMsg) {
                    case WorkerMsg.GET_USER_INFO_RES:
                        resolve(event.data.payload);
                    default:
                        resolve(undefined);
                }
            }
        };

        setTimeout(() => {
            resolve(undefined);
        }, 3000);
    });
