import { file, write } from 'bun'
import { expect, test } from 'bun:test'
import { execa } from 'execa'
import { join } from 'path'
import { useTempDir } from '../../utils/useTempDir'
import { projectFilesShouldExists } from '../../utils/projectFilesShouldExists'

const createRun = (cwd: string) => (file: string, args: string[]) => {
  return execa(file, args, { cwd })
}

test('Should create a remix project', async () => {
  await useTempDir(async (cwd) => {
    const result = await execa('bun', ['x', 'create-remix@latest', cwd, '--no-install', '--typescript', '--template', 'remix'])
    expect(result.exitCode).toBe(0)

    const run = createRun(cwd)

    await run('bun', ['add', 'remix-bun'])
    await run('bun', ['add', '-d', 'bun-types', 'npm-run-all'])

    await run('npm', ['set-script', 'dev:remix', 'bun run node_modules/@remix-run/dev/dist/cli.js watch'])
    await run('npm', ['set-script', 'dev:server', 'NODE_ENV=development bun --hot ./server.ts'])
    await run('npm', ['set-script', 'dev', 'run-p dev:*'])
    await run('npm', ['set-script', 'start', 'NODE_ENV=production bun run ./server.ts'])
    await run('npm', ['set-script', 'check-types', 'tsc --noEmit'])

    const packageJSONRaw = await file(`${cwd}/package.json`, { type: 'application/json;charset=utf-8' }).text()
    const packageJSON = JSON.parse(packageJSONRaw)

    expect(packageJSON.scripts.dev).toBe('run-p dev:*')

    await setupFileServerTs(cwd)
    await setupFileRemixEnvDTs(cwd)
    await setupFileTsConfigJson(cwd)
    await setupFileEntryServer(cwd)

    const runBuildResult = await run('bun', ['run', 'build'])
    expect(runBuildResult.exitCode).toBe(0)

    projectFilesShouldExists({
      cwd,
      files: [
        'server.ts',
        'remix.env.d.ts',
        'tsconfig.json'
      ]
    })
  })
})

const setupFileServerTs = async (cwd: string) => {
  await write(join(cwd, 'server.ts'), `
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
    `)
}

const setupFileRemixEnvDTs = async (cwd: string) => {
  await write(join(cwd, 'remix.env.d.ts'), `
      /// <reference lib="DOM" />
      /// <reference lib="DOM.Iterable" />
      /// <reference types="bun-types" />
      /// <reference types="@remix-run/dev" />
    `)
}

const setupFileTsConfigJson = async (cwd: string) => {
  await write(join(cwd, 'tsconfig.json'), `
{
  "include": ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "esnext",
    "target": "esnext",
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "strict": true,
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["./app/*"]
    },
    // Remix takes care of building everything in \`remix build\`.
    "noEmit": true
  }
}
`)

}

const setupFileEntryServer = async (cwd: string) => {
  await write(join(cwd, 'app/entry.server.tsx'), `
import type { EntryContext } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToReadableStream } from "react-dom/server";

export default function handleRequest(
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
`)
}
