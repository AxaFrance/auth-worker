import { OAuthFlow } from '../../domain/OAuthFlow';
import { OidcConfiguration } from '../../domain/model/OidcConfiguration';
import {
    getConfigurationFromIssuer,
    makeRedirectAuthorizationRequest,
    makeRefreshTokenRequest,
    performWithFreshTokens,
} from './utils';
import { ToAuthorizationServiceConfiguration } from './helpers/AuthorizationConfigurationHelpers';
import { WorkerRedirectRequestHandler } from './redirectRequestHandler';
import {
    AuthorizationError,
    AuthorizationNotifier,
    AuthorizationRequest,
    AuthorizationResponse,
} from '@openid/appauth';
import { WorkerMsg } from '../../types';
import { ToTokenResponseModel } from './helpers/TokenHelpers';
import { addTokenInfos } from '../../repository/workerRepository';
import { isTokenNotExpired } from '../utils';
import { logger } from '../../main/config';

export class OAuthFlowAppAuth extends OAuthFlow {
    private authReqhandler: WorkerRedirectRequestHandler;

    constructor(
        oidcConf: OidcConfiguration,
        urlToHandle: string[],
        windowLocation = '{}'
    ) {
        super(oidcConf, urlToHandle, windowLocation);
        this.authReqhandler = new WorkerRedirectRequestHandler(
            undefined,
            undefined,
            JSON.parse(windowLocation)
        );
    }

    async Init(): Promise<void> {
        this.authorizationConf = await getConfigurationFromIssuer(
            this.oidcConf.openIdConnectProvider
        );

        const notifier = new AuthorizationNotifier();
        this.authReqhandler.setAuthorizationNotifier(notifier);
        notifier.setAuthorizationListener(
            async (
                request: AuthorizationRequest,
                response: AuthorizationResponse | null,
                error: AuthorizationError | null
            ) => {
                await this.AuthorizationListener(request, response, error);
            }
        );
    }

    GetRedirectUrl(): Promise<string> {
        if (this.authorizationConf) {
            return makeRedirectAuthorizationRequest(
                ToAuthorizationServiceConfiguration(this.authorizationConf),
                this.oidcConf,
                this.authReqhandler,
                this.location
            );
        } else {
            //TODO: Error handler
            return Promise.resolve('');
        }
    }

    async GetToken(url: string): Promise<string | undefined> {
        if (this.tokenInfos && this.authorizationConf) {
            logger('worker', this.urlToHandle);

            if (this.urlToHandle.some((_urls) => url.includes(_urls))) {
                if (this.IsLogged()) {
                    return this.tokenInfos.accessToken;
                } else {
                    const result = await performWithFreshTokens(
                        ToAuthorizationServiceConfiguration(
                            this.authorizationConf
                        ),
                        this.oidcConf,
                        this.tokenInfos.refreshToken
                    );

                    this.tokenInfos = ToTokenResponseModel(result);

                    return this.tokenInfos.accessToken;
                }
            } else {
                return '';
            }
        } else {
            //TODO: Error handler
            return '';
        }
    }

    IsLogged(): boolean {
        if (this.tokenInfos) {
            if (this.tokenInfos.expiresIn) {
                return isTokenNotExpired(
                    this.tokenInfos.issuedAt,
                    this.tokenInfos.expiresIn
                );
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    async CompleteAuthorizationRequestIfPossible() {
        await this.authReqhandler.completeAuthorizationRequestIfPossible();
    }

    async AuthorizationListener(
        request: AuthorizationRequest,
        response: AuthorizationResponse | null,
        error: AuthorizationError | null
    ) {
        if (this.authorizationConf) {
            logger('Authorization request complete ', request, response, error);
            if (response) {
                let codeVerifier: string | undefined;
                if (request.internal && request.internal.code_verifier) {
                    codeVerifier = request.internal.code_verifier;
                }

                const configuration = ToAuthorizationServiceConfiguration(
                    this.authorizationConf
                );

                const responseRefreshToken = await makeRefreshTokenRequest(
                    configuration,
                    this.oidcConf,
                    response.code,
                    codeVerifier
                );

                if (responseRefreshToken) {
                    this.tokenInfos =
                        ToTokenResponseModel(responseRefreshToken);

                    await addTokenInfos(this.tokenInfos);

                    postMessage({
                        type: WorkerMsg.AUTH_DONE,
                        payload: atob(request.state),
                    });
                } else {
                    //TODO: Error handler
                    logger("can't get token!");
                }
            } else {
                //TODO: Error handler
                logger('no authorization Conf ??', this.authorizationConf);
            }
        }
    }
}
