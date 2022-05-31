import { Options } from '../types';
import { logger } from './config';

export const updateUI = (
    componentName: string,
    selfComponentLabelFallback: string
) => {
    document.querySelector('html')!.innerHTML = '';
    if (componentName) {
        const component = document.createElement(`${componentName}`);
        document.body.appendChild(component);
    } else {
        document.body.appendChild(updateSelfUI(selfComponentLabelFallback));
    }
};

export const updateSelfUI = (label: string): HTMLElement => {
    const load = document.createElement('loading-component');
    load.setAttribute('label', label);

    return load;
};

export const installServiceWorker = async (swPath: string): Promise<void> => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const activeReg = registrations.find(
        (reg) => reg.active && reg.active.scriptURL.includes('oidcsw')
    );

    if (activeReg) {
        await activeReg.update();
    } else {
        try {
            const registration = await navigator.serviceWorker.register(swPath);
            logger('Service worker registration succeeded:', registration);
        } catch (error) {
            logger('Service worker registration failed:', error);
        }
    }
};

export const defaultOptions: Options = {
    swPath: '/oidcsw.js',
    customUI: {
        callbackComponent: '',
        loadingComponent: '',
    },
    shouldLooseContextOnRefresh: false,
    shouldLog: false,
};
