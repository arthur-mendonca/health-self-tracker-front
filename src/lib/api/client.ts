import { MOCK_TAGS, MOCK_SUBSTANCES, MOCK_ACTIVITIES, MOCK_TODAY_RECORD } from "./mock";

// ─── Mock Mode ───────────────────────────────────────────────────────────
// Set VITE_MOCK_API=true in .env to enable mock mode (no backend required).
const MOCK_MODE =
	typeof import.meta !== "undefined" &&
	(import.meta as unknown as { env?: Record<string, string> }).env?.VITE_MOCK_API === "true";

const BASE_URL = (() => {
	try {
		return (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || "http://localhost:3000";
	} catch {
		return "http://localhost:3000";
	}
})();

// ─── HTTP Client ─────────────────────────────────────────────────────────
interface FetchOptions extends RequestInit {
	params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { params, ...fetchOptions } = options;

	let url = `${BASE_URL}${endpoint}`;
	if (params) {
		url += `?${new URLSearchParams(params).toString()}`;
	}

	const response = await fetch(url, {
		...fetchOptions,
		headers: { "Content-Type": "application/json", ...fetchOptions.headers },
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
	delete: <T>(endpoint: string) => request<T>(endpoint, { method: "DELETE" }),
};

// ─── Helpers ─────────────────────────────────────────────────────────────
function sleep(ms = 120) {
	return new Promise((r) => setTimeout(r, ms));
}

// ─── API Functions (with Mock fallback) ──────────────────────────────────

/** Search tags by name */
export async function searchTags(query: string) {
	if (MOCK_MODE) {
		await sleep();
		const q = query.toLowerCase();
		return q
			? MOCK_TAGS.filter((t) => t.name.toLowerCase().includes(q))
			: MOCK_TAGS;
	}
	return api.get<{ id: string; name: string; category: string }[]>("/tags", { q: query });
}

/** Search substances by name */
export async function searchSubstances(query: string) {
	if (MOCK_MODE) {
		await sleep();
		const q = query.toLowerCase();
		return q
			? MOCK_SUBSTANCES.filter((s) => s.name.toLowerCase().includes(q))
			: MOCK_SUBSTANCES;
	}
	return api.get<{ id: string; name: string; type: string; defaultDose?: string }[]>(
		"/substances",
		{ q: query }
	);
}

/** Search activities by name */
export async function searchActivities(query: string) {
	if (MOCK_MODE) {
		await sleep();
		const q = query.toLowerCase();
		return q
			? MOCK_ACTIVITIES.filter((a) => a.name.toLowerCase().includes(q))
			: MOCK_ACTIVITIES;
	}
	return api.get<{ id: string; name: string }[]>("/activities", { q: query });
}

/** Fetch today's record */
export async function fetchTodayRecord() {
	if (MOCK_MODE) {
		await sleep(300);
		return MOCK_TODAY_RECORD;
	}
	return api.get<DailyRecordResponse | null>("/records/today");
}

/** Submit a daily record (upsert by date) */
export async function submitDailyRecord(payload: DailyRecordPayload) {
	if (MOCK_MODE) {
		await sleep(500);
		console.log("[MOCK] submitDailyRecord payload:", JSON.stringify(payload, null, 2));
		return { ...MOCK_TODAY_RECORD, id: "mock-saved-" + Date.now() } as DailyRecordResponse;
	}
	return api.post<DailyRecordResponse>("/records", payload);
}

/** Export data dump */
export async function exportDump(format: "json" | "csv" = "json") {
	if (MOCK_MODE) {
		await sleep(200);
		return { records: [MOCK_TODAY_RECORD], exportedAt: new Date().toISOString(), format };
	}
	return api.get<unknown>("/export/dump", { format });
}

// ─── Types ───────────────────────────────────────────────────────────────
export interface DailyRecordPayload {
	date: string;
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
	activities: { name: string; notes?: string }[];
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

export type TagCategory = "SYMPTOM" | "INTERFERENCE" | "TRIGGER" | "RESCUE" | "GENERAL";
export type DropTime = "MORNING" | "AFTERNOON" | "EVENING" | "NONE";
export type SubstanceType = "MEDICATION" | "SUPPLEMENT";
