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

  // popupUtils.ts
  var MS_PER_MINUTE = 6e4;
  var MINUTES_PER_HOUR = 60;
  var HOURS_PER_DAY = 24;
  function GetRelativeTime(isoString) {
    const now = /* @__PURE__ */ new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / MS_PER_MINUTE);
    const diffHours = Math.floor(diffMins / MINUTES_PER_HOUR);
    const diffDays = Math.floor(diffHours / HOURS_PER_DAY);
    if (diffMins < 1) {
      return "just now";
    }
    if (diffMins < MINUTES_PER_HOUR) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    }
    if (diffHours < HOURS_PER_DAY) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
  function GetFieldFromObject(obj, path) {
    let current = obj;
    for (const segment of path) {
      if (!current || typeof current !== "object") return null;
      current = current[segment];
    }
    return current ?? null;
  }
  function ExtractJobField(responses, path) {
    if (!Array.isArray(responses)) return null;
    for (const response of responses) {
      if (!response || typeof response.data !== "string") continue;
      try {
        const parsed = JSON.parse(response.data);
        if (IsObject(parsed) && "data" in parsed) {
          const candidate = GetFieldFromObject(parsed.data, path);
          if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate;
          }
          if (IsObject(parsed.data)) {
            for (const value of Object.values(parsed.data)) {
              const nested = GetFieldFromObject(value, path);
              if (typeof nested === "string" && nested.trim().length > 0) {
                return nested;
              }
            }
          }
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  // popup.ts
  var toggle = null;
  var stateText = null;
  var jobList = null;
  var graphqlToggleButton = null;
  var graphqlStats = null;
  var submitButton = null;
  function InitializePopupDOMElements() {
    toggle = document.getElementById("stateToggle");
    stateText = document.getElementById("trackingLabel");
    jobList = document.getElementById("jobList");
    if (true) {
      graphqlToggleButton = document.getElementById("toggleGraphQL");
      graphqlStats = document.getElementById("graphqlStats");
    }
    submitButton = document.getElementById("submitButton");
  }
  function DisplayGraphQLResponses() {
    const container = document.getElementById("graphqlResponses");
    if (!container) return;
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const responses = Object.values(jobData).flatMap((job) => Array.isArray(job.graphqlResponses) ? job.graphqlResponses : []);
      if (responses.length === 0) {
        container.innerHTML = "<p style='color:#999'>No responses yet</p>";
        return;
      }
      container.innerHTML = "";
      responses.slice().reverse().forEach((r, i) => {
        const parsed = JSON.parse(r.data);
        const parsedData = IsObject(parsed) ? parsed : null;
        const inner = parsedData && "data" in parsedData && IsObject(parsedData.data) ? parsedData.data : null;
        const operationName = inner ? Object.keys(inner).join(", ") || "unknown" : parsedData ? Object.keys(parsedData)[0] ?? "unknown" : "unknown";
        const item = document.createElement("div");
        item.className = "graphql-item";
        item.innerHTML = `
        <div class="graphql-header" data-index="${i}">
          <span class="graphql-op">${operationName}</span>
          <span class="graphql-time">${GetRelativeTime(r.timestamp)}</span>
          <span class="graphql-toggle">\u25B6</span>
        </div>
        <pre class="graphql-body" id="body-${i}" style="display:none">${JSON.stringify(parsed, null, 2)}</pre>
      `;
        const headerElement = item.querySelector(".graphql-header");
        headerElement?.addEventListener("click", () => {
          const body = document.getElementById(`body-${i}`);
          const toggleIcon = item.querySelector(".graphql-toggle");
          const isHidden = body?.style.display === "none";
          if (body) body.style.display = isHidden ? "block" : "none";
          if (toggleIcon) toggleIcon.textContent = isHidden ? "\u25BC" : "\u25B6";
        });
        container.appendChild(item);
      });
    });
  }
  function DeleteJob(jobId) {
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      delete jobData[jobId];
      chrome.storage.local.set({ jobData }, () => {
        DisplayJobs();
      });
    });
  }
  function SubmitJobList() {
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length === 0) {
        alert("No jobs to submit!");
        return;
      }
      const payload = {
        jobs,
        submittedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Submitting job list:", payload);
      jobs.forEach((job) => {
        if (jobData[job.jobId]) {
          jobData[job.jobId].clicked = false;
        }
      });
      chrome.storage.local.set({ jobData }, () => {
        DisplayJobs();
        alert("Job list submitted!");
      });
    });
  }
  function UpdateToggleLabel(isOn) {
    if (stateText) {
      stateText.textContent = `Job Tracking: ${isOn ? "Enabled" : "Disabled"}
`;
    }
  }
  function UpdateSubmitButtonState() {
    if (!submitButton) return;
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length > 0) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Job List";
        submitButton.style.backgroundColor = "#4CAF50";
        submitButton.style.color = "white";
        submitButton.style.cursor = "pointer";
      } else {
        submitButton.disabled = true;
        submitButton.textContent = "Need jobs to submit";
        submitButton.style.backgroundColor = "#cccccc";
        submitButton.style.color = "#666";
        submitButton.style.cursor = "not-allowed";
      }
    });
  }
  function DisplayJobs() {
    if (!jobList) return;
    const listEl = jobList;
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length === 0) {
        listEl.innerHTML = "<p style='color: #999;'>No jobs in your list. Click a handshake job to add one!</p>";
        UpdateSubmitButtonState();
        return;
      }
      listEl.innerHTML = `<h2>Job List (${jobs.length})</h2>`;
      const container = document.createElement("div");
      container.className = "jobs-container";
      for (const job of jobs) {
        const jobItem = document.createElement("div");
        jobItem.className = "job-item";
        const jobTitle = ExtractJobField(job.graphqlResponses || [], ["job", "title"]) || "Unknown Job";
        const jobEmployer = ExtractJobField(job.graphqlResponses || [], ["job", "employer", "name"]);
        const relativeTime = job.clickTimestamp ? GetRelativeTime(job.clickTimestamp) : "unknown time";
        jobItem.innerHTML = `
				<div class="job-title">${jobTitle}</div>
				${jobEmployer ? `<div class="job-employer">${jobEmployer}</div>` : ""}
				<div class="job-meta">${relativeTime}</div>
				<button class="delete-button" data-job-id="${job.jobId}">\xD7</button>
			`;
        jobItem.addEventListener("click", (e) => {
          if (e.target.classList.contains("delete-button")) return;
          let fullUrl = job.href ?? "";
          if (!fullUrl.startsWith("http")) {
            fullUrl = "https://app.joinhandshake.com" + (fullUrl.startsWith("/") ? "" : "/") + fullUrl;
          }
          chrome.tabs.create({ url: fullUrl });
        });
        const deleteButton = jobItem.querySelector(".delete-button");
        deleteButton?.addEventListener("click", (e) => {
          e.stopPropagation();
          DeleteJob(job.jobId);
        });
        container.appendChild(jobItem);
      }
      ;
      listEl.appendChild(container);
      UpdateSubmitButtonState();
    });
  }
  if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof globalThis.vi === "undefined") {
    if (false) {
      const graphqlHeader = document.querySelector("div[style*='display:flex']");
      const graphqlContainer = document.getElementById("graphqlResponses");
      if (graphqlHeader) graphqlHeader.style.display = "none";
      if (graphqlContainer) graphqlContainer.style.display = "none";
    }
    InitializePopupDOMElements();
    if (toggle && stateText && jobList) {
      const toggleEl = toggle;
      const graphqlBtn = graphqlToggleButton;
      chrome.storage.local.get(["trackingEnabled"], (result) => {
        const enabled = result.trackingEnabled !== false;
        toggleEl.checked = enabled;
        UpdateToggleLabel(enabled);
        toggleEl.addEventListener("change", () => {
          const isOn = toggleEl.checked;
          chrome.storage.local.set({ trackingEnabled: isOn }, () => {
            UpdateToggleLabel(isOn);
          });
        });
      });
      DisplayJobs();
      if (true) {
        DisplayGraphQLResponses();
      }
      UpdateSubmitButtonState();
      if (true) {
        graphqlBtn.addEventListener("click", () => {
          const container = document.getElementById("graphqlResponses");
          if (!container) return;
          const isHidden = container.style.display === "none";
          container.style.display = isHidden ? "block" : "none";
          graphqlBtn.textContent = isHidden ? "Hide" : "Show";
        });
      }
      submitButton?.addEventListener("click", SubmitJobList);
    }
  }
})();
