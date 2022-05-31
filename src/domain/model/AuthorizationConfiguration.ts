export interface AuthorizationConfiguration {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revocationEndpoint: string;
    userInfoEndpoint?: string;
    endSessionEndpoint?: string;
}
