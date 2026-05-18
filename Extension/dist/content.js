"use strict";
(() => {
  // content.ts
  var currentURL = window.location.href;
  var currentDomain = window.location.hostname;
  var targetWebsite = "handshake.com";
  if (currentDomain.includes(targetWebsite)) {
    console.log("[AutoShake] You are on " + targetWebsite + "!");
    window.addEventListener("message", (event) => {
      if (event.data.type === "AUTOSHAKE_GRAPHQL_RESPONSE") {
        const jobId = event.data.jobId;
        const response = event.data.response;
        if (!jobId || !response) return;
        chrome.storage.local.get("jobData", (result) => {
          const jobData = result.jobData || {};
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
  document.addEventListener("click", (event) => {
    const target = event.target;
    const link = target.closest("a");
    if (link) {
      const href = link.getAttribute("href") || "";
      const text = link.textContent || "";
      console.log("[AutoShake] Link clicked:", {
        href,
        text,
        target: link.target,
        classList: link.className
      });
      if (href.includes("/job-search/") && href.includes("page")) {
        console.log("[AutoShake] Job listing link detected!", href);
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
          clickTimestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (chrome?.storage?.local) {
          chrome.storage.local.get(["trackingEnabled", "jobData"], (result) => {
            const enabled = result.trackingEnabled !== false;
            if (!enabled) {
              console.log("[AutoShake] Tracking disabled; ignoring click for job ID:", jobId);
              return;
            }
            const jobData = result.jobData || {};
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
  console.log("[AutoShake] Content script loaded - monitoring Handshake jobs");
})();
