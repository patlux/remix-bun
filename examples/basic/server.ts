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
