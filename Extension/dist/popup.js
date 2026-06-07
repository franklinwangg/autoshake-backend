"use strict";
(() => {
  // scripts/apiConstants.ts
  var API_BASE_URL = "https://autoshake-production.up.railway.app";
  var API_ENDPOINTS = {
    SIGNUP: "/auth/signup",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    GET_PROFILE: "/user/profile",
    UPDATE_PROFILE: "/user/profile",
    UPLOAD_RESUME: "/resume/upload",
    GET_RESUME: "/resume",
    EXTRACT_RESUME_TEXT: "/resume/extract-text",
    PARSE_RESUME: "/resume/parse-resume",
    DELETE_RESUME: "/resume",
    SUBMIT_JOBS: "/jobs",
    GET_JOBS: "/jobs",
    GET_JOB: (jobId) => `/jobs/${jobId}`,
    DELETE_JOB: (jobId) => `/jobs/${jobId}`,
    GENERATE_RESUME: (jobId) => `/jobs/${jobId}/generate`,
    GET_GENERATED_RESUME: (jobId) => `/jobs/${jobId}/resume`,
    BATCH_GENERATE: "/generate/batch",
    EXTRACT_SKILLS: "/extract-skills",
    GENERATE_RESUME_PIPELINE: "/generate-resume",
    GET_TEMPLATES: "/templates",
    HEALTH: "/health"
  };

  // scripts/api.ts
  async function Login(email, password) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.LOGIN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.json();
  }
  async function Signup(email, password) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SIGNUP}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.json();
  }
  async function GetResume(authToken) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GET_RESUME}`, {
      headers: { "Authorization": `Bearer ${authToken}` }
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.json();
  }
  async function ExtractResumeText(authToken, url) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.EXTRACT_RESUME_TEXT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ url })
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.json();
  }
  async function ParseResume(authToken, text) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.PARSE_RESUME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.json();
  }
  async function GenerateResume(authToken, resume, jobDescription) {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.GENERATE_RESUME_PIPELINE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`
      },
      body: JSON.stringify({ job_description: jobDescription, resume })
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.blob();
  }
  async function UploadResume(authToken, file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.UPLOAD_RESUME}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${authToken}` },
      body: formData
    });
    if (!response.ok) {
      const body = await response.text();
      throw BuildApiError(response, body);
    }
    return response.json();
  }
  function BuildApiError(response, body) {
    const parseMessage = (value) => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(parseMessage).filter(Boolean).join("; ");
      }
      if (typeof value === "object" && value !== null) {
        const errorObject = value;
        if (typeof errorObject.msg === "string") return errorObject.msg;
        if (typeof errorObject.detail === "string") return errorObject.detail;
        if (typeof errorObject.message === "string") return errorObject.message;
        return Object.values(errorObject).map(parseMessage).filter(Boolean).join("; ");
      }
      return void 0;
    };
    let message;
    try {
      const parsed = JSON.parse(body);
      message = parseMessage(parsed) ?? (body || `Request failed with status ${response.status}`);
    } catch {
      message = body || `Request failed with status ${response.status}`;
    }
    return { status: response.status, message };
  }

  // scripts/popupAuth.ts
  function SetupAuth(callbacks3) {
    const { routeAfterLogin, showLoginView } = callbacks3;
    const loginButton = document.getElementById("loginButton");
    loginButton?.addEventListener("click", () => HandleLogin(routeAfterLogin));
    const createAccountButton = document.getElementById("createAccountButton");
    createAccountButton?.addEventListener("click", () => HandleCreateAccount(showLoginView));
    const passwordInput = document.getElementById("passwordInput");
    passwordInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") HandleLogin(routeAfterLogin);
    });
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    confirmPasswordInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") HandleCreateAccount(showLoginView);
    });
  }
  async function HandleLogin(onSuccess) {
    const emailInput = document.getElementById("emailInput");
    const passwordInput = document.getElementById("passwordInput");
    const loginError = document.getElementById("loginError");
    const email = emailInput?.value.trim() ?? "";
    const password = passwordInput?.value ?? "";
    if (loginError) loginError.textContent = "";
    if (!email || !password) {
      if (loginError) loginError.textContent = "Please enter an email and password.";
      return;
    }
    const loginButton = document.getElementById("loginButton");
    if (loginButton) loginButton.disabled = true;
    try {
      const response = await Login(email, password);
      chrome.storage.local.set({ email, authToken: response.access_token }, () => {
        if (emailInput) emailInput.value = "";
        if (passwordInput) passwordInput.value = "";
        onSuccess();
      });
    } catch (error) {
      if (loginError) loginError.textContent = error.message || "Login failed. Please try again.";
    } finally {
      if (loginButton) loginButton.disabled = false;
    }
  }
  async function HandleCreateAccount(onSuccess) {
    const createEmailInput = document.getElementById("createEmailInput");
    const createPasswordInput = document.getElementById("createPasswordInput");
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    const createAccountError = document.getElementById("createAccountError");
    const email = createEmailInput?.value.trim() ?? "";
    const password = createPasswordInput?.value ?? "";
    const confirmPassword = confirmPasswordInput?.value ?? "";
    if (createAccountError) createAccountError.textContent = "";
    if (!email || !password || !confirmPassword) {
      if (createAccountError) createAccountError.textContent = "Please fill in all fields.";
      return;
    }
    if (password !== confirmPassword) {
      if (createAccountError) createAccountError.textContent = "Passwords do not match.";
      return;
    }
    const createAccountButton = document.getElementById("createAccountButton");
    if (createAccountButton) createAccountButton.disabled = true;
    try {
      await Signup(email, password);
      ResetCreateAccountView();
      onSuccess();
    } catch (error) {
      if (createAccountError) createAccountError.textContent = error.message || "Account creation failed. Please try again.";
    } finally {
      if (createAccountButton) createAccountButton.disabled = false;
    }
  }
  function ResetCreateAccountView() {
    const createEmailInput = document.getElementById("createEmailInput");
    const createPasswordInput = document.getElementById("createPasswordInput");
    const confirmPasswordInput = document.getElementById("confirmPasswordInput");
    const createAccountError = document.getElementById("createAccountError");
    if (createEmailInput) createEmailInput.value = "";
    if (createPasswordInput) createPasswordInput.value = "";
    if (confirmPasswordInput) confirmPasswordInput.value = "";
    if (createAccountError) createAccountError.textContent = "";
  }

  // scripts/popupUtils.ts
  function GetAuthTokenFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["authToken"], (result) => {
        resolve(result.authToken);
      });
    });
  }
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

  // scripts/popupGenerating.ts
  var progressText = null;
  function SetupGeneratingView() {
    progressText = document.getElementById("generatingProgress");
  }
  function ResetGeneratingView() {
    UpdateGeneratingProgress(0, 0);
  }
  function UpdateGeneratingProgress(completed, total) {
    if (!progressText) return;
    if (total === 0) {
      progressText.textContent = "Preparing...";
      return;
    }
    progressText.textContent = `Generating ${completed} of ${total} resumes...`;
  }

  // scripts/popupMain.ts
  var toggle = null;
  var stateText = null;
  var jobList = null;
  var submitButton = null;
  function SetupMainPopup(showAuthView, showResumeView, showGeneratingView) {
    toggle = document.getElementById("stateToggle");
    stateText = document.getElementById("trackingLabel");
    jobList = document.getElementById("jobList");
    if (false) {
      graphqlToggleButton = document.getElementById("toggleGraphql");
    }
    submitButton = document.getElementById("submitButton");
    AttachMainPopupListeners(showAuthView, showResumeView, showGeneratingView);
  }
  function AttachMainPopupListeners(showAuthView, showResumeView, showGeneratingView) {
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
    submitButton?.addEventListener("click", () => SubmitJobList(showGeneratingView));
    const logoutButton = document.getElementById("logoutButton");
    logoutButton?.addEventListener("click", () => HandleLogout(showAuthView));
    const updateResumeButton = document.getElementById("updateResumeButton");
    updateResumeButton?.addEventListener("click", showResumeView);
  }
  function ResetMainPopup() {
    DisplayEmail();
    RefreshMainView();
  }
  function DisplayEmail() {
    chrome.storage.local.get(["email"], (result) => {
      const emailDisplay = document.getElementById("emailDisplay");
      if (emailDisplay && result.email) {
        emailDisplay.innerHTML = `<span class="label">Logged in as</span>${result.email}`;
      }
    });
  }
  async function HandleLogout(showAuthView) {
    chrome.storage.local.remove(["authToken", "email"], () => {
      showAuthView();
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
      DisplayGraphqlResponses();
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
  function SubmitJobList(showGeneratingView) {
    chrome.storage.local.get(["jobData", "authToken", "resumeJson"], (result) => {
      const jobData = result.jobData || {};
      const jobs = Object.values(jobData).filter((job) => job.clicked);
      if (jobs.length === 0) {
        alert("No jobs to submit!");
        return;
      }
      ClearClickedJobs(jobData, jobs);
      showGeneratingView();
      const authToken = result.authToken;
      const resumeJson = result.resumeJson ?? {};
      if (!authToken) {
        alert("Not authenticated. Please log in again.");
        return;
      }
      GenerateResumesForJobs(jobs, authToken, resumeJson);
    });
  }
  function ClearClickedJobs(jobData, jobs) {
    jobs.forEach((job) => {
      if (jobData[job.jobId]) {
        jobData[job.jobId].clicked = false;
      }
    });
    chrome.storage.local.set({ jobData });
  }
  async function GenerateResumesForJobs(jobs, authToken, resumeJson) {
    const totalJobs = jobs.length;
    let completedCount = 0;
    const resumeResults = [];
    UpdateGeneratingProgress(0, totalJobs);
    const promises = [];
    for (const job of jobs) {
      const company = ExtractJobField(job.graphqlResponses || [], ["job", "employer", "name"]) || "Unknown Company";
      const title = ExtractJobField(job.graphqlResponses || [], ["job", "title"]) || "Unknown Role";
      const jobDescription = ExtractJobField(job.graphqlResponses || [], ["job", "description"]) || title;
      console.log(`GenerateResume for "${title}" at "${company}":`, { jobDescription, resumeJson });
      promises.push(
        GenerateResume(authToken, resumeJson, jobDescription).then(async (blob) => {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const pdfBase64 = btoa(binary);
          completedCount++;
          UpdateGeneratingProgress(completedCount, totalJobs);
          return { jobId: job.jobId, company, title, href: job.href, success: true, pdfBase64 };
        }).catch(() => {
          completedCount++;
          UpdateGeneratingProgress(completedCount, totalJobs);
          return { jobId: job.jobId, company, title, href: job.href, success: false };
        })
      );
    }
    const outcomes = await Promise.allSettled(promises);
    for (const outcome of outcomes) {
      const fulfilled = outcome;
      resumeResults.push(fulfilled.value);
    }
    chrome.storage.local.set({ resumeResults }, () => {
      ShowResultsView();
    });
  }

  // scripts/popupResume.ts
  var dropZone = null;
  var fileInput = null;
  var uploadError = null;
  var uploadStatus = null;
  var backButton = null;
  var callbacks = null;
  function SetupResumeView(resumeCallbacks) {
    callbacks = resumeCallbacks;
    dropZone = document.getElementById("resumeDropZone");
    fileInput = document.getElementById("resumeFileInput");
    uploadError = document.getElementById("resumeUploadError");
    uploadStatus = document.getElementById("resumeUploadStatus");
    backButton = document.getElementById("resumeBackButton");
    AttachResumeViewListeners();
  }
  function AttachResumeViewListeners() {
    if (!dropZone) return;
    dropZone.addEventListener("dragover", HandleDragOver);
    dropZone.addEventListener("dragleave", HandleDragLeave);
    dropZone.addEventListener("drop", HandleDrop);
    dropZone.addEventListener("click", () => fileInput?.click());
    if (fileInput) {
      fileInput.addEventListener("change", HandleFileInputChange);
    }
    if (backButton) {
      backButton.addEventListener("click", () => {
        if (callbacks) callbacks.showMainView();
      });
    }
  }
  function ResetResumeView(isReturningFromMain) {
    if (uploadError) uploadError.textContent = "";
    if (uploadStatus) uploadStatus.textContent = "";
    if (fileInput) fileInput.value = "";
    if (backButton) {
      backButton.classList.toggle("hidden", !isReturningFromMain);
    }
  }
  function HandleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone?.classList.add("drag-over");
  }
  function HandleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone?.classList.remove("drag-over");
  }
  function HandleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    dropZone?.classList.remove("drag-over");
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!IsValidPdf(file)) {
      ShowUploadError("Please upload a PDF file.");
      return;
    }
    ProcessResumeUpload(file);
  }
  function HandleFileInputChange() {
    const file = fileInput?.files?.[0];
    if (!file) return;
    if (!IsValidPdf(file)) {
      ShowUploadError("Please upload a PDF file.");
      return;
    }
    ProcessResumeUpload(file);
  }
  function IsValidPdf(file) {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }
  async function ProcessResumeUpload(file) {
    if (uploadError) uploadError.textContent = "";
    SetUploadStatus("Uploading resume...");
    const authToken = await GetAuthTokenFromStorage();
    if (!authToken) {
      ShowUploadError("Not authenticated. Please log in again.");
      return;
    }
    try {
      await UploadResume(authToken, file);
      SetUploadStatus("Resume uploaded. Extracting text...");
      const resumeList = await GetResume(authToken);
      const latestResume = resumeList.resumes[0];
      if (!latestResume) {
        ShowUploadError("Upload succeeded but no resume found on server.");
        return;
      }
      SetUploadStatus("Extracting text from resume...");
      const extracted = await ExtractResumeText(authToken, latestResume.url);
      SetUploadStatus("Parsing resume...");
      const parsed = await ParseResume(authToken, extracted.text);
      chrome.storage.local.set({ resumeJson: parsed }, () => {
        SetUploadStatus("Resume processed successfully!");
        if (callbacks) callbacks.showMainView();
      });
    } catch (error) {
      const apiError = error;
      ShowUploadError(apiError?.message ?? "Upload failed. Please try again.");
    }
  }
  function ShowUploadError(message) {
    if (uploadStatus) uploadStatus.textContent = "";
    if (uploadError) uploadError.textContent = message;
  }
  function SetUploadStatus(message) {
    if (uploadStatus) uploadStatus.textContent = message;
  }

  // scripts/popupResults.ts
  var currentCardIndex = 0;
  var callbacks2 = null;
  function SetupResultsView(resultsCallbacks) {
    callbacks2 = resultsCallbacks;
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    const backButton2 = document.getElementById("resultsBackButton");
    prevBtn?.addEventListener("click", () => NavigateCard(-1));
    nextBtn?.addEventListener("click", () => NavigateCard(1));
    backButton2?.addEventListener("click", HandleBackToMain);
  }
  function ResetResultsView() {
    currentCardIndex = 0;
    chrome.storage.local.get(["resumeResults"], (result) => {
      RenderCard(result.resumeResults || []);
    });
  }
  function NavigateCard(direction) {
    chrome.storage.local.get(["resumeResults"], (result) => {
      const results = result.resumeResults || [];
      if (results.length === 0) return;
      currentCardIndex = Math.max(0, Math.min(results.length - 1, currentCardIndex + direction));
      RenderCard(results);
    });
  }
  function RenderCard(results) {
    const cardEl = document.getElementById("resumeCard");
    const dotsEl = document.getElementById("carouselDots");
    const counterEl = document.getElementById("carouselCounter");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    if (!cardEl) return;
    if (results.length === 0) {
      cardEl.innerHTML = '<p class="no-data-text">No results to display.</p>';
      if (counterEl) counterEl.textContent = "";
      if (dotsEl) dotsEl.innerHTML = "";
      return;
    }
    const currentResult = results[currentCardIndex];
    if (!currentResult) return;
    if (counterEl) counterEl.textContent = `${currentCardIndex + 1} of ${results.length}`;
    cardEl.innerHTML = `
		<div class="card-company">${currentResult.company}</div>
		<div class="card-title">${currentResult.title}</div>
		${currentResult.success ? '<span class="card-badge badge-success">Tailored Successfully</span>' : '<span class="card-badge badge-error">Could not tailor resume</span>'}
		${currentResult.href ? `<a class="card-job-link" href="${currentResult.href}" target="_blank">View Job Posting &rarr;</a>` : ""}
		${currentResult.success && currentResult.pdfBase64 ? '<button class="download-button" id="downloadBtn">Download PDF</button>' : ""}
	`;
    if (currentResult.success && currentResult.pdfBase64) {
      document.getElementById("downloadBtn")?.addEventListener("click", () => {
        DownloadPdf(currentResult);
      });
    }
    if (dotsEl) {
      dotsEl.innerHTML = results.map(
        (_result, index) => `<span class="dot ${index === currentCardIndex ? "dot-active" : ""}"></span>`
      ).join("");
    }
    if (prevBtn) prevBtn.disabled = currentCardIndex === 0;
    if (nextBtn) nextBtn.disabled = currentCardIndex === results.length - 1;
  }
  function DownloadPdf(result) {
    if (!result.pdfBase64) return;
    const binary = atob(result.pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let byteIndex = 0; byteIndex < binary.length; byteIndex++) {
      bytes[byteIndex] = binary.charCodeAt(byteIndex);
    }
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = url;
    downloadAnchor.download = `${result.company}_${result.title}_resume.pdf`.replace(/[^a-z0-9_\-]/gi, "_");
    downloadAnchor.click();
    URL.revokeObjectURL(url);
  }
  function HandleBackToMain() {
    chrome.storage.local.remove(["resumeResults"], () => {
      if (callbacks2) callbacks2.showMainView();
    });
  }

  // scripts/popup.ts
  var authView = null;
  var resumeView = null;
  var mainView = null;
  var generatingView = null;
  var resultsView = null;
  var loginPanel = null;
  var signupPanel = null;
  var loginTab = null;
  var signupTab = null;
  if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof globalThis.vi === "undefined") {
    SetupPopupRoot();
  }
  function SetupPopupRoot() {
    authView = document.getElementById("authView");
    resumeView = document.getElementById("resumeView");
    mainView = document.getElementById("mainView");
    generatingView = document.getElementById("generatingView");
    resultsView = document.getElementById("resultsView");
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
      routeAfterLogin: RouteAfterLogin,
      showLoginView: ShowLoginPanel
    });
    SetupResumeView({
      showMainView: ShowMainView
    });
    SetupMainPopup(ShowAuthView, ShowResumeViewFromMain, ShowGeneratingView);
    SetupGeneratingView();
    SetupResultsView({
      showMainView: ShowMainView
    });
    chrome.storage.local.remove(["resumeResults"]);
    chrome.storage.local.get(["authToken"], (result) => {
      if (result.authToken) {
        RouteAfterLogin();
      } else {
        ShowAuthView();
      }
    });
  }
  async function RouteAfterLogin() {
    const authToken = await GetAuthTokenFromStorage();
    if (!authToken) {
      ShowAuthView();
      return;
    }
    try {
      const resumeList = await GetResume(authToken);
      if (resumeList.resumes.length > 0) {
        const hasResumeJson = await HasLocalResumeJson();
        if (!hasResumeJson) {
          await FetchAndStoreResumeJson(authToken, resumeList.resumes[0].url);
        }
        LogResumeJson();
        ShowMainView();
      } else {
        ShowResumeViewFromAuth();
      }
    } catch {
      ShowMainView();
    }
  }
  async function HasLocalResumeJson() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["resumeJson"], (result) => {
        resolve(!!result.resumeJson);
      });
    });
  }
  async function FetchAndStoreResumeJson(authToken, resumeUrl) {
    const extracted = await ExtractResumeText(authToken, resumeUrl);
    const parsed = await ParseResume(authToken, extracted.text);
    return new Promise((resolve) => {
      chrome.storage.local.set({ resumeJson: parsed }, () => {
        resolve();
      });
    });
  }
  function SwitchView(view) {
    const allViews = [authView, resumeView, mainView, generatingView, resultsView];
    for (const v of allViews) {
      if (!v) continue;
      const isTarget = v === authView && view === "auth" || v === resumeView && view === "resume" || v === mainView && view === "main" || v === generatingView && view === "generating" || v === resultsView && view === "results";
      v.classList.toggle("active", isTarget);
      v.classList.toggle("hidden", !isTarget);
    }
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
  function ShowResumeViewFromAuth() {
    SwitchView("resume");
    ResetResumeView(false);
  }
  function ShowResumeViewFromMain() {
    SwitchView("resume");
    ResetResumeView(true);
  }
  function ShowGeneratingView() {
    SwitchView("generating");
    ResetGeneratingView();
  }
  function ShowResultsView() {
    SwitchView("results");
    ResetResultsView();
  }
  function ShowMainView() {
    SwitchView("main");
    ResetMainPopup();
  }
  function LogResumeJson() {
    chrome.storage.local.get(["resumeJson"], (result) => {
      console.log("Resume JSON:", result.resumeJson);
    });
  }
})();
