"use strict";
(() => {
  // scripts/popupAuth.ts
  function SetupAuth(callbacks) {
    const { showMainView, showLoginView, showAuthView } = callbacks;
    const loginButton = document.getElementById("loginButton");
    loginButton?.addEventListener("click", HandleLogin);
    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", HandleLogout);
    const createAccountButton = document.getElementById("createAccountButton");
    createAccountButton?.addEventListener("click", HandleCreateAccount);
    const passwordInput = document.getElementById("passwordInput");
    passwordInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") HandleLogin();
    });
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    confirmPasswordInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") HandleCreateAccount();
    });
    function HandleLogin() {
      const usernameInput = document.getElementById("usernameInput");
      const passwordInput2 = document.getElementById("passwordInput");
      const loginError = document.getElementById("loginError");
      const username = usernameInput?.value.trim() ?? "";
      const password = passwordInput2?.value ?? "";
      if (loginError) loginError.textContent = "";
      if (!username || !password) {
        if (loginError) loginError.textContent = "Please enter a username and password.";
        return;
      }
      chrome.storage.local.set({ username }, () => {
        if (usernameInput) usernameInput.value = "";
        if (passwordInput2) passwordInput2.value = "";
        showMainView();
      });
    }
    function HandleCreateAccount() {
      const createUsernameInput = document.getElementById("createUsernameInput");
      const createPasswordInput = document.getElementById("createPasswordInput");
      const confirmPasswordInput2 = document.getElementById("confirmPasswordInput");
      const createAccountError = document.getElementById("createAccountError");
      const username = createUsernameInput?.value.trim() ?? "";
      const password = createPasswordInput?.value ?? "";
      const confirmPassword = confirmPasswordInput2?.value ?? "";
      if (createAccountError) createAccountError.textContent = "";
      if (!username || !password || !confirmPassword) {
        if (createAccountError) createAccountError.textContent = "Please fill in all fields.";
        return;
      }
      if (password !== confirmPassword) {
        if (createAccountError) createAccountError.textContent = "Passwords do not match.";
        return;
      }
      ResetCreateAccountView();
      showLoginView();
    }
    function HandleLogout() {
      chrome.storage.local.set({ username: "" }, () => {
        showAuthView();
      });
    }
  }
  function ResetCreateAccountView() {
    const createUsernameInput = document.getElementById("createUsernameInput");
    const createPasswordInput = document.getElementById("createPasswordInput");
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    const createAccountError = document.getElementById("createAccountError");
    if (createUsernameInput) createUsernameInput.value = "";
    if (createPasswordInput) createPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
    if (createAccountError) createAccountError.textContent = "";
  }

  // scripts/popupUtils.ts
  var IsObject = (value) => value !== null && typeof value === "object";
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

  // scripts/popupMain.ts
  var toggle = null;
  var stateText = null;
  var jobList = null;
  var submitButton = null;
  function SetupMainPopup() {
    toggle = document.getElementById("stateToggle");
    stateText = document.getElementById("trackingLabel");
    jobList = document.getElementById("jobList");
    if (false) {
      graphqlToggleButton = document.getElementById("toggleGraphQL");
    }
    submitButton = document.getElementById("submitButton");
    AttachMainPopupListeners();
  }
  function AttachMainPopupListeners() {
    if (toggle) {
      toggle.addEventListener("change", () => {
        const isOn = toggle.checked;
        chrome.storage.local.set({ trackingEnabled: isOn }, () => {
          UpdateToggleLabel(isOn);
        });
      });
    }
    if (false) {
      graphqlToggleButton.addEventListener("click", () => {
        const container = document.getElementById("graphqlResponses");
        if (!container) return;
        const isHidden = container.classList.contains("hidden");
        container.classList.toggle("hidden", !isHidden);
        graphqlToggleButton.textContent = isHidden ? "Hide" : "Show";
      });
    }
    submitButton?.addEventListener("click", SubmitJobList);
  }
  function ResetMainPopup() {
    DisplayUsername();
    RefreshMainView();
  }
  function DisplayUsername() {
    chrome.storage.local.get(["username"], (result) => {
      const usernameDisplay = document.getElementById("usernameDisplay");
      if (usernameDisplay && result.username) {
        usernameDisplay.innerHTML = `<span class="label">Logged in as</span>${result.username}`;
      }
    });
  }
  function RefreshMainView() {
    chrome.storage.local.get(["trackingEnabled"], (result) => {
      const isOn = result.trackingEnabled !== false;
      if (toggle) toggle.checked = isOn;
      UpdateToggleLabel(isOn);
    });
    DisplayJobs();
    if (false) {
      DisplayGraphQLResponses();
    }
    UpdateSubmitButtonState();
    LogStorageSize();
  }
  function LogStorageSize() {
    chrome.storage.local.get(null, (items) => {
      const storageSize = JSON.stringify(items).length;
      const storageSizeMB = (storageSize / (1024 * 1024)).toFixed(2);
      console.log(`Chrome Storage Size: ${storageSizeMB} MB (${storageSize} bytes)`);
    });
  }
  function UpdateToggleLabel(isOn) {
    if (!stateText) return;
    const dot = stateText.querySelector(".status-dot");
    if (dot) dot.classList.toggle("active", isOn);
    stateText.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = isOn ? "Tracking Active" : "Tracking Paused";
      }
    });
  }
  function DisplayJobs() {
    if (!jobList) return;
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length === 0) {
        jobList.innerHTML = "<p class='no-data-text'>No jobs in your list. Click a handshake job to add one!</p>";
        UpdateSubmitButtonState();
        return;
      }
      jobList.innerHTML = `<h2>Job List (${jobs.length})</h2>`;
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
      jobList.appendChild(container);
      UpdateSubmitButtonState();
    });
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
  function UpdateSubmitButtonState() {
    if (!submitButton) return;
    chrome.storage.local.get("jobData", (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length > 0) {
        submitButton.disabled = false;
        submitButton.textContent = `Submit ${jobs.length} Job${jobs.length !== 1 ? "s" : ""}`;
      } else {
        submitButton.disabled = true;
        submitButton.textContent = "No jobs to submit";
      }
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

  // scripts/popup.ts
  var authView = null;
  var mainView = null;
  var loginPanel = null;
  var signupPanel = null;
  var loginTab = null;
  var signupTab = null;
  if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof globalThis.vi === "undefined") {
    SetupPopupRoot();
  }
  function SetupPopupRoot() {
    authView = document.getElementById("authView");
    mainView = document.getElementById("mainView");
    loginPanel = document.getElementById("loginPanel");
    signupPanel = document.getElementById("signupPanel");
    loginTab = document.getElementById("loginTab");
    signupTab = document.getElementById("signupTab");
    if (true) {
      const graphqlHeader = document.querySelector(".graphql-section-header");
      const graphqlContainer = document.getElementById("graphqlResponses");
      if (graphqlHeader) graphqlHeader.classList.add("hidden");
      if (graphqlContainer) graphqlContainer.classList.add("hidden");
    }
    loginTab?.addEventListener("click", ShowLoginPanel);
    signupTab?.addEventListener("click", ShowSignupPanel);
    SetupAuth({
      showMainView: ShowMainView,
      showLoginView: ShowLoginPanel,
      showAuthView: ShowAuthView
    });
    SetupMainPopup();
    chrome.storage.local.get(["username"], (result) => {
      if (result.username) {
        ShowMainView();
      } else {
        ShowAuthView();
      }
    });
  }
  function SwitchView(view) {
    if (!authView || !mainView) return;
    authView.classList.toggle("active", view === "auth");
    authView.classList.toggle("hidden", view !== "auth");
    mainView.classList.toggle("active", view === "main");
    mainView.classList.toggle("hidden", view !== "main");
  }
  function ShowAuthView() {
    SwitchView("auth");
    ShowLoginPanel();
  }
  function ShowLoginPanel() {
    if (loginPanel) loginPanel.classList.remove("hidden");
    if (signupPanel) signupPanel.classList.add("hidden");
    if (loginTab) loginTab.classList.add("active-tab");
    if (signupTab) signupTab.classList.remove("active-tab");
  }
  function ShowSignupPanel() {
    if (signupPanel) signupPanel.classList.remove("hidden");
    if (loginPanel) loginPanel.classList.add("hidden");
    if (signupTab) signupTab.classList.add("active-tab");
    if (loginTab) loginTab.classList.remove("active-tab");
    ResetCreateAccountView();
  }
  function ShowMainView() {
    SwitchView("main");
    ResetMainPopup();
  }
})();
