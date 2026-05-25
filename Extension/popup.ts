import type { JobRecord, JobData, StorageResult, GraphqlResponse } from './types';
import { GetRelativeTime, GetFieldFromObject, ExtractJobField } from './popupUtils';
import { IsObject } from './inject';

interface ParsedGraphQLData {
	[key: string]: unknown;
}

let toggle: HTMLInputElement | null = null;
let stateText: HTMLElement | null = null;
let jobList: HTMLElement | null = null;
let graphqlToggleButton: HTMLElement | null = null;
let graphqlStats: HTMLElement | null = null;

function InitializePopupDOMElements() {
	toggle = document.getElementById("stateToggle") as HTMLInputElement | null;
	stateText = document.getElementById("trackingLabel");
	jobList = document.getElementById("jobList");
	graphqlToggleButton = document.getElementById("toggleGraphQL");
	graphqlStats = document.getElementById("graphqlStats");
}

function DisplayGraphQLResponses(): void {
  const container: HTMLElement | null = document.getElementById("graphqlResponses");
  if (!container) return;

  chrome.storage.local.get("jobData", (result: StorageResult) => {
    const jobData: JobData = result.jobData || {};
    const responses: GraphqlResponse[] = Object.values(jobData)
      .flatMap((job: JobRecord) => Array.isArray(job.graphqlResponses) ? job.graphqlResponses : []);

    if (responses.length === 0) {
      container.innerHTML = "<p style='color:#999'>No responses yet</p>";
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
        <pre class="graphql-body" id="body-${i}" style="display:none">${JSON.stringify(parsed, null, 2)}</pre>
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
		delete jobData[jobId];
		
		chrome.storage.local.set({ jobData }, () => {
			DisplayJobs();
		});
	});
}

function UpdateToggleLabel(isOn: boolean): void {
	if (stateText) {
		stateText.textContent = `Job Tracking: ${isOn ? "Enabled" : "Disabled"}\n`;
	}
}

function DisplayJobs(): void {
	if (!jobList) return;
	const listEl = jobList;
	
	chrome.storage.local.get("jobData", (result: StorageResult) => {
		const jobData: JobData = result.jobData || {};
		const jobs: JobRecord[] = Object.values(jobData).filter((job: JobRecord) => job.clicked);
		
		if (jobs.length === 0) {
			listEl.innerHTML = "<p style='color: #999;'>No jobs in your list. Click a handshake job to add one!</p>";
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
	});
}

if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof (globalThis as Record<string, unknown>).vi === "undefined") {
	InitializePopupDOMElements();

	if (toggle && stateText && jobList) {
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
		DisplayGraphQLResponses();

		graphqlBtn.addEventListener("click", () => {
		  const container: HTMLElement | null = document.getElementById("graphqlResponses");
		  if (!container) return;

		  const isHidden: boolean = container.style.display === "none";
		  container.style.display = isHidden ? "block" : "none";
		  graphqlBtn.textContent = isHidden ? "Hide" : "Show";
		});
	}
}
