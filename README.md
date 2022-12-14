# remix-bun

[Bun](https://github.com/oven-sh/bun) [server adapter](https://remix.run/docs/en/v1/other-api/adapter) for [remix](https://github.com/remix-run)

## Installation

```sh
$ bun add remix-bun
# See "Usage" for further instructions
```

## Usage

```ts
// server.ts

import type { ServeOptions } from 'bun'
import { createRequestHandler } from 'remix-bun'

setInterval(() => Bun.gc(true), 9000)

const serveOptions: ServeOptions = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  fetch:
    process.env.NODE_ENV === 'production'
      ? createRequestHandler({
          build: require('./build'),
          mode: process.env.NODE_ENV,
        })
      : async (request: Request) => {
          const build = require('./build')
          const requestHandler = createRequestHandler({ build, mode: 'development' })
          return requestHandler(request)
        },
}

// bun will use this with bun.serve(serveOptions)
export default serveOptions
```

Start the server

```sh
$ bun run server.ts
```

## 🦸‍♂️⤵️

Created with 🔥 by [@de_patwoz](https://twitter.com/de_patwoz)
