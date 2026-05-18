"use strict";
(() => {
  // background.ts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "storeJob" || !message.jobEntry) {
      return false;
    }
    const jobId = message.jobEntry.jobId;
    if (!jobId) {
      sendResponse({ success: false, error: "No jobId provided" });
      return true;
    }
    chrome.storage.local.get(["trackingEnabled", "jobData"], (result) => {
      const enabled = result.trackingEnabled !== false;
      if (!enabled) {
        sendResponse({ success: false, error: "tracking_disabled" });
        return true;
      }
      const jobData = result.jobData || {};
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
})();
