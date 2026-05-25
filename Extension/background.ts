import type { StoreJobMessage, StorageResult, JobData } from './types';

chrome.runtime.onMessage.addListener((message: StoreJobMessage, _sender: chrome.runtime.MessageSender, sendResponse: (response?: { success: boolean; error?: string }) => void) => {
	if (message?.type !== "storeJob" || !message.jobEntry) {
		return false;
	}

	const jobId: string = message.jobEntry.jobId;
	if (!jobId) {
		sendResponse({ success: false, error: "No jobId provided" });
		return true;
	}

	chrome.storage.local.get(["trackingEnabled", "jobData"], (result: StorageResult) => {
		const enabled: boolean = result.trackingEnabled !== false;
		if (!enabled) {
			sendResponse({ success: false, error: "tracking_disabled" });
			return true;
		}

		const jobData: JobData = result.jobData || {};
        
		if (!jobData[jobId]) {
			jobData[jobId] = { jobId, graphqlResponses: [], clicked: true };
		}
        
		jobData[jobId].href = message.jobEntry.href;
		jobData[jobId].text = message.jobEntry.text;
		jobData[jobId].clickTimestamp = message.jobEntry.clickTimestamp;
		jobData[jobId].clicked = true;

		chrome.storage.local.set({ jobData }, () => {
			sendResponse({ success: true });
		});
	});

	return true;
});
