import { logger } from '../main/config';
import { addOidcConfig } from '../repository/workerRepository';
import { WorkerMsg } from '../types';
import { AuthenticationType } from './model/AuthenticationType';
import { AuthorizationConfiguration } from './model/AuthorizationConfiguration';
import { OidcConfiguration } from './model/OidcConfiguration';
import { TokenInfos } from './model/TokenInfos';
import { UserInfos } from './model/UserInfos';
export abstract class OAuthFlow {
    protected oidcConf: OidcConfiguration;
    protected authorizationConf: AuthorizationConfiguration | undefined;
    protected tokenInfos: TokenInfos | undefined;
    protected urlToHandle: string[];
    protected userInfos: UserInfos | undefined;
    protected location: string;

    constructor(
        oidcConf: OidcConfiguration,
        urlToHandle: string[],
        location: string
    ) {
        this.oidcConf = oidcConf;
        this.urlToHandle = urlToHandle;
        this.location = location;
    }

    async Authenticate(type: AuthenticationType): Promise<void> {
        switch (type) {
            case AuthenticationType.REDIRECT:
                const urlToRedirect = await this.GetRedirectUrl();

                addOidcConfig(this.oidcConf);

                logger('Making a request to ', urlToRedirect);
                postMessage({ type: WorkerMsg.URL, payload: urlToRedirect });
                break;

            default:
                break;
        }
    }

    UpdateTokenInfos(tokenInfo: TokenInfos): void {
        this.tokenInfos = tokenInfo;
        postMessage({
            type: WorkerMsg.UPDATE_CONTEXT_RES,
        });
    }

    GetUserInfos = async (): Promise<UserInfos | undefined> => {
        if (!this.userInfos) {
            if (
                this.authorizationConf?.userInfoEndpoint &&
                this.tokenInfos?.accessToken
            ) {
                const data = await fetch(
                    this.authorizationConf.userInfoEndpoint,
                    {
                        headers: {
                            Authorization: `Bearer ${this.tokenInfos.accessToken}`,
                        },
                    }
                );
                this.userInfos = (await data.json()) as UserInfos;
            } else {
                //TODO: Better error handling
                logger('No accessToken / userInfoEndpoint ??');
            }
        }
        return this.userInfos;
    };

    abstract Init(): Promise<void>;
    abstract GetToken(urlToCheck: string): Promise<string | undefined>;
    abstract IsLogged(): boolean;
    abstract GetRedirectUrl(): Promise<string>;
    abstract CompleteAuthorizationRequestIfPossible(): Promise<void>;
}
