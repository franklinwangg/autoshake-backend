import type { JobRecord, JobData, StorageResult, GraphqlResponse, ParsedGraphqlData, ResumeResult } from '../types';
import { GetRelativeTime, ExtractJobField, IsObject } from './popupUtils';
import { GenerateResume } from '../api';
import { ShowResultsView } from './popup';
import { UpdateGeneratingProgress } from './popupGenerating';

// Compile-time debug flag for GraphQL view
declare const DEBUG_GRAPHQL_VIEW: boolean;

let toggle: HTMLInputElement | null = null;
let stateText: HTMLElement | null = null;
let jobList: HTMLElement | null = null;
let graphqlToggleButton: HTMLElement | null = null;
let submitButton: HTMLButtonElement | null = null;

export function SetupMainPopup(showAuthView: () => void, showResumeView: () => void, showGeneratingView: () => void): void {
	toggle = document.getElementById("stateToggle") as HTMLInputElement | null;
	stateText = document.getElementById("trackingLabel");
	jobList = document.getElementById("jobList");
	if (DEBUG_GRAPHQL_VIEW) {
		graphqlToggleButton = document.getElementById("toggleGraphql");
	}
	submitButton = document.getElementById("submitButton") as HTMLButtonElement | null;

	AttachMainPopupListeners(showAuthView, showResumeView, showGeneratingView);
}

function AttachMainPopupListeners(showAuthView: () => void, showResumeView: () => void, showGeneratingView: () => void): void {
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

	submitButton?.addEventListener('click', () => SubmitJobList(showGeneratingView));

	const logoutButton = document.getElementById('logoutButton');
	logoutButton?.addEventListener('click', () => HandleLogout(showAuthView));

	const updateResumeButton = document.getElementById('updateResumeButton');
	updateResumeButton?.addEventListener('click', showResumeView);
}

export function ResetMainPopup(): void {
	DisplayEmail();
	RefreshMainView();
}

function DisplayEmail(): void {
	chrome.storage.local.get(['email'], (result: StorageResult) => {
		const emailDisplay = document.getElementById('emailDisplay');
		if (emailDisplay && result.email) {
			emailDisplay.innerHTML = `<span class="label">Logged in as</span>${result.email}`;
		}
	});
}

async function HandleLogout(showAuthView: () => void): Promise<void> {
	chrome.storage.local.remove(['authToken', 'email'], () => {
		showAuthView();
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
		DisplayGraphqlResponses();
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

function DisplayGraphqlResponses(): void {
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
		const parsedData: ParsedGraphqlData | null = IsObject(parsed) ? parsed as ParsedGraphqlData : null;
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

function SubmitJobList(showGeneratingView: () => void): void {
	chrome.storage.local.get(["jobData", "authToken", "resumeJson"], (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);

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

function ClearClickedJobs(jobData: JobData, jobs: JobRecord[]): void {
	jobs.forEach((job: JobRecord) => {
		if (jobData[job.jobId]) {
			jobData[job.jobId].clicked = false;
		}
	});
	chrome.storage.local.set({ jobData });
}

async function GenerateResumesForJobs(jobs: JobRecord[], authToken: string, resumeJson: Record<string, unknown>): Promise<void> {
	const totalJobs = jobs.length;
	let completedCount = 0;
	const resumeResults: ResumeResult[] = [];

	UpdateGeneratingProgress(0, totalJobs);

	const promises: Promise<ResumeResult>[] = [];

	for (const job of jobs) {
		const company = ExtractJobField(job.graphqlResponses || [], ["job", "employer", "name"]) || "Unknown Company";
		const title = ExtractJobField(job.graphqlResponses || [], ["job", "title"]) || "Unknown Role";
		const jobDescription = ExtractJobField(job.graphqlResponses || [], ["job", "description"]) || title;

		//console.log(`GenerateResume for "${title}" at "${company}":`, { jobDescription, resumeJson });

		promises.push(
			GenerateResume(authToken, resumeJson, jobDescription)
				.then(async (blob: Blob) => {
					const buffer = await blob.arrayBuffer();
					const bytes = new Uint8Array(buffer);
					// Convert PDF binary to base64: each byte becomes a char, then btoa encodes
					let binary = '';
					for (let i = 0; i < bytes.byteLength; i++) {
						binary += String.fromCharCode(bytes[i]);
					}
					const pdfBase64 = btoa(binary);

					completedCount++;
					UpdateGeneratingProgress(completedCount, totalJobs);

					return { jobId: job.jobId, company, title, href: job.href, success: true, pdfBase64 } as ResumeResult;
				})
				.catch(() => {
					completedCount++;
					UpdateGeneratingProgress(completedCount, totalJobs);

					return { jobId: job.jobId, company, title, href: job.href, success: false } as ResumeResult;
				})
		);
	}

	const outcomes = await Promise.allSettled(promises);

	for (const outcome of outcomes) {
		const fulfilled = outcome as PromiseFulfilledResult<ResumeResult>;
		resumeResults.push(fulfilled.value);
	}

	chrome.storage.local.set({ resumeResults }, () => {
		ShowResultsView();
	});
}

/*function ClearAllJobs(): void {
	chrome.storage.local.set({ jobData: {} }, () => {
		DisplayJobs();
	});
}*/