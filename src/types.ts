export interface Options {
    swPath: string;
    customUI: {
        loadingComponent: string;
        callbackComponent: string;
    };
    shouldLooseContextOnRefresh: boolean;
    shouldLog: boolean;
}

export enum WorkerMsg {
    GET_USER_INFO,
    GET_USER_INFO_RES,
    CALLBACK,
    MAKE_AUTH,
    URL,
    AUTH_DONE,
    GET_TOKEN,
    GET_TOKEN_RES,
    UPDATE_CONTEXT,
    UPDATE_CONTEXT_RES,
}

export interface Config {
    shouldLog: boolean;
}
