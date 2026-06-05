import type { JobEntry, StorageResult, JobData, AutoshakeGraphqlMessage, GraphqlResponse, StoreJobResponse } from './types';

const CURRENT_URL: string = window.location.href;
const CURRENT_DOMAIN: string = window.location.hostname;

const TARGET_WEBSITE = "handshake.com";

if (CURRENT_DOMAIN.includes(TARGET_WEBSITE)){
	console.log("[AutoShake] You are on " + TARGET_WEBSITE + "!");

	window.addEventListener("message", (event: MessageEvent<AutoshakeGraphqlMessage>) => {
		if (event.data.type === "AUTOSHAKE_GRAPHQL_RESPONSE") {
			const jobId: string = event.data.jobId;
			const response: GraphqlResponse = event.data.response;
			
			if (!jobId || !response) return;
			
			chrome.storage.local.get("jobData", (result: StorageResult) => {
				const jobData: JobData = result.jobData || {};
				
				if (!jobData[jobId]) {
					jobData[jobId] = { jobId, graphqlResponses: [], clicked: false };
				}
				
				jobData[jobId].graphqlResponses.push(response);
				
				chrome.storage.local.set({ jobData }, () => {
					console.log("[AutoShake] Stored GraphQL response for job ID:", jobId);
				});
			});
		}
	});
}

document.addEventListener("click", (event: MouseEvent) => {
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
		
		if (href.includes("/job-search/") && href.includes("page")) {
			console.log("[AutoShake] Job listing link detected!", href);
			
			const jobIdMatch: RegExpMatchArray | null = href.match(/\/job-search\/(\d+)/);
			const jobId: string | null = jobIdMatch?.[1] ?? null;
			
			if (!jobId) {
				console.warn("[AutoShake] Could not extract job ID from href:", href);
				return;
			}
			
			const jobEntry: JobEntry = {
				jobId,
				href,
				text,
				clickTimestamp: new Date().toISOString(),
			};
			
			if (chrome?.storage?.local) {
				chrome.storage.local.get(["trackingEnabled", "jobData"], (result: StorageResult) => {
					const enabled: boolean = result.trackingEnabled !== false;
					if (!enabled) {
						console.log("[AutoShake] Tracking disabled; ignoring click for job ID:", jobId);
						return;
					}
					const jobData: JobData = result.jobData || {};
					
					if (!jobData[jobId]) {
						jobData[jobId] = { jobId, graphqlResponses: [], clicked: true };
					}
					
					jobData[jobId].href = href;
					jobData[jobId].text = text;
					jobData[jobId].clickTimestamp = jobEntry.clickTimestamp;
					jobData[jobId].clicked = true;
					chrome.storage.local.set({ jobData }, () => {
						console.log("[AutoShake] Job added/updated:", jobEntry);
					});
				});
			}
			else if (chrome?.runtime?.sendMessage) {
				chrome.runtime.sendMessage({ type: "storeJob", jobEntry }, (response?: StoreJobResponse) => {
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
