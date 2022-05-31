import { StringMap } from '@openid/appauth/built/types';
import { WorkerCrypto } from './custom/crypto';
import { AuthorizationRequest } from '@openid/appauth/built/authorization_request';
import { AuthorizationServiceConfiguration } from '@openid/appauth/built/authorization_service_configuration';
import { FetchRequestor } from '@openid/appauth/built/xhr';
import {
    GRANT_TYPE_AUTHORIZATION_CODE,
    GRANT_TYPE_REFRESH_TOKEN,
    TokenRequest,
} from '@openid/appauth/built/token_request';
import { BaseTokenRequestHandler } from '@openid/appauth/built/token_request_handler';
import { TokenResponse } from '@openid/appauth/built/token_response';
import { AuthorizationConfiguration } from '../../domain/model/AuthorizationConfiguration';
import { WorkerRedirectRequestHandler } from './redirectRequestHandler';
import { ToAuthorizationServiceConfigurationModel } from './helpers/AuthorizationConfigurationHelpers';
import { OidcConfiguration } from '../../domain/model/OidcConfiguration';
import { logger } from '../../main/config';

const requestor = new FetchRequestor();
const tokenHandler = new BaseTokenRequestHandler(requestor);

export const getConfigurationFromIssuer = async (
    url: string
): Promise<AuthorizationConfiguration> => {
    try {
        const response =
            await AuthorizationServiceConfiguration.fetchFromIssuer(
                url,
                requestor
            );
        logger('Fetched service configuration', response);

        return ToAuthorizationServiceConfigurationModel(response);
    } catch (error) {
        logger('Something bad happened', error);

        throw error;
    }
};
export const makeRedirectAuthorizationRequest = async (
    configuration: AuthorizationServiceConfiguration,
    OidcConf: OidcConfiguration,
    authReqhandler: WorkerRedirectRequestHandler,
    location: string
): Promise<string> => {
    if (!configuration) {
        logger('Unknown service configuration');
        return '';
    }

    const extras: StringMap = { prompt: 'consent', access_type: 'offline' };
    const { clientId, callbackRedirectUri, scope } = OidcConf;

    const request = new AuthorizationRequest(
        {
            client_id: clientId,
            redirect_uri: callbackRedirectUri,
            scope: scope,
            response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
            state: btoa(JSON.parse(location).href),
            extras: extras,
        },
        new WorkerCrypto()
    );

    logger('Making authorization request ', configuration, request);

    return await authReqhandler.buildAuthorizationRequest(
        configuration,
        request
    );
};

export const makeRefreshTokenRequest = async (
    configuration: AuthorizationServiceConfiguration,
    oidcConfiguration: OidcConfiguration,
    code: string,
    codeVerifier: string | undefined
): Promise<TokenResponse | undefined> => {
    if (!configuration) {
        logger('Unknown service configuration');
        return Promise.resolve(undefined);
    }

    const extras: StringMap = {};

    if (codeVerifier) {
        extras.code_verifier = codeVerifier;
    }

    // use the code to make the token request.
    const request = new TokenRequest({
        client_id: oidcConfiguration.clientId,
        redirect_uri: oidcConfiguration.callbackRedirectUri,
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: code,
        refresh_token: undefined,
        extras: { ...extras, ...oidcConfiguration.extra },
    });

    logger('makeRefreshTokenRequest', request);

    return await tokenHandler.performTokenRequest(configuration, request);
};

export const performWithFreshTokens = async (
    configuration: AuthorizationServiceConfiguration,
    oidcConfiguration: OidcConfiguration,
    refreshToken: string
): Promise<TokenResponse> => {
    if (!configuration) {
        logger('Unknown service configuration');
        return Promise.reject('Unknown service configuration');
    }
    if (!refreshToken) {
        logger('Missing refreshToken.');
        return Promise.reject('Missing refreshToken.');
    }
    const request = new TokenRequest({
        client_id: oidcConfiguration.clientId,
        redirect_uri: oidcConfiguration.callbackRedirectUri,
        grant_type: GRANT_TYPE_REFRESH_TOKEN,
        code: undefined,
        refresh_token: refreshToken,
        extras: undefined,
    });

    logger('performWithFreshTokens', request);

    const accessTokenResponse = await tokenHandler.performTokenRequest(
        configuration,
        request
    );

    return accessTokenResponse;
};
