"use strict";
(() => {
  // popupUtils.ts
  function GetRelativeTime(isoString) {
    const now = /* @__PURE__ */ new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) {
      return "just now";
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
  function getFieldFromObject(obj, path) {
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
        if (isObject(parsed) && "data" in parsed) {
          const candidate = getFieldFromObject(parsed.data, path);
          if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate;
          }
          if (isObject(parsed.data)) {
            for (const value of Object.values(parsed.data)) {
              const nested = getFieldFromObject(value, path);
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
  var isObject = (value) => value !== null && typeof value === "object";

  // popup.ts
  var toggle = null;
  var stateText = null;
  var jobList = null;
  var graphqlToggleButton = null;
  var graphqlStats = null;
  function initializePopupDOMElements() {
    toggle = document.getElementById("stateToggle");
    stateText = document.getElementById("trackingLabel");
    jobList = document.getElementById("jobList");
    graphqlToggleButton = document.getElementById("toggleGraphQL");
    graphqlStats = document.getElementById("graphqlStats");
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
        const parsedData = isObject2(parsed) ? parsed : null;
        const inner = parsedData && "data" in parsedData && isObject2(parsedData.data) ? parsedData.data : null;
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
  var isObject2 = (value) => value !== null && typeof value === "object";
  function DeleteJob(jobId) {
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      delete jobData[jobId];
      chrome.storage.local.set({ jobData }, () => {
        DisplayJobs();
      });
    });
  }
  function UpdateToggleLabel(isOn) {
    if (stateText) {
      stateText.textContent = `Job Tracking: ${isOn ? "Enabled" : "Disabled"}
`;
    }
  }
  function DisplayJobs() {
    if (!jobList) return;
    const listEl = jobList;
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length === 0) {
        listEl.innerHTML = "<p style='color: #999;'>No jobs in your list. Click a handshake job to add one!</p>";
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
    });
  }
  if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof globalThis.vi === "undefined") {
    initializePopupDOMElements();
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
      DisplayGraphQLResponses();
      graphqlBtn.addEventListener("click", () => {
        const container = document.getElementById("graphqlResponses");
        if (!container) return;
        const isHidden = container.style.display === "none";
        container.style.display = isHidden ? "block" : "none";
        graphqlBtn.textContent = isHidden ? "Hide" : "Show";
      });
    }
  }
})();
