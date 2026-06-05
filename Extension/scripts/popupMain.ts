import type { JobRecord, JobData, StorageResult, GraphqlResponse, ParsedGraphQLData } from './types';
import { GetRelativeTime, ExtractJobField, IsObject } from './popupUtils';

// Compile-time debug flag for GraphQL view
declare const DEBUG_GRAPHQL_VIEW: boolean;

let toggle: HTMLInputElement | null = null;
let stateText: HTMLElement | null = null;
let jobList: HTMLElement | null = null;
let graphqlToggleButton: HTMLElement | null = null;
let submitButton: HTMLButtonElement | null = null;

export function SetupMainPopup(): void {
	toggle = document.getElementById("stateToggle") as HTMLInputElement | null;
	stateText = document.getElementById("trackingLabel");
	jobList = document.getElementById("jobList");
	if (DEBUG_GRAPHQL_VIEW) {
		graphqlToggleButton = document.getElementById("toggleGraphQL");
	}
	submitButton = document.getElementById("submitButton") as HTMLButtonElement | null;

	AttachMainPopupListeners();
}

function AttachMainPopupListeners(): void {
	if (toggle) {
		toggle.addEventListener('change', () => {
			const isOn: boolean = toggle!.checked;
			chrome.storage.local.set({ trackingEnabled: isOn }, () => {
				UpdateToggleLabel(isOn);
			});
		});
	}

	if (DEBUG_GRAPHQL_VIEW && graphqlToggleButton) {
		graphqlToggleButton.addEventListener('click', () => {
			const container: HTMLElement | null = document.getElementById('graphqlResponses');
			if (!container) return;

			const isHidden: boolean = container.classList.contains('hidden');
			container.classList.toggle('hidden', !isHidden);
			graphqlToggleButton!.textContent = isHidden ? 'Hide' : 'Show';
		});
	}

	submitButton?.addEventListener('click', SubmitJobList);
}

export function ResetMainPopup(): void {
	DisplayUsername();
	RefreshMainView();
}

function DisplayUsername(): void {
	chrome.storage.local.get(['username'], (result: StorageResult) => {
		const usernameDisplay = document.getElementById('usernameDisplay');
		if (usernameDisplay && result.username) {
			usernameDisplay.innerHTML = `<span class="label">Logged in as</span>${result.username}`;
		}
	});
}

function RefreshMainView(): void {
	chrome.storage.local.get(['trackingEnabled'], (result: StorageResult) => {
		const isOn = result.trackingEnabled !== false;
		if (toggle) toggle.checked = isOn;
		UpdateToggleLabel(isOn);
	});

	DisplayJobs();
	if (DEBUG_GRAPHQL_VIEW) {
		DisplayGraphQLResponses();
	}
	
	UpdateSubmitButtonState();
	LogStorageSize();
}

function LogStorageSize(): void {
	chrome.storage.local.get(null, (items: Record<string, unknown>) => {
		const storageSize = JSON.stringify(items).length;
		const storageSizeMB = (storageSize / (1024 * 1024)).toFixed(2);
		console.log(`Chrome Storage Size: ${storageSizeMB} MB (${storageSize} bytes)`);
	});
}

function UpdateToggleLabel(isOn: boolean): void {
	if (!stateText) return;
	const dot = stateText.querySelector('.status-dot');
	if (dot) dot.classList.toggle('active', isOn);
	stateText.childNodes.forEach((node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			node.textContent = isOn ? 'Tracking Active' : 'Tracking Paused';
		}
	});
}

function DisplayJobs(): void {
	if (!jobList) return;
	
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);
		
		if (jobs.length === 0) {
			jobList!.innerHTML = "<p class='no-data-text'>No jobs in your list. Click a handshake job to add one!</p>";
			UpdateSubmitButtonState();
			return;
		}
		
		jobList!.innerHTML = `<h2>Job List (${jobs.length})</h2>`;
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
			deleteButton?.addEventListener("click", (event: MouseEvent) => {
				event.stopPropagation();
				DeleteJob(job.jobId);
			});
			
			container.appendChild(jobItem);
		};
		
		jobList!.appendChild(container);
		UpdateSubmitButtonState();
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

function UpdateSubmitButtonState(): void {
	if (!submitButton) return;
	
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);
		
		if (jobs.length > 0) {
			submitButton!.disabled = false;
			submitButton!.textContent = `Submit ${jobs.length} Job${jobs.length !== 1 ? 's' : ''}`;
		} else {
			submitButton!.disabled = true;
			submitButton!.textContent = "No jobs to submit";
		}
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

/*function ClearAllJobs(): void {
	chrome.storage.local.set({ jobData: {} }, () => {
		DisplayJobs();
	});
}*/