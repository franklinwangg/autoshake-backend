const currentURL = window.location.href;
const currentDomain = window.location.hostname;

const targetWebsite = "handshake.com";

if (currentDomain.includes(targetWebsite)){
	console.log("[AutoShake] You are on " + targetWebsite + "!");

	// Listen for GraphQL responses from injected script
	window.addEventListener("message", (event) => {
		if (event.data.type === "AUTOSHAKE_GRAPHQL_RESPONSE") {
			const jobId = event.data.jobId;
			const response = event.data.response;
			
			if (!jobId || !response) return;
			
			// Get existing jobData from storage
			chrome.storage.local.get("jobData", (result) => {
				const jobData = result.jobData || {};
				
				// Initialize job entry if it doesn't exist
				if (!jobData[jobId]) {
					jobData[jobId] = { jobId, graphqlResponses: [], clicked: false };
				}
				
				// Add response to the array
				jobData[jobId].graphqlResponses.push(response);
				
				chrome.storage.local.set({ jobData }, () => {
					console.log("[AutoShake] Stored GraphQL response for job ID:", jobId);
				});
			});
		}
	});
}

// Listen for clicks on all links
document.addEventListener("click", (event) => {
	const target: HTMLElement = event.target as HTMLElement;
	const link: HTMLAnchorElement | null = target.closest("a");

	if (link) {
		const href: string = link.getAttribute("href") || "";
		const text: string = link.textContent || "";

		console.log("[AutoShake] Link clicked:", {
			href,
			text,
			target: link.target,
			classList: link.className,
		});
		
		// Detect job link
		if (href.includes("/job-search/") && href.includes("page")) {
			console.log("[AutoShake] Job listing link detected!", href);
			
			// Extract job ID from href like "/job-search/10995461?page=1"
			const jobIdMatch = href.match(/\/job-search\/(\d+)/);
			const jobId = jobIdMatch ? jobIdMatch[1] : null;
			
			if (!jobId) {
				console.warn("[AutoShake] Could not extract job ID from href:", href);
				return;
			}
			
			const jobEntry = {
				jobId,
				href,
				text,
				clickTimestamp: new Date().toISOString(),
			};
			
			// Store in jobData indexed by jobId
			if (chrome?.storage?.local) {
				chrome.storage.local.get(["trackingEnabled", "jobData"], (result) => {
					const enabled = result.trackingEnabled !== false; // default true
					if (!enabled) {
						console.log("[AutoShake] Tracking disabled; ignoring click for job ID:", jobId);
						return;
					}
					const jobData = result.jobData || {};
					
					// Initialize or update job entry
					if (!jobData[jobId]) {
						jobData[jobId] = { jobId, graphqlResponses: [], clicked: true };
					}
					
					// Update click metadata and mark this job as clicked
					jobData[jobId].href = href;
					jobData[jobId].text = text;
					jobData[jobId].clickTimestamp = jobEntry.clickTimestamp;
					jobData[jobId].clicked = true;
					chrome.storage.local.set({ jobData }, () => {
						console.log("[AutoShake] Job added/updated:", jobEntry);
					});
				});
			}
			//Fallback
			else if (chrome?.runtime?.sendMessage) {
				chrome.runtime.sendMessage({ type: "storeJob", jobEntry }, (response) => {
					if (response?.success) {
						console.log("[AutoShake] Job stored via background service worker", jobEntry);
					} else {
						console.warn("[AutoShake] Failed to store job via background worker", response);
					}
				});
			} else {
				console.warn("[AutoShake] chrome.storage.local unavailable and no runtime fallback available");
			}
		}
	}
});

console.log("[AutoShake] Content script loaded - monitoring Handshake jobs");
