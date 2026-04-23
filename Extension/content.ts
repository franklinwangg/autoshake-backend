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
	const target = event.target as HTMLElement;
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
		if (href.includes("job-search")) {
			console.log("[AutoShake] ✓ Job listing link detected!", href);
		}
	}
});
