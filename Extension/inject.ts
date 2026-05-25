import type { GraphqlResponse } from './types';

type UnknownRecord = Record<string, unknown>;

export const IsObject = (value: unknown): value is UnknownRecord => value !== null && typeof value === "object";

export const NormalizeId = (value: unknown): string | null => {
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return null;
};

export const FindJobIdInObject = (obj: unknown): string | null => {
  if (!IsObject(obj)) return null;

  if ("__typename" in obj && obj.__typename === "Job" && "id" in obj) {
    return NormalizeId(obj.id);
  }

  if (IsObject(obj.job) && "id" in obj.job) {
    return NormalizeId(obj.job.id);
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = FindJobIdInObject(item);
      if (found) return found;
    }
    return null;
  }

  for (const key of Object.keys(obj)) {
    const value: unknown = obj[key];

    if (key === "jobId" || key === "job_id" || key === "jobID") {
      const normalized = NormalizeId(value);
      if (normalized) return normalized;
    }

    if (key === "variables" && IsObject(value)) {
      const candidate: unknown = ("jobId" in value ? value.jobId : undefined)
        ?? ("id" in value ? value.id : undefined)
        ?? ("job_id" in value ? value.job_id : undefined)
        ?? ("jobID" in value ? value.jobID : undefined);
      const normalized = NormalizeId(candidate);
      if (normalized) return normalized;
    }

    if (IsObject(value) || Array.isArray(value)) {
      const found = FindJobIdInObject(value);
      if (found) return found;
    }
  }

  return null;
};

declare global {
  interface Window {
    __AUTOSHAKE_INITIALIZED__: boolean;
    __AUTOSHAKE_GRAPHQL_RESPONSES__: unknown[];
    __AUTOSHAKE_CLICKED_JOBS__: unknown[];
  }
}

(() => {
  if (window.__AUTOSHAKE_INITIALIZED__) {
    console.log("[AutoShake] inject.js already running, skipping re-init");
    return;
  }
  window.__AUTOSHAKE_INITIALIZED__ = true;

  console.log("[AutoShake] inject.js initializing");

  window.__AUTOSHAKE_GRAPHQL_RESPONSES__ = [];
  window.__AUTOSHAKE_CLICKED_JOBS__ = [];

  const origFetch: typeof window.fetch = window.fetch;

  const ParseJSON = (text: string): unknown => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const ExtractJobIdFromRequest = (args: IArguments | unknown[]): string | null => {
    try {
      const requestInit: Record<string, unknown> | undefined = (args as unknown[])[1] as Record<string, unknown> | undefined;
      const body: unknown = requestInit?.body;

      if (typeof body === "string") {
        const parsedBody: unknown = ParseJSON(body);
        if (parsedBody) {
          const candidate = FindJobIdInObject(parsedBody);
          if (candidate) return candidate;
        }
      }

      if (IsObject(body)) {
        const candidate = FindJobIdInObject(body);
        if (candidate) return candidate;
      }

      const firstArg: unknown = (args as unknown[])[0];
      const url: string | undefined = typeof firstArg === "string"
        ? firstArg
        : IsObject(firstArg) && "url" in firstArg && typeof firstArg.url === "string"
          ? firstArg.url
          : undefined;
      if (url) {
        const match = url.match(/jobId=(\d+)/) || url.match(/\/job-search\/(\d+)/);
        if (match) return match[1] ?? null;
      }
    } catch (error: unknown) {
      console.warn("[AutoShake] Error extracting job ID from request", error);
    }

    return null;
  };

  window.fetch = async (...args: Parameters<typeof window.fetch>): Promise<Response> => {
    const res: Response = await origFetch(...args);
    const clone: Response = res.clone();

    clone.json().then((data: unknown): void => {
      if (IsObject(data) && ("data" in data || "errors" in data)) {
        let jobId: string | null = FindJobIdInObject("data" in data ? data.data : data);
        let source: string = "response";

        if (!jobId) {
          jobId = ExtractJobIdFromRequest(args);
          source = "request";
        }

        if (jobId) {
          const graphqlResponse: GraphqlResponse = {
            url: String((args as unknown[])[0]),
            data: JSON.stringify(data),
            timestamp: new Date().toISOString(),
          };

          window.postMessage({
            type: "AUTOSHAKE_GRAPHQL_RESPONSE",
            jobId: jobId,
            response: graphqlResponse,
          }, "*");

          console.log("[AutoShake] Intercepted GraphQL response for job ID:", jobId, "(source:", source, ")");
        } else {
          console.log("[AutoShake] GraphQL response has no detectable job ID, skipping");
        }
      }
    }).catch(() => {});

    return res;
  };

  window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.data.type === "AUTOSHAKE_GET_DATA") {
      window.postMessage({
        type: "AUTOSHAKE_DATA_RESPONSE",
        graphqlResponses: window.__AUTOSHAKE_GRAPHQL_RESPONSES__,
        clickedJobs: window.__AUTOSHAKE_CLICKED_JOBS__,
      }, "*");
    }
  });
})();
