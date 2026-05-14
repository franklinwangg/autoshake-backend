const toggle: HTMLInputElement | null = document.getElementById("stateToggle") as HTMLInputElement | null;
const stateText: HTMLElement | null = document.getElementById("toggleLabel");
const jobList: HTMLElement | null = document.getElementById("jobList");
const graphqlStats: HTMLElement | null = document.getElementById("graphqlStats");

// Helper function to calculate relative time (e.g., "5 minutes ago")
function GetRelativeTime(isoString: string): string {
	const now: Date = new Date();
	const past: Date = new Date(isoString);
	const diffMs: number = now.getTime() - past.getTime();
	const diffMins: number = Math.floor(diffMs / 60000);
	const diffHours: number = Math.floor(diffMins / 60);
	const diffDays: number = Math.floor(diffHours / 24);

	if (diffMins < 1){
		return "just now";
	}
	if (diffMins < 60){
		return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
	}
	if (diffHours < 24){
		return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	}
	
	return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

function DisplayGraphQLResponses() {
  const container = document.getElementById("graphqlResponses");
  if (!container) return;

  chrome.storage.local.get("graphqlResponses", (result) => {
    const responses = result.graphqlResponses || [];
    
    if (responses.length === 0) {
      container.innerHTML = "<p style='color:#999'>No responses yet</p>";
      return;
    }

    container.innerHTML = "";

    responses.slice().reverse().forEach((r: any, i: number) => {
      const parsed = JSON.parse(r.data);
      const operationName = parsed?.data 
        ? Object.keys(parsed.data)[0] 
        : "unknown";

      const item = document.createElement("div");
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
      item.querySelector(".graphql-header")!.addEventListener("click", () => {
        const body = document.getElementById(`body-${i}`)!;
        const toggle = item.querySelector(".graphql-toggle")!;
        const isHidden = body.style.display === "none";
        body.style.display = isHidden ? "block" : "none";
        toggle.textContent = isHidden ? "▼" : "▶";
      });

      container.appendChild(item);
    });
  });
}

function DeleteJob(jobId: number) {
	chrome.storage.local.get("jobList", (result) => {
		const jobList = result.jobList || [];
		const updatedList = jobList.filter((job: any) => job.id !== jobId);
		
		chrome.storage.local.set({ jobList: updatedList }, () => {
			DisplayJobs(); // Refresh the display
		});
	});
}

function UpdateToggleLabel(isOn: boolean) {
	if (stateText) {
		stateText.textContent = `State: ${isOn ? "On" : "Off"}`;
	}
	else {
		throw new Error("No state text found in html!");
	}
}

function DisplayJobs() {
	if (!jobList) return;
	
	chrome.storage.local.get("jobList", (result) => {
		const jobs = result.jobList || [];
		
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
			
			const relativeTime: string = GetRelativeTime(job.timestamp);
			jobItem.innerHTML = `
				<div class="job-title">${job.text || "Job ID #" + (Math.floor(job.id/1000) - 1777000000)}</div>
				<div class="job-meta">${relativeTime}</div>
				<button class="delete-button" data-job-id="${job.id}">×</button>
			`;
			
			// Add click handler for the job item (excluding delete button)
			jobItem.addEventListener("click", (e) => {
				// Don't open tab if delete button was clicked
				if ((e.target as HTMLElement).classList.contains("delete-button")) return;
				
				let fullUrl = job.href;
				if (!job.href.startsWith("http")) {
					fullUrl = "https://app.joinhandshake.com" + (job.href.startsWith("/") ? "" : "/") + job.href;
				}
				chrome.tabs.create({ url: fullUrl });
			});
			
			// Add click handler for delete button
			const deleteButton = jobItem.querySelector(".delete-button") as HTMLButtonElement;
			deleteButton.addEventListener("click", (e) => {
				e.stopPropagation(); // Prevent job item click
				DeleteJob(job.id);
			});
			
			container.appendChild(jobItem);
		};
		
		jobList.appendChild(container);
	});
}

// ----------------- Code that runs when popup opens -----------------

if (toggle) {
	UpdateToggleLabel(toggle.checked);
	toggle.addEventListener("change", () => {
		UpdateToggleLabel(toggle.checked);
	});
}
else {
	throw new Error("No toggle found in html!");
}

// Display jobs and GraphQL stats when popup opens
DisplayJobs();
DisplayGraphQLResponses();

document.getElementById("clearGraphQL")?.addEventListener("click", () => {
  chrome.storage.local.remove(["graphqlResponses", "exportedAt"], () => {
    DisplayGraphQLResponses();
  });
});