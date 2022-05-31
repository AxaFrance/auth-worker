import { AuthenticationType } from '../domain/model/AuthenticationType';
import { TokenInfos } from '../domain/model/TokenInfos';
import { OAuthFlow } from '../domain/OAuthFlow';
import { OAuthFlowAppAuth } from '../services/AppAuth/OAuthFlowAppAuth';
import { WorkerMsg } from '../types';

let oAuthFlow: OAuthFlow | undefined = undefined;
const channel = new BroadcastChannel('oidcsw-messages');

channel.addEventListener('message', async (event) => {
    if (event.isTrusted) {
        switch (event.data.type as WorkerMsg) {
            case WorkerMsg.GET_TOKEN:
                const urlToCheck: string = event.data.payload;

                if (oAuthFlow) {
                    const accessToken = await oAuthFlow.GetToken(urlToCheck);

                    if (accessToken) {
                        channel.postMessage({
                            type: WorkerMsg.GET_TOKEN_RES,
                            payload: { urlToCheck, accessToken },
                        });
                    } else {
                        channel.postMessage({
                            type: WorkerMsg.GET_TOKEN_RES,
                            payload: { urlToCheck, accessToken: '' },
                        });
                    }
                } else {
                    channel.postMessage({
                        type: WorkerMsg.GET_TOKEN_RES,
                        payload: { urlToCheck, accessToken: '' },
                    });
                }
                break;
            default:
                break;
        }
    }
});

self.onmessage = async (event) => {
    const message = event.data || event;

    if (!oAuthFlow) {
        oAuthFlow = new OAuthFlowAppAuth(
            message?.payload?.configuration,
            message?.payload?.urlToHandle,
            message?.payload?.location
        );
        await oAuthFlow.Init();
    }

    switch (message.type as WorkerMsg) {
        case WorkerMsg.GET_USER_INFO:
            postMessage({
                type: WorkerMsg.GET_USER_INFO_RES,
                payload: await oAuthFlow.GetUserInfos(),
            });
            break;
        case WorkerMsg.CALLBACK:
            await oAuthFlow.CompleteAuthorizationRequestIfPossible();

            break;
        case WorkerMsg.MAKE_AUTH:
            await oAuthFlow.Authenticate(AuthenticationType.REDIRECT);

            break;
        case WorkerMsg.UPDATE_CONTEXT:
            const tokenInfos = message.payload.tokenInfos as TokenInfos;
            oAuthFlow.UpdateTokenInfos(tokenInfos);

            break;
        default:
            break;
    }
};
