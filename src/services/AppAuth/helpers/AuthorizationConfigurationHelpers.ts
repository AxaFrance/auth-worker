import { AuthorizationServiceConfiguration } from '@openid/appauth';
import { AuthorizationConfiguration } from '../../../domain/model/AuthorizationConfiguration';

export const ToAuthorizationServiceConfigurationModel = (
    authConf: AuthorizationServiceConfiguration
): AuthorizationConfiguration => {
    return {
        authorizationEndpoint: authConf.authorizationEndpoint,
        revocationEndpoint: authConf.revocationEndpoint,
        tokenEndpoint: authConf.tokenEndpoint,
        endSessionEndpoint: authConf.endSessionEndpoint,
        userInfoEndpoint: authConf.userInfoEndpoint,
    } as AuthorizationConfiguration;
};

export const ToAuthorizationServiceConfiguration = (
    authConf: AuthorizationConfiguration
): AuthorizationServiceConfiguration => {
    return {
        authorizationEndpoint: authConf.authorizationEndpoint,
        revocationEndpoint: authConf.revocationEndpoint,
        tokenEndpoint: authConf.tokenEndpoint,
        endSessionEndpoint: authConf.endSessionEndpoint,
        userInfoEndpoint: authConf.userInfoEndpoint,
    } as AuthorizationServiceConfiguration;
};
