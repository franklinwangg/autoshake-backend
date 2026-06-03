# Test Plan and Report
**Product:** Autoshake AI MVP

## System Test Scenarios

### Scenario 1: GraphQL Parsing
**Given** a GraphQL packet from Handshake containing a `data.job.id` field
**When** the extension receives a GraphQL packet
**Then** it should return the expected job ID string

**Inputs:** Sample GraphQL payload from Handshake with a job id "11054220"
**Expected Output:** `11054220`
**Result:** Passed

### Scenario 2: Popup UI field extraction
**Given** nested GraphQL response objects attached to a job in the list
**When** the popup UI is opened and the utility traverses the object with `GetFieldFromObject`
**Then** it should return nested values when the path exists and `null` when the path is missing or invalid

**Inputs:** GraphQL objects with nested paths, missing fields, incomplete paths, or null values
**Expected Output:** correct nested field value, such as the job's employer, or `null`
**Result:** Passed

## Unit Tests

| Suite | Tests | Passed | Failed |
|-------|-------|--------|--------|
| `tests/inject.test.ts` | 31 | 31 | 0 |
| `tests/popup.test.ts` | 24 | 24 | 0 |

**Total: 55 passed, 0 failed**

## Test Run

Command: `npm run test:run`