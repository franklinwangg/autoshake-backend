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
      if (!IsGraphQLResponsePayload(data)) {
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
  function IsGraphQLResponsePayload(data) {
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

  // scripts/popup.ts
  var toggle = null;
  var stateText = null;
  var jobList = null;
  var graphqlToggleButton = null;
  var submitButton = null;
  var loginView = null;
  var mainView = null;
  var createAccountView = null;
  function ShowLoginView() {
    if (loginView) loginView.classList.add("active");
    if (loginView) loginView.classList.remove("hidden");
    if (mainView) mainView.classList.add("hidden");
    if (mainView) mainView.classList.remove("active");
    if (createAccountView) createAccountView.classList.add("hidden");
    if (createAccountView) createAccountView.classList.remove("active");
  }
  function ShowCreateAccountView() {
    if (loginView) loginView.classList.add("hidden");
    if (loginView) loginView.classList.remove("active");
    if (createAccountView) createAccountView.classList.add("active");
    if (createAccountView) createAccountView.classList.remove("hidden");
    if (mainView) mainView.classList.add("hidden");
    if (mainView) mainView.classList.remove("active");
    const createUsernameInput = document.getElementById("createUsernameInput");
    const createPasswordInput = document.getElementById("createPasswordInput");
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    const createAccountError = document.getElementById("createAccountError");
    if (createUsernameInput) createUsernameInput.value = "";
    if (createPasswordInput) createPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
    if (createAccountError) createAccountError.textContent = "";
  }
  function ShowMainView() {
    if (loginView) loginView.classList.add("hidden");
    if (loginView) loginView.classList.remove("active");
    if (mainView) mainView.classList.add("active");
    if (mainView) mainView.classList.remove("hidden");
    if (createAccountView) createAccountView.classList.add("hidden");
    if (createAccountView) createAccountView.classList.remove("active");
    chrome.storage.local.get(["username"], (result) => {
      const usernameDisplay = document.getElementById("usernameDisplay");
      if (usernameDisplay && result.username) {
        usernameDisplay.textContent = `Logged in as: ${result.username}`;
      }
    });
    InitializePopupDOMElements();
    InitializePopup();
  }
  function HandleLogin() {
    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const loginError = document.getElementById("loginError");
    const username = usernameInput?.value.trim() ?? "";
    const password = passwordInput?.value ?? "";
    if (loginError) loginError.textContent = "";
    if (!username || !password) {
      if (loginError) loginError.textContent = "Please enter a username and password.";
      return;
    }
    chrome.storage.local.set({ username }, () => {
      if (usernameInput) usernameInput.value = "";
      if (passwordInput) passwordInput.value = "";
      ShowMainView();
    });
  }
  function HandleCreateAccount() {
    const createUsernameInput = document.getElementById("createUsernameInput");
    const createPasswordInput = document.getElementById("createPasswordInput");
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    const createAccountError = document.getElementById("createAccountError");
    const username = createUsernameInput?.value.trim() ?? "";
    const password = createPasswordInput?.value ?? "";
    const confirmPassword = confirmPasswordInput?.value ?? "";
    if (createAccountError) createAccountError.textContent = "";
    if (!username || !password || !confirmPassword) {
      if (createAccountError) createAccountError.textContent = "Please fill in all fields.";
      return;
    }
    if (password !== confirmPassword) {
      if (createAccountError) createAccountError.textContent = "Passwords do not match.";
      return;
    }
    if (createUsernameInput) createUsernameInput.value = "";
    if (createPasswordInput) createPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
    ShowLoginView();
  }
  function HandleLogout() {
    chrome.storage.local.set({ username: "" }, () => {
      ShowLoginView();
    });
  }
  function InitializePopupDOMElements() {
    toggle = document.getElementById("stateToggle");
    stateText = document.getElementById("trackingLabel");
    jobList = document.getElementById("jobList");
    if (false) {
      graphqlToggleButton = document.getElementById("toggleGraphQL");
    }
    submitButton = document.getElementById("submitButton");
  }
  function DeleteJob(jobId) {
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      if (jobData[jobId]) {
        jobData[jobId].clicked = false;
      }
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
      } else {
        submitButton.disabled = true;
        submitButton.textContent = "Need jobs to submit";
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
        listEl.innerHTML = "<p class='no-data-text'>No jobs in your list. Click a handshake job to add one!</p>";
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
        deleteButton?.addEventListener("click", (event) => {
          event.stopPropagation();
          DeleteJob(job.jobId);
        });
        container.appendChild(jobItem);
      }
      ;
      listEl.appendChild(container);
      UpdateSubmitButtonState();
    });
  }
  function InitializePopup() {
    if (!toggle || !stateText || !jobList) return;
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
    if (false) {
      DisplayGraphQLResponses();
    }
    UpdateSubmitButtonState();
    chrome.storage.local.get(null, (items) => {
      const storageSize = JSON.stringify(items).length;
      const storageSizeMB = (storageSize / (1024 * 1024)).toFixed(2);
      console.log(`Chrome Storage Size: ${storageSizeMB} MB (${storageSize} bytes)`);
    });
    if (false) {
      graphqlBtn.addEventListener("click", () => {
        const container = document.getElementById("graphqlResponses");
        if (!container) return;
        const isHidden = container.classList.contains("hidden");
        container.classList.toggle("hidden", !isHidden);
        graphqlBtn.textContent = isHidden ? "Hide" : "Show";
      });
    }
    submitButton?.addEventListener("click", SubmitJobList);
  }
  if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof globalThis.vi === "undefined") {
    loginView = document.getElementById("loginView");
    mainView = document.getElementById("mainView");
    createAccountView = document.getElementById("createAccountView");
    if (true) {
      const graphqlHeader = document.querySelector(".graphql-section-header");
      const graphqlContainer = document.getElementById("graphqlResponses");
      if (graphqlHeader) graphqlHeader.classList.add("hidden");
      if (graphqlContainer) graphqlContainer.classList.add("hidden");
    }
    const loginButton = document.getElementById("loginButton");
    loginButton?.addEventListener("click", HandleLogin);
    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", HandleLogout);
    const createAccountLink = document.getElementById("createAccountLink");
    createAccountLink?.addEventListener("click", ShowCreateAccountView);
    const createAccountButton = document.getElementById("createAccountButton");
    createAccountButton?.addEventListener("click", HandleCreateAccount);
    const backToLoginLink = document.getElementById("backToLoginLink");
    backToLoginLink?.addEventListener("click", ShowLoginView);
    const passwordInput = document.getElementById("passwordInput");
    passwordInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") HandleLogin();
    });
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    confirmPasswordInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") HandleCreateAccount();
    });
    chrome.storage.local.get(["username"], (result) => {
      if (result.username) {
        ShowMainView();
      } else {
        ShowLoginView();
      }
    });
  }
})();
