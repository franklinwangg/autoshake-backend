"use strict";
(() => {
  // popup.ts
  var toggle = document.getElementById("stateToggle");
  var stateText = document.getElementById("toggleLabel");
  var jobList = document.getElementById("jobList");
  var graphqlStats = document.getElementById("graphqlStats");
  function GetRelativeTime(isoString) {
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
  function DisplayGraphQLResponses() {
    const container = document.getElementById("graphqlResponses");
    if (!container) return;
    chrome.storage.local.get("graphqlResponses", (result) => {
      const responses = result.graphqlResponses || [];
      if (responses.length === 0) {
        container.innerHTML = "<p style='color:#999'>No responses yet</p>";
        return;
      }
      container.innerHTML = "";
      responses.slice().reverse().forEach((r, i) => {
        const parsed = JSON.parse(r.data);
        const operationName = parsed?.data ? Object.keys(parsed.data)[0] : "unknown";
        const item = document.createElement("div");
        item.className = "graphql-item";
        item.innerHTML = `
        <div class="graphql-header" data-index="${i}">
          <span class="graphql-op">${operationName}</span>
          <span class="graphql-time">${GetRelativeTime(r.timestamp)}</span>
          <span class="graphql-toggle">\u25B6</span>
        </div>
        <pre class="graphql-body" id="body-${i}" style="display:none">${JSON.stringify(parsed, null, 2)}</pre>
      `;
        item.querySelector(".graphql-header").addEventListener("click", () => {
          const body = document.getElementById(`body-${i}`);
          const toggle2 = item.querySelector(".graphql-toggle");
          const isHidden = body.style.display === "none";
          body.style.display = isHidden ? "block" : "none";
          toggle2.textContent = isHidden ? "\u25BC" : "\u25B6";
        });
        container.appendChild(item);
      });
    });
  }
  function DeleteJob(jobId) {
    chrome.storage.local.get("jobList", (result) => {
      const jobList2 = result.jobList || [];
      const updatedList = jobList2.filter((job) => job.id !== jobId);
      chrome.storage.local.set({ jobList: updatedList }, () => {
        DisplayJobs();
      });
    });
  }
  function UpdateToggleLabel(isOn) {
    if (stateText) {
      stateText.textContent = `State: ${isOn ? "On" : "Off"}`;
    } else {
      throw new Error("No state text found in html!");
    }
  }
  function DisplayJobs() {
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
        const relativeTime = GetRelativeTime(job.timestamp);
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
          DeleteJob(job.id);
        });
        container.appendChild(jobItem);
      }
      ;
      jobList.appendChild(container);
    });
  }
  if (toggle) {
    UpdateToggleLabel(toggle.checked);
    toggle.addEventListener("change", () => {
      UpdateToggleLabel(toggle.checked);
    });
  } else {
    throw new Error("No toggle found in html!");
  }
  DisplayJobs();
  DisplayGraphQLResponses();
  document.getElementById("clearGraphQL")?.addEventListener("click", () => {
    chrome.storage.local.remove(["graphqlResponses", "exportedAt"], () => {
      DisplayGraphQLResponses();
    });
  });
})();
