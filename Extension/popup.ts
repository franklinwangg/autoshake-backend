import type { JobRecord, JobData, StorageResult, GraphqlResponse } from './types';
import { GetRelativeTime, GetFieldFromObject, ExtractJobField } from './popupUtils';
import { IsObject } from './inject';

// Compile-time debug flag for GraphQL view
declare const DEBUG_GRAPHQL_VIEW: boolean;

interface ParsedGraphQLData {
	[key: string]: unknown;
}

let toggle: HTMLInputElement | null = null;
let stateText: HTMLElement | null = null;
let jobList: HTMLElement | null = null;
let graphqlToggleButton: HTMLElement | null = null;
let graphqlStats: HTMLElement | null = null;
let submitButton: HTMLButtonElement | null = null;
let loginView: HTMLElement | null = null;
let mainView: HTMLElement | null = null;
let createAccountView: HTMLElement | null = null;

function ShowLoginView(): void {
	if (loginView) loginView.classList.add("active");
	if (loginView) loginView.classList.remove("hidden");
	if (mainView) mainView.classList.add("hidden");
	if (mainView) mainView.classList.remove("active");
	if (createAccountView) createAccountView.classList.add("hidden");
	if (createAccountView) createAccountView.classList.remove("active");
}

function ShowCreateAccountView(): void {
	if (loginView) loginView.classList.add("hidden");
	if (loginView) loginView.classList.remove("active");
	if (createAccountView) createAccountView.classList.add("active");
	if (createAccountView) createAccountView.classList.remove("hidden");
	if (mainView) mainView.classList.add("hidden");
	if (mainView) mainView.classList.remove("active");
	
	// Clear form inputs
	const createUsernameInput = document.getElementById("createUsernameInput") as HTMLInputElement | null;
	const createPasswordInput = document.getElementById("createPasswordInput") as HTMLInputElement | null;
	const confirmPasswordInput = document.getElementById("confirmPasswordInput") as HTMLInputElement | null;
	const createAccountError = document.getElementById("createAccountError");
	
	if (createUsernameInput) createUsernameInput.value = "";
	if (createPasswordInput) createPasswordInput.value = "";
	if (confirmPasswordInput) confirmPasswordInput.value = "";
	if (createAccountError) createAccountError.textContent = "";
}

function ShowMainView(): void {
	if (loginView) loginView.classList.add("hidden");
	if (loginView) loginView.classList.remove("active");
	if (mainView) mainView.classList.add("active");
	if (mainView) mainView.classList.remove("hidden");
	if (createAccountView) createAccountView.classList.add("hidden");
	if (createAccountView) createAccountView.classList.remove("active");
	
	// Display username in header
	chrome.storage.local.get(["username"], (result: StorageResult) => {
		const usernameDisplay = document.getElementById("usernameDisplay");
		if (usernameDisplay && result.username) {
			usernameDisplay.textContent = `Logged in as: ${result.username}`;
		}
	});
	
	InitializePopupDOMElements();
	InitializePopup();
}

function HandleLogin(): void {
	const usernameInput = document.getElementById("usernameInput") as HTMLInputElement | null;
	const passwordInput = document.getElementById("passwordInput") as HTMLInputElement | null;
	const loginError = document.getElementById("loginError");

	const username = usernameInput?.value.trim() ?? "";
	const password = passwordInput?.value ?? "";

	// Clear any existing errors
	if (loginError) loginError.textContent = "";

	if (!username || !password) {
		if (loginError) loginError.textContent = "Please enter a username and password.";
		return;
	}

	// BACKEND TODO: Validate credentials against the backend server
	// For now, always succeeds (no backend validation)
	chrome.storage.local.set({ username }, () => {
		// Clear form inputs after successful login
		if (usernameInput) usernameInput.value = "";
		if (passwordInput) passwordInput.value = "";
		ShowMainView();
	});
}

function HandleCreateAccount(): void {
	const createUsernameInput = document.getElementById("createUsernameInput") as HTMLInputElement | null;
	const createPasswordInput = document.getElementById("createPasswordInput") as HTMLInputElement | null;
	const confirmPasswordInput = document.getElementById("confirmPasswordInput") as HTMLInputElement | null;
	const createAccountError = document.getElementById("createAccountError");

	const username = createUsernameInput?.value.trim() ?? "";
	const password = createPasswordInput?.value ?? "";
	const confirmPassword = confirmPasswordInput?.value ?? "";

	// Clear any existing errors
	if (createAccountError) createAccountError.textContent = "";

	if (!username || !password || !confirmPassword) {
		if (createAccountError) createAccountError.textContent = "Please fill in all fields.";
		return;
	}

	if (password !== confirmPassword) {
		if (createAccountError) createAccountError.textContent = "Passwords do not match.";
		return;
	}

	// BACKEND TODO: Send account creation request to the backend server
	// with username and password to create a new user account
	// For now, just clear inputs and return to login
	if (createUsernameInput) createUsernameInput.value = "";
	if (createPasswordInput) createPasswordInput.value = "";
	if (confirmPasswordInput) confirmPasswordInput.value = "";
	ShowLoginView();
}

