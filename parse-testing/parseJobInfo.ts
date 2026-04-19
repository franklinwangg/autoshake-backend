import util from "util";
import fs from "fs";
import readline from "readline";

import type {
  JobSearchResponse,
  HandshakeJobResponse,
  JobDetailsResponse,
} from "./types.ts";

util.inspect.defaultOptions.depth = null;

// ---- CONFIG ----
const filePath = "temp-pretty.txt"; // replace with your JSON or JSONL file
const JOB_LIST: Record<string, any[]> = {};

// ---- HELPER FUNCTION ----
function printDocumentTypes(job: any) {
  const jobId = job?.id || "Unknown";
  const requiredDocumentTypes = job?.requiredDocumentTypes || "Unknown";
  console.log("Job ID : ", jobId);

  console.log("Required Documents:");

  requiredDocumentTypes.forEach((doc: any) => {
    const name = doc?.name || "Unknown";
    const behavior = doc?.behaviorIdentifier || "Unknown";
    const id = doc?.id || "Unknown";

    console.log(`  • ${name} (id: ${id}, behavior: ${behavior})`);
  });
}

function printJobInfo(jobNode: any) {
  if (!jobNode?.job) return;

  const job = jobNode.job;
  const employer = job.employer;
  const locations = job.locations || [];
  const salaryRange = job.salaryRange;

  console.log("====== JOB INFO ======");
  console.log("Job ID:", job.id);
  console.log("Title:", job.title);
  console.log("Job Type:", job.jobType?.name);
  console.log("Employment Type:", job.employmentType?.name);
  console.log("Duration:", job.duration);
  console.log("Remote:", job.remote);
  console.log("On-site:", job.onSite);
  console.log("Hybrid:", job.hybrid);
  console.log("Work Location Type:", job.workLocationType);
  console.log("Apply Start:", job.applyStart);
  console.log("Employer:", employer?.name);
  console.log("Employer ID:", employer?.id);

  if (locations.length > 0) {
    console.log("Locations:");
    locations.forEach((loc: any, i: any) => {
      console.log(`  [${i + 1}] ${loc.city}, ${loc.state}, ${loc.country}`);
    });
  }

  if (salaryRange) {
    console.log(
      "Salary Range:",
      `${salaryRange.min / 100} - ${salaryRange.max / 100} ${
        salaryRange.currency
      } (${salaryRange.paySchedule?.friendlyName})`
    );
  }

  console.log("Additional Benefits:", job.additionalBenefitsLink || "N/A");
  console.log("=================================\n");
}

function addJobToArray(jobNode: JobSearchResponse) {
  // export interface JobSearchResponse {
  //   data: {
  //     jobSearch: JobSearch;
  //   };
  // }

  const data = jobNode.data;
  const jobSearch = data.jobSearch;
  const edges = jobSearch.edges;

  // const firstEdge = edges[0];
  // const node = firstEdge.node;

  const job = jobNode.job;

  JOB_LIST[job.id] = [];
}

function setJobValueInList(response: JobDetailsResponse) {
  const data = response.data;
  const job = data.job;
  const jobId = job.id;
  const requiredDocumentTypes = job.requiredDocumentTypes;

  requiredDocumentTypes.forEach((doc: any) => {
    const name = doc?.name || "Unknown";
    const behavior = doc?.behaviorIdentifier || "Unknown";

    (JOB_LIST[jobId] ??= []).push({ name, behavior });
  });

  // JOB_LIST[jobId] =
}

function addInitialJobFields(jobNode: JobSearchResponse) {
  const job = jobNode.job;
  const employer = job.employer;
  const locations = job.locations || [];
  const salaryRange = job.salaryRange;

  const jobInformation = {
    jobId: job.id,
    title: job.title,
    jobType: job.jobType?.name || null,
    employmentType: job.employmentType?.name || null,
    duration: job.duration || null,
    remote: job.remote || false,
    onSite: job.onSite || false,
    hybrid: job.hybrid || false,
    workLocationType: job.workLocationType || null,
    applyStart: job.applyStart || null,
    employerName: employer?.name || null,
    employerId: employer?.id || null,
    locations: locations.map((loc: any) => ({
      city: loc.city,
      state: loc.state,
      country: loc.country,
      address: loc.name || null,
    })),
    salaryRange: salaryRange
      ? {
          min: salaryRange.min / 100,
          max: salaryRange.max / 100,
          currency: salaryRange.currency,
          paySchedule: salaryRange.paySchedule?.friendlyName || null,
        }
      : null,
    additionalBenefits: job.additionalBenefitsLink || null,
    requiredDocuments: [], // populate later if needed
  };

  // Example: store this in JOB_LIST keyed by job ID
  JOB_LIST[job.id] = jobInformation;

  // If you also want to store required documents as an array
  JOB_LIST[job.id].requiredDocuments = [];
}

function handleJobSearchResults(jobNode: JobSearchResponse) {
  // printJobInfo(jobNode);
  addInitialJobFields(jobNode);
  addJobToArray(jobNode);
}






function handleGetExtendedJobDetails(job: JobDetailsResponse) {
  // printDocumentTypes(job);
  setJobValueInList(job);
}


// ---- PROCESS JSONL FILE ----
if (filePath.endsWith(".jsonl")) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  rl.on("line", (line: any, index: any) => {
    try {
      const obj = JSON.parse(line);
      if (obj?.data?.jobSearch?.edges) {
        obj.data.jobSearch.edges.forEach((edge: any) =>
          printJobInfo(edge.node)
        );
      }
    } catch (err) {
      // ignore invalid lines
    }
  });
} else {
  // JSON file
  const content = fs.readFileSync(filePath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    process.exit(1);
  }

  const output = fs.createWriteStream("parse-results.txt", { flags: "a" });
  function log(...args: any) {
    output.write(args.map((a: any) => util.format(a)).join(" ") + "\n");
  }

  log("parsed:", parsed);

  parsed.forEach((obj: any) => {
    const data = obj?.data;

    // CASE 1: Job Search Results response
    if (data?.jobSearch?.edges) {
      data.jobSearch.edges.forEach((edge: any) => {
        handleJobSearchResults(edge.node); // node = job summary
      });
    }

    // CASE 2: Job Detail response (requiredDocumentTypes lives here)
    if (data?.job?.requiredDocumentTypes) {
      // printDocumentTypes(data.job);
      handleGetExtendedJobDetails(data.job);
    }
  });

  console.log(JOB_LIST);
}
