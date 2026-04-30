"use strict";
(() => {
  // content.ts
  var currentURL = window.location.href;
  var currentDomain = window.location.hostname;
  var targetWebsite = "handshake.com";
  if (currentDomain.includes(targetWebsite)) {
    console.log("[AutoShake] You are on " + targetWebsite + "!");
    alert("AutoShake is running on this site!");
  }
  document.addEventListener("click", (event) => {
    const target = event.target;
    const link = target.closest("a");
    if (link) {
      const href = link.getAttribute("href") || "";
      const text = link.textContent || "";
      if (href.includes("/job-search/") && href.includes("page")) {
        console.log("[AutoShake] Job listing link detected!", href);
        const jobEntry = {
          href,
          text,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          id: Date.now()
          // unique id
        };
        if (chrome?.storage?.local) {
          chrome.storage.local.get("jobList", (result) => {
            const jobList = result.jobList || [];
            if (!jobList.some((job) => job.href === href)) {
              jobList.push(jobEntry);
              chrome.storage.local.set({ jobList }, () => {
                console.log("[AutoShake] Job added to list:", jobEntry);
              });
            }
          });
        } else if (chrome?.runtime?.sendMessage) {
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
})();
