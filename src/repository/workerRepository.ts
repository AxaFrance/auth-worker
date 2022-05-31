import localForage from 'localforage';
import { OidcConfiguration } from '../domain/model/OidcConfiguration';
import { TokenInfos } from '../domain/model/TokenInfos';

const DB_NAME = 'workerBackend';

let isInitialized = false;

const init = () => {
    if (!isInitialized) {
        localForage.config({
            driver: localForage.INDEXEDDB,
            description: 'Storage for auth worker',
            name: DB_NAME,
            version: 1,
        });
        isInitialized = true;
    }
};

init();

export const getInstance = () => {
    return localForage;
};

export const dropInstance = async () => {
    await localForage.dropInstance();
    self.indexedDB.deleteDatabase(DB_NAME);
};

export const addTokenInfos = async (tokenInfos: TokenInfos) => {
    await localForage.setItem('TOKEN_INFOS', tokenInfos);
};

export const addOidcConfig = async (oidcConf: OidcConfiguration) => {
    await localForage.setItem('OIDC_CONF', oidcConf);
};

export const getTokenInfos = async (): Promise<TokenInfos> => {
    const data = (await localForage.getItem('TOKEN_INFOS')) as TokenInfos;

    return data;
};

export const getOidcConfig = async (): Promise<OidcConfiguration> => {
    const data = (await localForage.getItem('OIDC_CONF')) as OidcConfiguration;

    return data;
};

export const dropOidcConfig = async (): Promise<void> =>
    await localForage.removeItem('OIDC_CONF');
