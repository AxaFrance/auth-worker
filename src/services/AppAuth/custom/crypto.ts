// @ts-nocheck
import { AppAuthError } from '@openid/appauth/built/errors';
import { Crypto } from '@openid/appauth/built/crypto_utils';
import * as base64 from 'base64-js';

const HAS_CRYPTO = typeof self !== 'undefined' && Boolean(self.crypto as any);
const HAS_SUBTLE_CRYPTO = HAS_CRYPTO && Boolean(self.crypto.subtle as any);
const CHARSET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function bufferToString(buffer: Uint8Array): string {
    const state = [];
    for (let i = 0; i < buffer.byteLength; i += 1) {
        const index = buffer[i] % CHARSET.length;
        state.push(CHARSET[index]);
    }
    return state.join('');
}

export function urlSafe(buffer: Uint8Array): string {
    const encoded = base64.fromByteArray(new Uint8Array(buffer));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}

// adapted from source: http://stackoverflow.com/a/11058858
// this is used in place of TextEncode as the api is not yet
// well supported: https://caniuse.com/#search=TextEncoder
export function textEncodeLite(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);

    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return bufView;
}

export class WorkerCrypto implements Crypto {
    generateRandom(size: number): string {
        const buffer = new Uint8Array(size);
        if (HAS_CRYPTO) {
            self.crypto.getRandomValues(buffer);
        } else {
            // fall back to Math.random() if nothing else is available
            for (let i = 0; i < size; i += 1) {
                buffer[i] = (Math.random() * CHARSET.length) | 0;
            }
        }
        return bufferToString(buffer);
    }

    deriveChallenge(code: string): Promise<string> {
        if (code.length < 43 || code.length > 128) {
            return Promise.reject(new AppAuthError('Invalid code length.'));
        }
        if (!HAS_SUBTLE_CRYPTO) {
            return Promise.reject(
                new AppAuthError('self window.crypto.subtle is unavailable.')
            );
        }

        return new Promise((resolve, reject) => {
            self.crypto.subtle.digest('SHA-256', textEncodeLite(code)).then(
                (buffer) => resolve(urlSafe(new Uint8Array(buffer))),
                (error) => reject(error)
            );
        });
    }
}