function HandleLogout(): void {
	chrome.storage.local.set({ username: "" }, () => {
		ShowLoginView();
	});
}

function InitializePopupDOMElements() {
	toggle = document.getElementById("stateToggle") as HTMLInputElement | null;
	stateText = document.getElementById("trackingLabel");
	jobList = document.getElementById("jobList");
	if (DEBUG_GRAPHQL_VIEW) {
		graphqlToggleButton = document.getElementById("toggleGraphQL");
		graphqlStats = document.getElementById("graphqlStats");
	}
	submitButton = document.getElementById("submitButton") as HTMLButtonElement | null;
}

function DisplayGraphQLResponses(): void {
  const container: HTMLElement | null = document.getElementById("graphqlResponses");
  if (!container) return;

  chrome.storage.local.get("jobData", (result: StorageResult) => {
    const jobData: JobData = result.jobData || {};
    const responses: GraphqlResponse[] = Object.values(jobData)
      .flatMap((job: JobRecord) => Array.isArray(job.graphqlResponses) ? job.graphqlResponses : []);

    if (responses.length === 0) {
      container.innerHTML = "<p class='no-data-text'>No responses yet</p>";
      return;
    }

    container.innerHTML = "";

    responses.slice().reverse().forEach((r: GraphqlResponse, i: number) => {
      const parsed: unknown = JSON.parse(r.data);
      const parsedData: ParsedGraphQLData | null = IsObject(parsed) ? parsed as ParsedGraphQLData : null;
      const inner: unknown = parsedData && "data" in parsedData && IsObject(parsedData.data) ? parsedData.data : null;
      const operationName: string = inner
        ? Object.keys(inner).join(", ") || "unknown"
        : parsedData
          ? Object.keys(parsedData)[0] ?? "unknown"
          : "unknown";

      const item: HTMLDivElement = document.createElement("div");
      item.className = "graphql-item";
      item.innerHTML = `
        <div class="graphql-header" data-index="${i}">
          <span class="graphql-op">${operationName}</span>
          <span class="graphql-time">${GetRelativeTime(r.timestamp)}</span>
          <span class="graphql-toggle">▶</span>
        </div>
        <pre class="graphql-body" id="body-${i}">${JSON.stringify(parsed, null, 2)}</pre>
      `;

      const headerElement: Element | null = item.querySelector(".graphql-header");
      headerElement?.addEventListener("click", () => {
        const body: HTMLElement | null = document.getElementById(`body-${i}`);
        const toggleIcon: Element | null = item.querySelector(".graphql-toggle");
        const isHidden: boolean = body?.style.display === "none";
        if (body) body.style.display = isHidden ? "block" : "none";
        if (toggleIcon) toggleIcon.textContent = isHidden ? "▼" : "▶";
      });

      container.appendChild(item);
    });
  });
}

function DeleteJob(jobId: string): void {
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		if (jobData[jobId]) {
			jobData[jobId].clicked = false;
		}
		
		chrome.storage.local.set({ jobData }, () => {
			DisplayJobs();
		});
	});
}

function ClearAllJobs(): void {
	chrome.storage.local.set({ jobData: {} }, () => {
		DisplayJobs();
	});
}

function SubmitJobList(): void {
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);

		if (jobs.length === 0) {
			alert("No jobs to submit!");
			return;
		}

		// Prepare the payload with all job data and their GraphQL responses
		const payload = {
			jobs: jobs,
			submittedAt: new Date().toISOString(),
		};

		console.log("Submitting job list:", payload);

		// BACKEND TODO: Send the job list submission to the backend server
		// This is where the job list will be submitted to the FastAPI backend server.
		// The implementation will involve:
		// 1. Making a POST request to the FastAPI server endpoint (e.g., http://localhost:8000/submit-jobs)
		// 2. Sending the payload as JSON
		// 3. Handling the response and any errors
		// 4. Only clearing the clicked field on successful submission

		// Clear the clicked field for all submitted jobs to preserve GraphQL data
		jobs.forEach((job: JobRecord) => {
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

function UpdateToggleLabel(isOn: boolean): void {
	if (stateText) {
		stateText.textContent = `Job Tracking: ${isOn ? "Enabled" : "Disabled"}\n`;
	}
}

function UpdateSubmitButtonState(): void {
	if (!submitButton) return;
	
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);
		
		if (jobs.length > 0) {
			submitButton!.disabled = false;
			submitButton!.textContent = "Submit Job List";
		} else {
			submitButton!.disabled = true;
			submitButton!.textContent = "Need jobs to submit";
		}
	});
}

