import { getTokenForSw } from '../domain/domain';

const sw = self as unknown as ServiceWorkerGlobalScope & typeof globalThis;

sw.addEventListener('install', function () {
    return sw.skipWaiting();
});

sw.addEventListener('activate', async function () {
    return sw.clients.claim();
});

const handleRequest = async (request: Request): Promise<Response> => {
    switch (request.destination) {
        case '':
            const accessToken = await getTokenForSw(request.url);
            if (accessToken) {
                const headers = new Headers();
                headers.append('Authorization', `Bearer ${accessToken}`);
                headers.append('Content-Type', 'application/json');
                headers.append('Accept', 'application/json');

                getHeaders(request.headers).forEach(([name, value]) => {
                    headers.append(name, value);
                });

                return fetch(request, {
                    headers,
                });
            }

        default:
            return fetch(request);
    }
};

sw.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;
    return event.respondWith(handleRequest(request));
});

const getHeaders = (headers: Headers): Array<Array<string>> => {
    const res: Array<Array<string>> = [];

    for (const data of headers) {
        res.push(data);
    }

    return res;
};
