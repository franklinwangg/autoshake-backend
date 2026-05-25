// This script is a fallback for content.ts to store the job info in case it errors

interface JobEntry {
	jobId: string;
	href: string;
	text: string;
	clickTimestamp: string;
}

interface MessageData {
	type: string;
	jobEntry?: JobEntry;
}

interface JobData {
	[jobId: string]: {
		jobId: string;
		graphqlResponses: any[];
		clicked: boolean;
		href?: string;
		text?: string;
		clickTimestamp?: string;
	};
}

interface StorageResult {
	trackingEnabled?: boolean;
	jobData?: JobData;
}

chrome.runtime.onMessage.addListener((message: MessageData, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
	if (message?.type !== "storeJob" || !message.jobEntry) {
		return false;
	}

	const jobId: string = message.jobEntry.jobId;
	if (!jobId) {
		sendResponse({ success: false, error: "No jobId provided" });
		return true;
	}

	chrome.storage.local.get(["trackingEnabled", "jobData"], (result: StorageResult) => {
		const enabled: boolean = result.trackingEnabled !== false; // default true
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