# remix-bun

Bun server adapter for remix

## Installation

```sh
$ bun add remix-bun
```

## Usage

```ts
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
