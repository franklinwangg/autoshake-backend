// This script is a fallback for content.ts to store the job info in case it errors

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message?.type !== "storeJob" || !message.jobEntry) {
		return false;
	}

	chrome.storage.local.get("jobList", (result) => {
		const jobList = result.jobList || [];
		const exists = jobList.some((job: any) => job.href === message.jobEntry.href);

		if (!exists) {
			jobList.push(message.jobEntry);
		}

		chrome.storage.local.set({ jobList }, () => {
			sendResponse({ success: true, added: !exists });
		});
	});

	return true;
});