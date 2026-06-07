import type { GraphqlResponse, StorageResult } from '../types';

type UnknownRecord = Record<string, unknown>;

export function GetAuthTokenFromStorage(): Promise<string | undefined> {
	return new Promise((resolve) => {
		chrome.storage.local.get(['authToken'], (result: StorageResult) => {
			resolve(result.authToken);
		});
	});
}

export const IsObject = (value: unknown): value is UnknownRecord => value !== null && typeof value === "object";

export const NormalizeId = (value: unknown): string | null => {
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  return null;
};

export const FindJobIdInObject = (obj: unknown): string | null => {
  if (!IsObject(obj)) return null;

  if ("__typename" in obj && obj.__typename === "Job" && "id" in obj) {
    return NormalizeId(obj.id);
  }

  if (IsObject(obj.job) && "id" in obj.job) {
    return NormalizeId(obj.job.id);
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = FindJobIdInObject(item);
      if (found) return found;
    }
    return null;
  }

  for (const key of Object.keys(obj)) {
    const value: unknown = obj[key];

    if (key === "jobId" || key === "job_id" || key === "jobID") {
      const normalized = NormalizeId(value);
      if (normalized) return normalized;
    }

    if (key === "variables" && IsObject(value)) {
      const candidate: unknown = ("jobId" in value ? value.jobId : undefined)
        ?? ("id" in value ? value.id : undefined)
        ?? ("job_id" in value ? value.job_id : undefined)
        ?? ("jobID" in value ? value.jobID : undefined);
      const normalized = NormalizeId(candidate);
      if (normalized) return normalized;
    }

    if (IsObject(value) || Array.isArray(value)) {
      const found = FindJobIdInObject(value);
      if (found) return found;
    }
  }

  return null;
};

export function GetFieldFromObject(obj: unknown, path: string[]): unknown {
	let current: unknown = obj;
	for (const segment of path) {
		if (!current || typeof current !== "object") return null;
		current = (current as Record<string, unknown>)[segment];
	}
	return current ?? null;
}

export function ExtractJobField(responses: GraphqlResponse[], path: string[]): string | null {
	if (!Array.isArray(responses)) return null;

	for (const response of responses) {
		if (!response || typeof response.data !== "string") continue;

		try {
			const parsed: unknown = JSON.parse(response.data);
			if (IsObject(parsed) && "data" in parsed) {
				const candidate: unknown = GetFieldFromObject(parsed.data, path);
				if (typeof candidate === "string" && candidate.trim().length > 0) {
					return candidate;
				}

				if (IsObject(parsed.data)) {
					for (const value of Object.values(parsed.data as Record<string, unknown>)) {
						const nested: unknown = GetFieldFromObject(value, path);
						if (typeof nested === "string" && nested.trim().length > 0) {
							return nested;
						}
					}
				}
			}
		} catch {
			continue;
		}
	}

	return null;
}

const MS_PER_MINUTE = 60000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export function GetRelativeTime(isoString: string): string {
	const now: Date = new Date();
	const past: Date = new Date(isoString);
	const diffMs: number = now.getTime() - past.getTime();
	const diffMins: number = Math.floor(diffMs / MS_PER_MINUTE);
	const diffHours: number = Math.floor(diffMins / MINUTES_PER_HOUR);
	const diffDays: number = Math.floor(diffHours / HOURS_PER_DAY);

	if (diffMins < 1){
		return "just now";
	}
	if (diffMins < MINUTES_PER_HOUR){
		return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
	}
	if (diffHours < HOURS_PER_DAY){
		return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	}
	
	return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
