"use strict";
(() => {
  // inject.ts
  var IsObject = (value) => value !== null && typeof value === "object";
  var NormalizeId = (value) => {
    if (typeof value === "string" && /^\d+$/.test(value)) return value;
    if (typeof value === "number" && Number.isInteger(value)) return String(value);
    return null;
  };
  var FindJobIdInObject = (obj) => {
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
      const value = obj[key];
      if (key === "jobId" || key === "job_id" || key === "jobID") {
        const normalized = NormalizeId(value);
        if (normalized) return normalized;
      }
      if (key === "variables" && IsObject(value)) {
        const candidate = ("jobId" in value ? value.jobId : void 0) ?? ("id" in value ? value.id : void 0) ?? ("job_id" in value ? value.job_id : void 0) ?? ("jobID" in value ? value.jobID : void 0);
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
    const ParseJSON = (text) => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };
    const ExtractJobIdFromRequest = (args) => {
      try {
        const requestInit = args[1];
        const body = requestInit?.body;
        if (typeof body === "string") {
          const parsedBody = ParseJSON(body);
          if (parsedBody) {
            const candidate = FindJobIdInObject(parsedBody);
            if (candidate) return candidate;
          }
        }
        if (IsObject(body)) {
          const candidate = FindJobIdInObject(body);
          if (candidate) return candidate;
        }
        const firstArg = args[0];
        const url = typeof firstArg === "string" ? firstArg : IsObject(firstArg) && "url" in firstArg && typeof firstArg.url === "string" ? firstArg.url : void 0;
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
        if (IsObject(data) && ("data" in data || "errors" in data)) {
          let jobId = FindJobIdInObject("data" in data ? data.data : data);
          let source = "response";
          if (!jobId) {
            jobId = ExtractJobIdFromRequest(args);
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
