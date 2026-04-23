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
      console.log("[AutoShake] Link clicked:", {
        href,
        text,
        target: link.target,
        classList: link.className
      });
      if (href.includes("job-search")) {
        console.log("[AutoShake] \u2713 Job listing link detected!", href);
      }
    }
  });
})();
