// DOM elements - will be initialized when initializePopup() is called
let toggle: HTMLInputElement | null = null;
let stateText: HTMLElement | null = null;
let jobList: HTMLElement | null = null;
let graphqlToggleButton: HTMLElement | null = null;
let graphqlStats: HTMLElement | null = null;

import { GetRelativeTime, getFieldFromObject, ExtractJobField } from './popupUtils';

function initializePopupDOMElements() {
	toggle = document.getElementById("stateToggle") as HTMLInputElement | null;
	stateText = document.getElementById("trackingLabel");
	jobList = document.getElementById("jobList");
	graphqlToggleButton = document.getElementById("toggleGraphQL");
	graphqlStats = document.getElementById("graphqlStats");
}


function DisplayGraphQLResponses(): void {
  const container: HTMLElement | null = document.getElementById("graphqlResponses");
  if (!container) return;

  chrome.storage.local.get("jobData", (result: any) => {
    const jobData: any = result.jobData || {};
    const responses: any[] = Object.values(jobData)
      .flatMap((job: any) => Array.isArray(job.graphqlResponses) ? job.graphqlResponses : []);

    if (responses.length === 0) {
      container.innerHTML = "<p style='color:#999'>No responses yet</p>";
      return;
    }

    container.innerHTML = "";

    responses.slice().reverse().forEach((r: any, i: number) => {
      const parsed: any = JSON.parse(r.data);
      const operationName: string = parsed?.data 
        ? Object.keys(parsed.data)[0] ?? "unknown"
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

      // Toggle expand/collapse
      const headerElement: Element | null = item.querySelector(".graphql-header");
      headerElement?.addEventListener("click", () => {
        const body: HTMLElement | null = document.getElementById(`body-${i}`);
        const toggle: Element | null = item.querySelector(".graphql-toggle");
        const isHidden: boolean = body?.style.display === "none";
        body.style.display = isHidden ? "block" : "none";
        toggle.textContent = isHidden ? "▼" : "▶";
      });

      container.appendChild(item);
    });
  });
}

function DeleteJob(jobId: string): void {
	chrome.storage.local.get("jobData", (result: any) => {
		const jobData: any = result.jobData || {};
		delete jobData[jobId];
		
		chrome.storage.local.set({ jobData }, () => {
			DisplayJobs(); // Refresh the display
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
	
	chrome.storage.local.get("jobData", (result: any) => {
		const jobData: any = result.jobData || {};
		const jobs: any[] = Object.values(jobData).filter((job: any) => job.clicked);
		
		if (jobs.length === 0) {
			jobList.innerHTML = "<p style='color: #999;'>No jobs in your list. Click a handshake job to add one!</p>";
			return;
		}
		
		jobList.innerHTML = `<h2>Job List (${jobs.length})</h2>`;
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
			
			// Add click handler for the job item (excluding delete button)
			jobItem.addEventListener("click", (e: MouseEvent) => {
				// Don't open tab if delete button was clicked
				if ((e.target as HTMLElement).classList.contains("delete-button")) return;
				
				let fullUrl = job.href;
				if (!job.href.startsWith("http")) {
					fullUrl = "https://app.joinhandshake.com" + (job.href.startsWith("/") ? "" : "/") + job.href;
				}
				chrome.tabs.create({ url: fullUrl });
			});
			
			// Add click handler for delete button
			const deleteButton: HTMLButtonElement | null = jobItem.querySelector(".delete-button");
			deleteButton?.addEventListener("click", (e: MouseEvent) => {
				e.stopPropagation(); // Prevent job item click
				DeleteJob(job.jobId);
			});
			
			container.appendChild(jobItem);
		};
		
		jobList.appendChild(container);
	});
}

// ----------------- Code that runs when popup opens -----------------

// Only initialize if in browser context (not during tests)
// Check that we're not in a test environment by verifying basic DOM elements exist
if (typeof window !== "undefined" && typeof chrome !== "undefined" && typeof chrome.storage !== "undefined" && typeof (globalThis as any).vi === "undefined") {
	// Initialize DOM elements
	initializePopupDOMElements();

	// Only proceed if critical DOM elements exist (not in test environment)
	if (toggle && stateText && jobList) {
		// Initialize toggle state from storage and persist changes
		chrome.storage.local.get(["trackingEnabled"], (result: any) => {
			const enabled: boolean = result.trackingEnabled !== false; // default true
			if (toggle) {
				toggle.checked = enabled;
			}
			UpdateToggleLabel(enabled);

			if (toggle) {
				toggle.addEventListener("change", () => {
					const isOn: boolean = !!toggle.checked;
					chrome.storage.local.set({ trackingEnabled: isOn }, () => {
						UpdateToggleLabel(isOn);
					});
				});
			}
		});

		// Display jobs and GraphQL stats when popup opens
		DisplayJobs();
		DisplayGraphQLResponses();

		graphqlToggleButton?.addEventListener("click", () => {
		  const container: HTMLElement | null = document.getElementById("graphqlResponses");
		  if (!container) return;

		  const isHidden: boolean = container.style.display === "none";
		  container.style.display = isHidden ? "block" : "none";
		  graphqlToggleButton.textContent = isHidden ? "Hide" : "Show";
		});
	}
}