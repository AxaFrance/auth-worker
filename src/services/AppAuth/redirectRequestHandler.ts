import { AuthorizationServiceConfiguration } from '@openid/appauth/built/authorization_service_configuration';
import {
    AuthorizationRequestHandler,
    AuthorizationRequestResponse,
} from '@openid/appauth/built/authorization_request_handler';
import { AuthorizationRequest } from '@openid/appauth/built/authorization_request';
import {
    AuthorizationError,
    AuthorizationResponse,
} from '@openid/appauth/built/authorization_response';
import { StorageBackend } from '@openid/appauth/built/storage';
import { BasicQueryStringUtils } from '@openid/appauth/built/query_string_utils';
import { LocationLike } from '@openid/appauth/built/types';
import { WorkerStorageBackend } from './custom/storage';
import { WorkerCrypto } from './custom/crypto';
import { logger } from '../../main/config';

/** key for authorization request. */
const authorizationRequestKey = (handle: string) =>
    `${handle}_appauth_authorization_request`;

/** key for authorization service configuration */
const authorizationServiceConfigurationKey = (handle: string) =>
    `${handle}_appauth_authorization_service_configuration`;

/** key in local storage which represents the current authorization request. */
const AUTHORIZATION_REQUEST_HANDLE_KEY =
    'appauth_current_authorization_request';

export class WorkerRedirectRequestHandler extends AuthorizationRequestHandler {
    constructor(
        // use the provided storage backend
        // or initialize local storage with the default storage backend which
        // uses window.localStorage
        public storageBackend: StorageBackend = new WorkerStorageBackend(),
        utils = new BasicQueryStringUtils(),
        public locationLike: LocationLike,
        crypto: WorkerCrypto = new WorkerCrypto()
    ) {
        super(utils, crypto);
    }

    async buildAuthorizationRequest(
        configuration: AuthorizationServiceConfiguration,
        request: AuthorizationRequest
    ): Promise<string> {
        const handle = this.crypto.generateRandom(10);

        // before you make request, persist all request related data in local storage.
        const persisted = Promise.all([
            this.storageBackend.setItem(
                AUTHORIZATION_REQUEST_HANDLE_KEY,
                handle
            ),
            // Calling toJson() adds in the code & challenge when possible
            request
                .toJson()
                .then((result) =>
                    this.storageBackend.setItem(
                        authorizationRequestKey(handle),
                        JSON.stringify(result)
                    )
                ),
            this.storageBackend.setItem(
                authorizationServiceConfigurationKey(handle),
                JSON.stringify(configuration)
            ),
        ]);

        await persisted;
        // make the redirect request
        const url = this.buildRequestUrl(configuration, request);
        return url;
    }

    /**
     * @deprecated Use buildAuthorizationRequest instead to get the redirect url without commiting
     * (No location operation is possible in a worker context)
     */
    performAuthorizationRequest(
        configuration: AuthorizationServiceConfiguration,
        request: AuthorizationRequest
    ): void {
        const handle = this.crypto.generateRandom(10);

        // before you make request, persist all request related data in local storage.
        const persisted = Promise.all([
            this.storageBackend.setItem(
                AUTHORIZATION_REQUEST_HANDLE_KEY,
                handle
            ),
            // Calling toJson() adds in the code & challenge when possible
            request
                .toJson()
                .then((result) =>
                    this.storageBackend.setItem(
                        authorizationRequestKey(handle),
                        JSON.stringify(result)
                    )
                ),
            this.storageBackend.setItem(
                authorizationServiceConfigurationKey(handle),
                JSON.stringify(configuration.toJson())
            ),
        ]);

        persisted.then(() => {
            // make the redirect request
            // const url = this.buildRequestUrl(configuration, request);
        });
    }

    /**
     * Attempts to introspect the contents of storage backend and completes the
     * request.
     */
    protected completeAuthorizationRequest(): Promise<AuthorizationRequestResponse | null> {
        // TODO(rahulrav@): handle authorization errors.
        return this.storageBackend
            .getItem(AUTHORIZATION_REQUEST_HANDLE_KEY)
            .then((handle) => {
                if (handle) {
                    // we have a pending request.
                    // fetch authorization request, and check state
                    return (
                        this.storageBackend
                            .getItem(authorizationRequestKey(handle))
                            // requires a corresponding instance of result
                            // TODO(rahulrav@): check for inconsitent state here
                            .then((result) => JSON.parse(result!))
                            .then((json) => new AuthorizationRequest(json))
                            .then((request) => {
                                // check redirect_uri and state
                                const currentUri = `${this.locationLike.origin}${this.locationLike.pathname}`;
                                const queryParams = this.utils.parse(
                                    this.locationLike,
                                    false /* use hash */
                                );
                                const state: string | undefined =
                                    queryParams.state;
                                const code: string | undefined =
                                    queryParams.code;
                                const error: string | undefined =
                                    queryParams.error;
                                logger(
                                    'Potential authorization request ',
                                    currentUri,
                                    queryParams,
                                    state,
                                    code,
                                    error
                                );
                                const shouldNotify = state === request.state;
                                let authorizationResponse: AuthorizationResponse | null =
                                    null;
                                let authorizationError: AuthorizationError | null =
                                    null;
                                if (shouldNotify) {
                                    if (error) {
                                        // get additional optional info.
                                        const errorUri = queryParams.error_uri;
                                        const errorDescription =
                                            queryParams.error_description;
                                        authorizationError =
                                            new AuthorizationError({
                                                error: error,
                                                error_description:
                                                    errorDescription,
                                                error_uri: errorUri,
                                                state: state,
                                            });
                                    } else {
                                        authorizationResponse =
                                            new AuthorizationResponse({
                                                code: code,
                                                state: state,
                                            });
                                    }
                                    // cleanup state
                                    return Promise.all([
                                        this.storageBackend.removeItem(
                                            AUTHORIZATION_REQUEST_HANDLE_KEY
                                        ),
                                        this.storageBackend.removeItem(
                                            authorizationRequestKey(handle)
                                        ),
                                        this.storageBackend.removeItem(
                                            authorizationServiceConfigurationKey(
                                                handle
                                            )
                                        ),
                                    ]).then(() => {
                                        logger(
                                            'Delivering authorization response'
                                        );
                                        return {
                                            request: request,
                                            response: authorizationResponse,
                                            error: authorizationError,
                                        } as AuthorizationRequestResponse;
                                    });
                                }
                                logger(
                                    'Mismatched request (state and request_uri) dont match.'
                                );
                                return Promise.resolve(null);
                            })
                    );
                }
                return null;
            });
    }
}
