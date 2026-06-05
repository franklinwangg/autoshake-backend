"use strict";
(() => {
  // scripts/popupUtils.ts
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

  // scripts/inject.ts
  var GRAPHQL_RESPONSE_MESSAGE = "AUTOSHAKE_GRAPHQL_RESPONSE";
  InitializeAutoShake();
  function InitializeAutoShake() {
    if (window.__AUTOSHAKE_INITIALIZED__) {
      console.log("[AutoShake] inject.js already running, skipping re-init");
      return;
    }
    window.__AUTOSHAKE_INITIALIZED__ = true;
    console.log("[AutoShake] inject.js initializing");
    SetupFetchInterceptor();
  }
  function SetupFetchInterceptor() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const clone = response.clone();
      void HandleClonedResponse(clone, args);
      return response;
    };
  }
  async function HandleClonedResponse(clone, args) {
    try {
      const data = await clone.json();
      if (!IsGraphqlResponsePayload(data)) {
        return;
      }
      let jobId = FindJobIdInObject("data" in data ? data.data : data);
      let source = "response";
      if (!jobId) {
        jobId = GetJobIdFromRequest(args);
        source = "request";
      }
      if (!jobId) {
        console.log("[AutoShake] GraphQL response has no detectable job ID, skipping");
        return;
      }
      const graphQLResponse = BuildGraphqlResponse(data, args);
      PostGraphqlResponse(jobId, graphQLResponse);
      console.log("[AutoShake] Intercepted GraphQL response for job ID:", jobId, "(source:", source, ")");
    } catch {
    }
  }
  function IsGraphqlResponsePayload(data) {
    return IsObject(data) && ("data" in data || "errors" in data);
  }
  function GetJobIdFromRequest(args) {
    try {
      const requestInit = args[1];
      const body = requestInit?.body;
      const jobIdFromBody = GetJobIdFromRequestBody(body);
      if (jobIdFromBody) {
        return jobIdFromBody;
      }
      const url = GetRequestUrl(args);
      if (!url) {
        return null;
      }
      const match = url.match(/jobId=(\d+)/) || url.match(/\/job-search\/(\d+)/);
      return match?.[1] ?? null;
    } catch (error) {
      console.warn("[AutoShake] Error extracting job ID from request", error);
      return null;
    }
  }
  function GetJobIdFromRequestBody(body) {
    if (typeof body === "string") {
      const parsedBody = ParseJSON(body);
      return parsedBody ? FindJobIdInObject(parsedBody) : null;
    }
    return IsObject(body) ? FindJobIdInObject(body) : null;
  }
  function ParseJSON(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
  function GetRequestUrl(args) {
    const firstArg = args[0];
    if (typeof firstArg === "string") {
      return firstArg;
    }
    if (typeof URL !== "undefined" && firstArg instanceof URL) {
      return firstArg.toString();
    }
    if (typeof Request !== "undefined" && firstArg instanceof Request) {
      return firstArg.url;
    }
    if (IsObject(firstArg) && "url" in firstArg && typeof firstArg.url === "string") {
      return firstArg.url;
    }
    return void 0;
  }
  function BuildGraphqlResponse(data, args) {
    return {
      url: GetRequestUrl(args) ?? String(args[0]),
      data: JSON.stringify(data),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  function PostGraphqlResponse(jobId, response) {
    window.postMessage(
      {
        type: GRAPHQL_RESPONSE_MESSAGE,
        jobId,
        response
      },
      "*"
    );
  }
})();
