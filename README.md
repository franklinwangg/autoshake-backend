# Job Application Automater

A set of tools to scrape job listings from Handshake and parse the resulting data.

---

## Programs

### 1. `node-automation/` — Handshake Browser Automation

Opens a Chrome browser, navigates to your Handshake job search page, and intercepts the GraphQL API responses that Handshake's frontend makes in the background. This lets you capture raw job data (titles, employers, locations, salary, required documents, etc.) as you browse.

**What it does:**
- Opens a persistent Chrome session (login is saved between runs)
- If you're not logged in, waits for you to log in manually
- Patches `window.fetch` to intercept all GraphQL responses
- Injects an "I'm Done" button — browse/filter jobs, then click it when finished
- Prints all intercepted responses to the console

### 2. `parse-testing/` — Job Data Parser

Reads a JSON or JSONL file of captured Handshake responses and parses them into structured job records. Outputs a `JOB_LIST` mapping each job ID to its details (title, employer, location, salary, required documents, etc.).

---

## Setup

### Browser Automation

```bash
cd node-automation
npm install
```

Create a `.env` file in `node-automation/` (already present if you cloned this repo):

```
HANDSHAKE_JOBS_URL=https://your-school.joinhandshake.com/job-search
```

### Parser

```bash
cd parse-testing
npm install -g tsx   # if not already installed
```

---

## Running

### Browser Automation

```bash
cd node-automation
npm start
```

A Chrome window will open. Log in if prompted, browse jobs, then click the green **"I'm Done"** button. Intercepted job data will be printed to the console.

### Parser

1. Put your captured JSON data in `parse-testing/temp-pretty.txt`
2. Run:

```bash
cd parse-testing
npx tsx parseJobInfo.ts
```

Results are printed to the console and appended to `parse-results.txt`.
