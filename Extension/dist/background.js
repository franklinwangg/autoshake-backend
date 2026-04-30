"use strict";
(() => {
  // background.ts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== "storeJob" || !message.jobEntry) {
      return false;
    }
    chrome.storage.local.get("jobList", (result) => {
      const jobList = result.jobList || [];
      const exists = jobList.some((job) => job.href === message.jobEntry.href);
      if (!exists) {
        jobList.push(message.jobEntry);
      }
      chrome.storage.local.set({ jobList }, () => {
        sendResponse({ success: true, added: !exists });
      });
    });
    return true;
  });
})();
