import type { GraphqlResponse } from './types';
import { IsObject } from './inject';

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
