// Helper function to calculate relative time (e.g., "5 minutes ago")
export function GetRelativeTime(isoString: string): string {
	const now: Date = new Date();
	const past: Date = new Date(isoString);
	const diffMs: number = now.getTime() - past.getTime();
	const diffMins: number = Math.floor(diffMs / 60000);
	const diffHours: number = Math.floor(diffMins / 60);
	const diffDays: number = Math.floor(diffHours / 24);

	if (diffMins < 1){
		return "just now";
	}
	if (diffMins < 60){
		return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
	}
	if (diffHours < 24){
		return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	}
	
	return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

export function getFieldFromObject(obj: any, path: string[]): any {
	let current: any = obj;
	for (const segment of path) {
		if (!current || typeof current !== "object") return null;
		current = current[segment];
	}
	return current ?? null;
}

export function ExtractJobField(responses: any[], path: string[]): string | null {
	if (!Array.isArray(responses)) return null;

	for (const response of responses) {
		if (!response || typeof response.data !== "string") continue;

		try {
			const parsed: any = JSON.parse(response.data);
			const candidate: any = getFieldFromObject(parsed?.data, path);
			if (typeof candidate === "string" && candidate.trim().length > 0) {
				return candidate;
			}

			if (parsed?.data && typeof parsed.data === "object") {
				for (const value of Object.values(parsed.data)) {
					const nested: any = getFieldFromObject(value, path);
					if (typeof nested === "string" && nested.trim().length > 0) {
						return nested;
					}
				}
			}
		} catch {
			continue;
		}
	}

	return null;
}
