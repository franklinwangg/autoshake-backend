export const isObject = (value: any): value is Record<string, any> => value !== null && typeof value === "object";

export const normalizeId = (value: any): string | null => {
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return null;
};

export const findJobIdInObject = (obj: any): string | null => {
  if (!isObject(obj)) return null;

  if (obj.__typename === "Job" && obj.id) {
    return normalizeId(obj.id);
  }

  if (isObject(obj.job) && obj.job.id) {
    return normalizeId(obj.job.id);
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findJobIdInObject(item);
      if (found) return found;
    }
    return null;
  }

  for (const key of Object.keys(obj)) {
    const value: any = obj[key];

    if (key === "jobId" || key === "job_id" || key === "jobID") {
      const normalized = normalizeId(value);
      if (normalized) return normalized;
    }

    if (key === "variables" && isObject(value)) {
      const candidate = value.jobId || value.id || value.job_id || value.jobID;
      const normalized = normalizeId(candidate);
      if (normalized) return normalized;
    }

    if (isObject(value) || Array.isArray(value)) {
      const found = findJobIdInObject(value);
      if (found) return found;
    }
  }

  return null;
};

declare global {
  interface Window {
    __AUTOSHAKE_INITIALIZED__?: boolean;
    __AUTOSHAKE_GRAPHQL_RESPONSES__: any[];
    __AUTOSHAKE_CLICKED_JOBS__: any[];
  }
}

(() => {
  // Guard: don't re-initialize if already injected
  if (window.__AUTOSHAKE_INITIALIZED__) {
    console.log("[AutoShake] inject.js already running, skipping re-init");
    return;
  }
  window.__AUTOSHAKE_INITIALIZED__ = true;

  console.log("[AutoShake] inject.js initializing");

  window.__AUTOSHAKE_GRAPHQL_RESPONSES__ = [];
  window.__AUTOSHAKE_CLICKED_JOBS__ = [];

  const origFetch: typeof window.fetch = window.fetch;

  const parseJSON = (text: string): any | null => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const extractJobIdFromRequest = (args: IArguments | unknown[]): string | null => {
    try {
      const requestInit: any = (args as any)[1] || {};
      const body: any = requestInit.body;

      if (typeof body === "string") {
        const parsedBody = parseJSON(body);
        if (parsedBody) {
          const candidate = findJobIdInObject(parsedBody);
          if (candidate) return candidate;
        }
      }

      if (isObject(body)) {
        const candidate = findJobIdInObject(body);
        if (candidate) return candidate;
      }

      const url: string | undefined = typeof (args as any)[0] === "string" ? (args as any)[0] : (args as any)[0]?.url;
      if (typeof url === "string") {
        const match = url.match(/jobId=(\d+)/) || url.match(/\/job-search\/(\d+)/);
        if (match) return match[1];
      }
    } catch (error) {
      console.warn("[AutoShake] Error extracting job ID from request", error);
    }

    return null;
  };

  window.fetch = async (...args: Parameters<typeof window.fetch>): Promise<Response> => {
    const res: Response = await origFetch(...args);
    const clone: Response = res.clone();

    clone.json().then((data: any) => {
      if (data?.data || data?.errors) {
        let jobId: string | null = findJobIdInObject(data?.data || data);
        let source: string = "response";

        if (!jobId) {
          jobId = extractJobIdFromRequest(args);
          source = "request";
        }

        if (jobId) {
          const graphqlResponse: { url: any; data: string; timestamp: string } = {
            url: (args as any)[0],
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

  window.addEventListener("message", (event: MessageEvent<any>) => {
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