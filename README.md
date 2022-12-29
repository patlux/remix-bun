# remix-bun

[Bun](https://github.com/oven-sh/bun) [server adapter](https://remix.run/docs/en/v1/other-api/adapter) for [remix](https://github.com/remix-run)

## Get Started

### Prerequirements

- [bun](https://bun.sh)

Now either [setup a new project](#create-a-new-remix-app) or add `remix-bun` to [your existing project](#add-to-existing-project):

### Create a new remix app

#### Use the example in `examples/basic` (fastest way)

```sh
$ git clone git@github.com:patlux/remix-bun.git
$ cd remix-bun/examples/basic
$ bun install
```

You are ready to go!

Just run `bun run dev` to [start the development server](#development).

#### Use `create-remix`

Create a new project with the following commands:

```sh
$ bunx create-remix@latest --no-install 

# Where would you like to create your app?
# -> my-remix-bun-app
# What type of app do you want to create?
# -> Just the basics
# Where do you want to deploy? Choose Remix App Server if you're unsure; it's easy to change deployment targets.
# -> Remix App Server
# TypeScript or JavaScript?
# -> TypeScript
# 💿 That's it! `cd` into "<..>/my-remix-bun-app" and check the README for development and deploy instructions!

$ cd my-remix-bun-app
```

Continue with the steps below in `Add to existing project`

### Add to existing project

Add `remix-bun` to your existing project with the following commands:

```sh
$ bun add remix-bun
$ bun add -d bun-types npm-run-all
# See below in "Setup project" for further instructions
```

## Setup project

Make sure you followed the instructions above before you continue.

1. Add `server.ts` in the root of your project:

```ts
// <root-folder>/server.ts

import type { ServeOptions } from 'bun';
import { createRequestHandler } from 'remix-bun';

setInterval(() => Bun.gc(true), 9000);

const bunServeOptions: ServeOptions = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  fetch:
    process.env.NODE_ENV === 'production'
      ? createRequestHandler({
        build: require('./build'),
        mode: 'production',
      })
      : async (request: Request) => {
        const build = require('./build');
        const requestHandler = createRequestHandler({ build, mode: 'development' });
        return requestHandler(request);
      },
};

export default bunServeOptions;
```

2. `tsconfig.json`

Make the following changes:

```diff
diff --git a/tsconfig.json b/tsconfig.json
index 20f8a38..92db692 100644
--- a/tsconfig.json
+++ b/tsconfig.json
@@ -1,13 +1,14 @@
 {
   "include": ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
   "compilerOptions": {
-    "lib": ["DOM", "DOM.Iterable", "ES2019"],
+    "lib": ["DOM", "DOM.Iterable", "ESNext"],
+    "module": "esnext",
+    "target": "esnext",
     "isolatedModules": true,
     "esModuleInterop": true,
     "jsx": "react-jsx",
     "moduleResolution": "node",
     "resolveJsonModule": true,
-    "target": "ES2019",
     "strict": true,
     "allowJs": true,
     "forceConsistentCasingInFileNames": true,
@@ -15,7 +16,6 @@
     "paths": {
       "~/*": ["./app/*"]
     },

     // Remix takes care of building everything in `remix build`.
     "noEmit": true
   }
```

3. `remix-env.d.ts`

Make the following changes:

```diff
diff --git a/remix.env.d.ts b/remix.env.d.ts
index dcf8c45..a2385a1 100644
--- a/remix.env.d.ts
+++ b/remix.env.d.ts
@@ -1,2 +1,4 @@
+/// <reference lib="DOM" />
+/// <reference lib="DOM.Iterable" />
+/// <reference types="bun-types" />
 /// <reference types="@remix-run/dev" />
-/// <reference types="@remix-run/node" />
```

4. `package.json`

Add the following scripts to your `package.json`:

```diff
diff --git a/package.json b/package.json
index fb04c8d..c1b8e17 100644
--- a/package.json
+++ b/package.json
@@ -2,8 +2,10 @@
   "private": true,
   "sideEffects": false,
   "scripts": {
+    "dev:remix": "bun run node_modules/@remix-run/dev/dist/cli.js watch",
+    "dev:server": "NODE_ENV=development bun --hot ./server.ts",
+    "dev": "run-p dev:*",
     "build": "remix build",
-    "dev": "remix dev",
-    "start": "remix-serve build",
+    "start": "NODE_ENV=production bun run ./server.ts",
     "typecheck": "tsc -b"
   },
```

5. `<root-folder>/app/entry.server.ts`

Check the content of your `<root-folder>/app/entry.server.ts`.

If you are using `renderToString`, you are fine but you can replace it as below if you want.

If you are using `renderToPipeableStream` then replace your `entry.server.ts` with the following:

````tsx
import type { EntryContext } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import isbot from "isbot";
import { renderToReadableStream } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return isbot(request.headers.get("user-agent"))
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        remixContext
      );
}

function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise(async (resolve, reject) => {
    const stream = await renderToReadableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onError(error) {
          console.error(error);
          reject(error);
        },
      }
    );

    resolve(
      new Response(stream, {
        status: responseStatusCode,
        headers: responseHeaders,
      })
    );
  });
}

function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  return new Promise(async (resolve, reject) => {
    const stream = await renderToReadableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onError(error) {
          console.error(error);
          reject(error);
        },
      }
    );

    resolve(
      new Response(stream, {
        status: responseStatusCode,
        headers: responseHeaders,
      })
    );
  });
}
``````

## Development

From your terminal:

```sh
bun run dev
```

This starts your app in development mode, rebuilding assets on file changes.

## Troubleshooting

#### `TypeError: undefined is not a function (near '...(0 , import_server.renderToPipeableStream)...')`

You need to adjust the `entry.server.ts` as suggested in "Setup project".

## Credits

Created by [@de_patwoz](https://twitter.com/de_patwoz)