function DisplayJobs(): void {
	if (!jobList) return;
	const listEl = jobList;
	
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);
		
		if (jobs.length === 0) {
			listEl.innerHTML = "<p class='no-data-text'>No jobs in your list. Click a handshake job to add one!</p>";
			UpdateSubmitButtonState();
			return;
		}
		
		listEl.innerHTML = `<h2>Job List (${jobs.length})</h2>`;
		const container: HTMLDivElement = document.createElement("div");
		container.className = "jobs-container";
		
		for (const job of jobs) {
			const jobItem: HTMLDivElement = document.createElement("div");
			jobItem.className = "job-item";
			
			const jobTitle: string = ExtractJobField(job.graphqlResponses || [], ["job", "title"]) || "Unknown Job";
			const jobEmployer: string | null = ExtractJobField(job.graphqlResponses || [], ["job", "employer", "name"]);
			const relativeTime: string = job.clickTimestamp ? GetRelativeTime(job.clickTimestamp) : "unknown time";
			jobItem.innerHTML = `
				<div class="job-title">${jobTitle}</div>
				${jobEmployer ? `<div class="job-employer">${jobEmployer}</div>` : ""}
				<div class="job-meta">${relativeTime}</div>
				<button class="delete-button" data-job-id="${job.jobId}">×</button>
			`;
			
			jobItem.addEventListener("click", (e: MouseEvent) => {
				if ((e.target as HTMLElement).classList.contains("delete-button")) return;
				
				let fullUrl: string = job.href ?? "";
				if (!fullUrl.startsWith("http")) {
					fullUrl = "https://app.joinhandshake.com" + (fullUrl.startsWith("/") ? "" : "/") + fullUrl;
				}
				chrome.tabs.create({ url: fullUrl });
			});
			
			const deleteButton: HTMLButtonElement | null = jobItem.querySelector(".delete-button");
			deleteButton?.addEventListener("click", (e: MouseEvent) => {
				e.stopPropagation();
				DeleteJob(job.jobId);
			});
			
			container.appendChild(jobItem);
		};
		
		listEl.appendChild(container);
		UpdateSubmitButtonState();
	});
}

function InitializePopup(): void {
	if (!toggle || !stateText || !jobList) return;

	const toggleEl: HTMLInputElement = toggle;
	const graphqlBtn: HTMLElement = graphqlToggleButton!;

	chrome.storage.local.get(["trackingEnabled"], (result: StorageResult) => {
		const enabled: boolean = result.trackingEnabled !== false;
		toggleEl.checked = enabled;
		UpdateToggleLabel(enabled);

		toggleEl.addEventListener("change", () => {
			const isOn: boolean = toggleEl.checked;
			chrome.storage.local.set({ trackingEnabled: isOn }, () => {
				UpdateToggleLabel(isOn);
			});
		});
	});

	DisplayJobs();
	if (DEBUG_GRAPHQL_VIEW) {
		DisplayGraphQLResponses();
	}
	UpdateSubmitButtonState();

	// Log storage size
	chrome.storage.local.get(null, (items: Record<string, unknown>) => {
		const storageSize = JSON.stringify(items).length;
		const storageSizeMB = (storageSize / (1024 * 1024)).toFixed(2);
		console.log(`Chrome Storage Size: ${storageSizeMB} MB (${storageSize} bytes)`);
	});

	if (DEBUG_GRAPHQL_VIEW) {
		graphqlBtn.addEventListener("click", () => {
			const container: HTMLElement | null = document.getElementById("graphqlResponses");
			if (!container) return;

			const isHidden: boolean = container.classList.contains("hidden");
			container.classList.toggle("hidden", !isHidden);
			graphqlBtn.textContent = isHidden ? "Hide" : "Show";
		});
	}

	submitButton?.addEventListener("click", SubmitJobList);
}

if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof (globalThis as Record<string, unknown>).vi === "undefined") {
	loginView = document.getElementById("loginView");
	mainView = document.getElementById("mainView");
	createAccountView = document.getElementById("createAccountView");

	// Hide GraphQL section if not in debug mode
	if (!DEBUG_GRAPHQL_VIEW) {
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

	const passwordInput = document.getElementById("passwordInput") as HTMLInputElement | null;
	passwordInput?.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Enter") HandleLogin();
	});

	const confirmPasswordInput = document.getElementById("confirmPasswordInput") as HTMLInputElement | null;
	confirmPasswordInput?.addEventListener("keydown", (e: KeyboardEvent) => {
		if (e.key === "Enter") HandleCreateAccount();
	});

	chrome.storage.local.get(["username"], (result: StorageResult) => {
		if (result.username) {
			ShowMainView();
		} else {
			ShowLoginView();
		}
	});
}
