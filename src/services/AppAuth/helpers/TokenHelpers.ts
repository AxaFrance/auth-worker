import { TokenResponse } from '@openid/appauth';
import { TokenInfos } from '../../../domain/model/TokenInfos';

export const ToTokenResponseModel = (
    tokenResponse: TokenResponse
): TokenInfos => {
    return {
        accessToken: tokenResponse.accessToken,
        refreshToken: tokenResponse.refreshToken ?? '',
        expiresIn: tokenResponse.expiresIn ?? 0,
        idToken: tokenResponse.idToken ?? '',
        issuedAt: tokenResponse.issuedAt,
        scope: tokenResponse.scope ?? '',
    };
};
