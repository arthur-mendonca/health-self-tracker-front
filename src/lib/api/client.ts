import { PUBLIC_API_URL } from "$env/static/public";

const BASE_URL = PUBLIC_API_URL || "http://localhost:3000";

interface FetchOptions extends RequestInit {
	params?: Record<string, string>;
}

async function request<T>(
	endpoint: string,
	options: FetchOptions = {}
): Promise<T> {
	const { params, ...fetchOptions } = options;

	let url = `${BASE_URL}${endpoint}`;
	if (params) {
		const searchParams = new URLSearchParams(params);
		url += `?${searchParams.toString()}`;
	}

	const response = await fetch(url, {
		...fetchOptions,
		headers: {
			"Content-Type": "application/json",
			...fetchOptions.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`API Error: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export const api = {
	get: <T>(endpoint: string, params?: Record<string, string>) =>
		request<T>(endpoint, { method: "GET", params }),

	post: <T>(endpoint: string, body: unknown) =>
		request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),

	put: <T>(endpoint: string, body: unknown) =>
		request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),

	delete: <T>(endpoint: string) =>
		request<T>(endpoint, { method: "DELETE" }),
};

/** Search tags by name (client-side call with debounce) */
export async function searchTags(query: string) {
	return api.get<{ id: string; name: string; category: string }[]>(
		"/tags",
		{ q: query }
	);
}

/** Search substances by name */
export async function searchSubstances(query: string) {
	return api.get<{ id: string; name: string; type: string; defaultDose?: string }[]>(
		"/substances",
		{ q: query }
	);
}

/** Search activities by name */
export async function searchActivities(query: string) {
	return api.get<{ id: string; name: string }[]>(
		"/activities",
		{ q: query }
	);
}

/** Fetch today's record */
export async function fetchTodayRecord() {
	return api.get<DailyRecordResponse | null>("/records/today");
}

/** Submit a daily record (upsert by date) */
export async function submitDailyRecord(payload: DailyRecordPayload) {
	return api.post<DailyRecordResponse>("/records", payload);
}

/** Export data dump */
export async function exportDump(format: "json" | "csv" = "json") {
	return api.get<unknown>("/export/dump", { format });
}

// ─── Types ───────────────────────────────────────────────────────────────
export interface DailyRecordPayload {
	date: string; // ISO date string (YYYY-MM-DD)
	metrics?: Record<string, number>;
	structuredNotes?: Record<string, string>;
	tags: { name: string; category: TagCategory }[];
	substances: {
		name: string;
		type: SubstanceType;
		exactDose: string;
		notes?: string;
		effectDropTime?: DropTime;
		experiencedCrash: boolean;
	}[];
	activities: {
		name: string;
		notes?: string;
	}[];
}

export interface DailyRecordResponse {
	id: string;
	date: string;
	metrics: Record<string, number> | null;
	structuredNotes: Record<string, string> | null;
	tags: { id: string; name: string; category: TagCategory }[];
	substances: {
		id: string;
		substanceId: string;
		substance: { id: string; name: string; type: SubstanceType };
		exactDose: string;
		notes?: string;
		effectDropTime?: DropTime;
		experiencedCrash: boolean;
	}[];
	activities: {
		id: string;
		activityId: string;
		activity: { id: string; name: string };
		notes?: string;
	}[];
}

export type TagCategory =
	| "SYMPTOM"
	| "INTERFERENCE"
	| "TRIGGER"
	| "RESCUE"
	| "GENERAL";

export type DropTime = "MORNING" | "AFTERNOON" | "EVENING" | "NONE";

export type SubstanceType = "MEDICATION" | "SUPPLEMENT";
