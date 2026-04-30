const currentURL = window.location.href;
const currentDomain = window.location.hostname;

//console.log("[AutoShake] Current Website: " + currentURL);
//console.log("[AutoShake] Domain: " + currentDomain);

const targetWebsite = "handshake.com";

if (currentDomain.includes(targetWebsite)){
	console.log("[AutoShake] You are on " + targetWebsite + "!");
	alert("AutoShake is running on this site!");
}

// Listen for clicks on all links
document.addEventListener("click", (event) => {
	const target: HTMLElement = event.target as HTMLElement;
	const link: HTMLAnchorElement | null = target.closest("a");

	if (link) {
		const href: string = link.getAttribute("href") || "";
		const text: string = link.textContent || "";

		/*console.log("[AutoShake] Link clicked:", {
			href,
			text,
			target: link.target,
			classList: link.className,
		});*/
		
		// Detect job link
		if (href.includes("/job-search/") && href.includes("page")) {
			console.log("[AutoShake] Job listing link detected!", href);
			
			const jobEntry = {
				href,
				text,
				timestamp: new Date().toISOString(),
				id: Date.now() // unique id
			};
			
			if (chrome?.storage?.local) {
				chrome.storage.local.get("jobList", (result) => {
					const jobList = result.jobList || [];
					
					if (!jobList.some((job: any) => job.href === href)) {
						jobList.push(jobEntry);
						chrome.storage.local.set({ jobList }, () => {
							console.log("[AutoShake] Job added to list:", jobEntry);
						});
					}
				});
			}

			//Fallback
			else if (chrome?.runtime?.sendMessage) {
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
