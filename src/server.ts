import type { ServerBuild, AppLoadContext } from "@remix-run/server-runtime";
import { createRequestHandler as createRemixRequestHandler } from "@remix-run/server-runtime";

export type GetLoadContextFunction = (request: Request) => AppLoadContext;
export type RequestHandler = (request: Request) => Promise<Response>;

export function createRemixHeaders(
  requestHeaders: Request["headers"]
): Headers {
  let headers = new Headers();

  for (let [key, values] of requestHeaders.entries()) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export const createRemixRequest = (request: Request): Request => {
  const url = request.url;

  const init: RequestInit = {
    method: request.method,
    headers: createRemixHeaders(request.headers),
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  const remixRequest = new Request(url, init);

  const controller = new AbortController();
  // remix needs this in @remix-run/server-runtime
  // will throw otherwise an error
  // @ts-expect-error
  remixRequest.signal = controller.signal;

  return remixRequest;
};

export const createRequestHandler = ({
  build,
  getLoadContext,
  mode,
}: {
  build: ServerBuild;
  getLoadContext?: GetLoadContextFunction;
  mode?: string;
}): RequestHandler => {
  const handleRequest = createRemixRequestHandler(build, mode);
  return async (request: Request): Promise<Response> => {
    const remixRequest = createRemixRequest(request);
    const loadContext = getLoadContext?.(request);
    const response = await handleRequest(remixRequest, loadContext);
    return response;
  };
};
