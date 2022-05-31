import { StringMap } from '@openid/appauth';

export interface OidcConfiguration {
    openIdConnectProvider: string;
    clientId: string;
    redirectUri: string;
    callbackRedirectUri: string;
    scope: string;
    extra: StringMap;
}
