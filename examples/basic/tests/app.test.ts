import { expect, test } from 'bun:test';
import bun from 'bun';

const createServer = async () => {
  const bunServeOptions = (await import('../server')).default;
  const server = bun.serve(bunServeOptions);
  return server;
};

test('Should open index page', async () => {
  const server = await createServer();
  const req = new Request(`http://${server.hostname}:${server.port}/`);

  const res = await server.fetch(req);
  expect(res.status).toBe(200);

  const html = await res.text();
  expect(html).toContain('Welcome to Remix');
});

