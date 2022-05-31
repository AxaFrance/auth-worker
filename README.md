# Auth-worker

Auth-worker provides a service worker to easily manage Oidc authentication.

After the setup and depending on the fetch request, the token will be automatically added in the header.

![workflow](AuthWorkerFlow.png 'AuthWorker Flow')

## Prerequisite

-   Identity Provider
-   Client ID
-   Scope

## Usage
:warning: Not on npm right now...
```npm
npm install @axa-fr/auth-worker
```

The usage is quite simple. Two methods are needed :

-   start
-   callback

A file containing the service worker is copied in your `public` folder during the `npm install`. If it fails, you can use `npx auth-worker init ${path}` to build and copy the worker where you want.

### Start

The `start` method takes two parameters : the oidc configuration and the optionnal worker configuration.

The oidc configuration is based on a javascript map. The key is the list of all the domain that have to be intercepted by the worker, the value is the oidc configuration :

-   openIdConnectProvider
-   clientId
-   callbackRedirectUri
-   scope

```javascript
const map = new Map();
map.set(["https://my.app/api"], {
    openIdConnectProvider: "https://accounts.google.com",
    clientId: "123456789",
    callbackRedirectUri: "https://my.app/callback",
    scope: "scope",
});
await start(map, {
    swPath: '/oidcsw.js',
    customUI: {
        callbackComponent: '',
        loadingComponent: '',
    },
});
```

The worker configuration is optional. You can override some parameters like the path of the worker, and the webcomponent that have to be display during the logging process.

### Callback

The `callback` method have to be called on the page targeted by callbackRedirectUri parameter

```javascript
callback();
```

## Implementation

You can look at the ``/dev`` folder for a simple usecase.
### React

This is an example for an usage in a React project

**_App.js_**

```javascript
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import { UserContext, useUser } from 'services/user';
import { conf } from 'services/environments';
import { start } from 'auth-worker';
import AuthenticationCallback from 'pages/AuthenticationCallback';

import AppContent from './AppContent';

const App = () => {
    const [isLogged, setIsLogged] = useState(false);
    const valueUseUser = useUser();

    useEffect(async () => {
        ( async () => {
            const map = new Map();
            map.set([conf.apiUrl, conf.referentielMachineUrl], {
                openIdConnectProvider: conf.oidc.openIdConnectProvider,
                clientId: conf.oidc.clientId,
                callbackRedirectUri: conf.oidc.callbackRedirectUri,
                scope: conf.oidc.scope,
            });
            await start(map, {
                swPath: '/oidcsw.js',
                customUI: {
                    callbackComponent: '',
                    loadingComponent: '',
                },
            });

        setIsLogged(true);

        })()

    }, []);

    return (
        <Router>
            <Route
                component={AuthenticationCallback}
                exact
                path={`${conf.baseUrl}/${conf.oidc.callbackUrl}`}
            />
            {isLogged ? (
                <UserContext.Provider value={valueUseUser}>
                    <AppContent />
                </UserContext.Provider>
            ) : null}
        </Router>
    );
};

export default App;
```

You can retrieve the user informations in the `AppContent` for example, this information can be stored in the contexte provided by the `UserContext`.

**_pages/AuthenticationCallback.js_**

```javascript
import { useEffect } from 'react';
import { callback } from 'auth-worker';

const AuthenticationCallback = () => {
    useEffect(() => {
        callback();
    }, []);

    return <h1>Callback</h1>;
};

export default AuthenticationCallback;
```

### TODO

- [ ] Easier setup for start (No map parameter on entry)
- [ ] Support for custom (non oidc) provider
- [ ] Add popular framework wrapper
- [ ] Safari support ( dropping Broadcast Channel )

### Contributing

Before you start working on something, it's best to check if there is an existing issue first.

Please make sure to read the [Contributing Guide](./.github/CONTRIBUTING.md) before making a pull request.

Thank you to everyone contributing!
