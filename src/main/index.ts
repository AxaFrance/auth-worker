import { Options } from '../types';
import '../views/loading';

import Worker from '../worker/oAuthWorker?worker&inline';
import { defaultOptions, installServiceWorker, updateUI } from './utils';
import {
    isAlreadyAuthenticaded,
    isCallback,
    onAuthentication,
    onCallback,
    onGetUserInfos,
    updateContextWithTokenInfos,
} from '../domain/domain';
import { dropInstance, getTokenInfos } from '../repository/workerRepository';
import { UserInfos } from '../domain/model/UserInfos';
import { isTokenNotExpired } from '../services/utils';
import { logger, updateLogConfig } from './config';
import { OidcConfiguration } from '../domain/model/OidcConfiguration';

const worker = new Worker();

const start = async (
    urlOidcconfiguration: Map<string[], OidcConfiguration>,
    customOptions: Options
): Promise<void> =>
    new Promise(async (resolve) => {
        let options: Options = {
            ...defaultOptions,
            ...customOptions,
        };
        updateLogConfig(options.shouldLog);

        if ('serviceWorker' in navigator) {
            await installServiceWorker(options.swPath);

            urlOidcconfiguration.forEach(async (configuration, url) => {
                if (
                    !isCallback(
                        location.href,
                        configuration.callbackRedirectUri
                    )
                ) {
                    const tokenInfos = await getTokenInfos();

                    if (
                        isAlreadyAuthenticaded(tokenInfos) &&
                        isTokenNotExpired(
                            tokenInfos.issuedAt,
                            tokenInfos.expiresIn
                        )
                    ) {
                        await updateContextWithTokenInfos(
                            worker,
                            tokenInfos,
                            url,
                            configuration
                        );

                        if (options.shouldLooseContextOnRefresh) {
                            await dropInstance();
                        }

                        resolve();
                    } else {
                        updateUI(
                            options.customUI.loadingComponent,
                            'Authentification en cours'
                        );

                        await onAuthentication(worker, url, configuration);
                        resolve();
                    }
                }
            });
        } else {
            logger('Service workers are not supported.');
            resolve();
        }
    });

const callback = () => {
    onCallback(worker);
};

const getUserInfos = async (): Promise<UserInfos | undefined> =>
    await onGetUserInfos(worker);

export { start, callback, getUserInfos };
