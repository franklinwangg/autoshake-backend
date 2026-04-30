const currentURL = window.location.href;
const currentDomain = window.location.hostname;
//console.log("[AutoShake] Current Website: " + currentURL);
//console.log("[AutoShake] Domain: " + currentDomain);
const targetWebsite = "handshake.com";
if (currentDomain.includes(targetWebsite)) {
    console.log("[AutoShake] You are on " + targetWebsite + "!");
    alert("AutoShake is running on this site!");
}
// Listen for clicks on all links
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
            classList: link.className,
        });
        // Detect job link
        if (href.includes("/job-search/") && href.includes("page")) {
            console.log("[AutoShake] ✓ Job listing link detected!", href);
            // Store the job link
            chrome.storage.local.get("jobList", (result) => {
                const jobList = result.jobList || [];
                const jobEntry = {
                    href,
                    text,
                    timestamp: new Date().toISOString(),
                    id: Date.now() // unique identifier
                };
                // Avoid duplicates
                if (!jobList.some((job) => job.href === href)) {
                    jobList.push(jobEntry);
                    chrome.storage.local.set({ jobList }, () => {
                        console.log("[AutoShake] Job added to list:", jobEntry);
                    });
                }
            });
        }
    }
});
export {};
//# sourceMappingURL=content.js.map