"use strict";
(() => {
  // inject.ts
  var isObject = (value) => value !== null && typeof value === "object";
  var normalizeId = (value) => {
    if (typeof value === "string" && /^\d+$/.test(value)) return value;
    if (typeof value === "number" && Number.isInteger(value)) return String(value);
    return null;
  };
  var findJobIdInObject = (obj) => {
    if (!isObject(obj)) return null;
    if ("__typename" in obj && obj.__typename === "Job" && "id" in obj) {
      return normalizeId(obj.id);
    }
    if (isObject(obj.job) && "id" in obj.job) {
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
      const value = obj[key];
      if (key === "jobId" || key === "job_id" || key === "jobID") {
        const normalized = normalizeId(value);
        if (normalized) return normalized;
      }
      if (key === "variables" && isObject(value)) {
        const candidate = ("jobId" in value ? value.jobId : void 0) ?? ("id" in value ? value.id : void 0) ?? ("job_id" in value ? value.job_id : void 0) ?? ("jobID" in value ? value.jobID : void 0);
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
  (() => {
    if (window.__AUTOSHAKE_INITIALIZED__) {
      console.log("[AutoShake] inject.js already running, skipping re-init");
      return;
    }
    window.__AUTOSHAKE_INITIALIZED__ = true;
    console.log("[AutoShake] inject.js initializing");
    window.__AUTOSHAKE_GRAPHQL_RESPONSES__ = [];
    window.__AUTOSHAKE_CLICKED_JOBS__ = [];
    const origFetch = window.fetch;
    const parseJSON = (text) => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };
    const extractJobIdFromRequest = (args) => {
      try {
        const requestInit = args[1];
        const body = requestInit?.body;
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
        const firstArg = args[0];
        const url = typeof firstArg === "string" ? firstArg : isObject(firstArg) && "url" in firstArg && typeof firstArg.url === "string" ? firstArg.url : void 0;
        if (url) {
          const match = url.match(/jobId=(\d+)/) || url.match(/\/job-search\/(\d+)/);
          if (match) return match[1] ?? null;
        }
      } catch (error) {
        console.warn("[AutoShake] Error extracting job ID from request", error);
      }
      return null;
    };
    window.fetch = async (...args) => {
      const res = await origFetch(...args);
      const clone = res.clone();
      clone.json().then((data) => {
        if (isObject(data) && ("data" in data || "errors" in data)) {
          let jobId = findJobIdInObject("data" in data ? data.data : data);
          let source = "response";
          if (!jobId) {
            jobId = extractJobIdFromRequest(args);
            source = "request";
          }
          if (jobId) {
            const graphqlResponse = {
              url: String(args[0]),
              data: JSON.stringify(data),
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            };
            window.postMessage({
              type: "AUTOSHAKE_GRAPHQL_RESPONSE",
              jobId,
              response: graphqlResponse
            }, "*");
            console.log("[AutoShake] Intercepted GraphQL response for job ID:", jobId, "(source:", source, ")");
          } else {
            console.log("[AutoShake] GraphQL response has no detectable job ID, skipping");
          }
        }
      }).catch(() => {
      });
      return res;
    };
    window.addEventListener("message", (event) => {
      if (event.source !== window) return;
      if (event.data.type === "AUTOSHAKE_GET_DATA") {
        window.postMessage({
          type: "AUTOSHAKE_DATA_RESPONSE",
          graphqlResponses: window.__AUTOSHAKE_GRAPHQL_RESPONSES__,
          clickedJobs: window.__AUTOSHAKE_CLICKED_JOBS__
        }, "*");
      }
    });
  })();
})();
