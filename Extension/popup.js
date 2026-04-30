const toggle = document.getElementById("stateToggle");
const stateText = document.getElementById("toggleLabel");
const jobList = document.getElementById("jobList");
function updateToggleLabel(isOn) {
    if (stateText) {
        stateText.textContent = `State: ${isOn ? "On" : "Off"}`;
    }
    else {
        throw new Error("No state text found in html!");
    }
}
function displayJobs() {
    if (!jobList)
        return;
    chrome.storage.local.get("jobList", (result) => {
        const jobs = result.jobList || [];
        if (jobs.length === 0) {
            jobList.innerHTML = "<p style='color: #999;'>No jobs detected yet</p>";
            return;
        }
        jobList.innerHTML = `<h2>Detected Jobs (${jobs.length})</h2>`;
        const ul = document.createElement("ul");
        jobs.forEach((job) => {
            const li = document.createElement("li");
            li.style.marginBottom = "10px";
            li.style.padding = "8px";
            li.style.backgroundColor = "#f0f0f0";
            li.style.borderRadius = "4px";
            const timestamp = new Date(job.timestamp).toLocaleString();
            li.innerHTML = `
				<strong>${job.text || "Job Link"}</strong>
				<br><small>Found: ${timestamp}</small>
				<br><small style="color: #666; word-break: break-all;">${job.href}</small>
			`;
            ul.appendChild(li);
        });
        jobList.appendChild(ul);
    });
}
if (toggle) {
    updateToggleLabel(toggle.checked);
    toggle.addEventListener("change", () => {
        updateToggleLabel(toggle.checked);
    });
}
else {
    throw new Error("No toggle found in html!");
}
// Display jobs when popup opens
displayJobs();
export {};
//# sourceMappingURL=popup.js.map