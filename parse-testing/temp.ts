import util from "util";
import fs from "fs";
import readline from "readline";

import type {
  JobSearchResponse,
  HandshakeJobResponse,
  JobDetailsResponse,
  JobSearchEdge,
  JobSearchNode,
} from "./types.ts";

util.inspect.defaultOptions.depth = null;

// ---- CONFIG ----
const filePath = "temp-pretty.txt"; // replace with your JSON or JSONL file
const JOB_LIST: Record<string, any> = {};

function addJobToArray(jobNode: JobSearchResponse) {
  const data = jobNode.data;
  const jobSearch = data.jobSearch;
  const edges = jobSearch.edges;

  const job = jobNode.job;

  JOB_LIST[job.id] = [];
}

function addInitialJobFields(response: JobSearchResponse) {
  const data = response.data;
  const jobSearch = data.jobSearch;
  const edges = jobSearch.edges;

  for (const edge of edges) {
    const node = edge.node;
    const { id, job } = node;
    JOB_LIST[id] = job;
    JOB_LIST[job.id].requiredDocuments = [];
  }
}

function handleJobSearchResults(jobNode: JobSearchResponse) {
  // printJobInfo(jobNode);
  // addJobToArray(jobNode);

  addInitialJobFields(jobNode);
}
