"use strict";
(() => {
  // popup.ts
  var toggle = document.getElementById("stateToggle");
  var stateText = document.getElementById("toggleLabel");
  var jobList = document.getElementById("jobList");
  function getRelativeTime(isoString) {
    const now = /* @__PURE__ */ new Date();
    const past = new Date(isoString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) {
      return "just now";
    }
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    }
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }
  function deleteJob(jobId) {
    chrome.storage.local.get("jobList", (result) => {
      const jobList2 = result.jobList || [];
      const updatedList = jobList2.filter((job) => job.id !== jobId);
      chrome.storage.local.set({ jobList: updatedList }, () => {
        displayJobs();
      });
    });
  }
  function updateToggleLabel(isOn) {
    if (stateText) {
      stateText.textContent = `State: ${isOn ? "On" : "Off"}`;
    } else {
      throw new Error("No state text found in html!");
    }
  }
  function displayJobs() {
    if (!jobList) return;
    chrome.storage.local.get("jobList", (result) => {
      const jobs = result.jobList || [];
      if (jobs.length === 0) {
        jobList.innerHTML = "<p style='color: #999;'>No jobs in your list. Click a handshake job to add one!</p>";
        return;
      }
      jobList.innerHTML = `<h2>Job List (${jobs.length})</h2>`;
      const container = document.createElement("div");
      container.className = "jobs-container";
      for (const job of jobs) {
        const jobItem = document.createElement("div");
        jobItem.className = "job-item";
        const relativeTime = getRelativeTime(job.timestamp);
        jobItem.innerHTML = `
				<div class="job-title">${job.text || "Job ID #" + (Math.floor(job.id / 1e3) - 1777e6)}</div>
				<div class="job-meta">${relativeTime}</div>
				<button class="delete-button" data-job-id="${job.id}">\xD7</button>
			`;
        jobItem.addEventListener("click", (e) => {
          if (e.target.classList.contains("delete-button")) return;
          let fullUrl = job.href;
          if (!job.href.startsWith("http")) {
            fullUrl = "https://app.joinhandshake.com" + (job.href.startsWith("/") ? "" : "/") + job.href;
          }
          chrome.tabs.create({ url: fullUrl });
        });
        const deleteButton = jobItem.querySelector(".delete-button");
        deleteButton.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteJob(job.id);
        });
        container.appendChild(jobItem);
      }
      ;
      jobList.appendChild(container);
    });
  }
  if (toggle) {
    updateToggleLabel(toggle.checked);
    toggle.addEventListener("change", () => {
      updateToggleLabel(toggle.checked);
    });
  } else {
    throw new Error("No toggle found in html!");
  }
  displayJobs();
})();
