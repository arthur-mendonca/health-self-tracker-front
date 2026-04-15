// ─── Types ───────────────────────────────────────────────────────────────

export type TagCategory = "SYMPTOM" | "INTERFERENCE" | "TRIGGER" | "RESCUE" | "GENERAL";
export type DropTime = "MORNING" | "AFTERNOON" | "EVENING" | "NONE";
export type SubstanceType = "MEDICATION" | "SUPPLEMENT";

export interface TagResponse {
	id: string;
	name: string;
	category: TagCategory;
	createdAt?: string;
}

export interface SubstanceResponse {
	id: string;
	name: string;
	type: SubstanceType;
	defaultDose: string | null;
}

export interface ActivityResponse {
	id: string;
	name: string;
}

export interface DailyRecordResponse {
	id: string;
	date: string;
	metrics: Record<string, unknown> | null;
	structuredNotes: Record<string, unknown> | null;
	tags: Array<{
		id: string;
		name: string;
		category: TagCategory;
	}>;
	substances: Array<{
		id: string;
		substance: SubstanceResponse;
		exactDose: string;
		notes: string | null;
		effectDropTime: DropTime | null;
		experiencedCrash: boolean;
	}>;
	activities: Array<{
		id: string;
		activity: ActivityResponse;
		notes: string | null;
	}>;
	createdAt?: string;
	updatedAt?: string;
}

export interface DailyRecordPayload {
	date?: string;
	metrics?: Record<string, unknown> | null;
	structuredNotes?: Record<string, unknown> | null;
	tags?: Array<{ name: string; category?: TagCategory }>;
	substances?: Array<{
		name: string;
		type: SubstanceType;
		defaultDose?: string | null;
		exactDose: string;
		notes?: string | null;
		effectDropTime?: DropTime | null;
		experiencedCrash?: boolean;
	}>;
	activities?: Array<{ name: string; notes?: string | null }>;
}

// ─── Config ──────────────────────────────────────────────────────────────

const BASE_URL = (() => {
	try {
		return (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || "http://localhost:3000";
	} catch {
		return "http://localhost:3000";
	}
})();

// ─── Token access ────────────────────────────────────────────────────────
// The auth store is the source of truth, but to avoid circular imports the
// HTTP layer reads/writes the token directly from localStorage.

const TOKEN_KEY = "health-tracker-token";

function getToken(): string | null {
	try {
		return localStorage.getItem(TOKEN_KEY);
	} catch {
		return null;
	}
}

function clearToken(): void {
	try {
		localStorage.removeItem(TOKEN_KEY);
	} catch { /* SSR-safe */ }
}

// ─── HTTP Client ─────────────────────────────────────────────────────────

interface FetchOptions extends RequestInit {
	params?: Record<string, string>;
	skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { params, skipAuth, ...fetchOptions } = options;

	let url = `${BASE_URL}${endpoint}`;
	if (params) {
		url += `?${new URLSearchParams(params).toString()}`;
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(fetchOptions.headers as Record<string, string>),
	};

	if (!skipAuth) {
		const token = getToken();
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}
	}

	const response = await fetch(url, { ...fetchOptions, headers });

	// Handle 401 — clear token so the UI redirects to login
	if (response.status === 401) {
		clearToken();
		// Dispatch a storage event so the auth store reacts immediately
		window.dispatchEvent(new StorageEvent("storage", { key: TOKEN_KEY }));
		throw new Error("Unauthorized");
	}

	if (!response.ok) {
		throw new Error(`API Error: ${response.status} ${response.statusText}`);
	}

	// Some endpoints (e.g. GET /records/today with no record) return null as
	// body — handle the case where there is no JSON payload.
	const text = await response.text();
	if (!text) return null as T;
	return JSON.parse(text) as T;
}

export const api = {
	get: <T>(endpoint: string, params?: Record<string, string>) =>
		request<T>(endpoint, { method: "GET", params }),
	post: <T>(endpoint: string, body: unknown, opts?: Partial<FetchOptions>) =>
		request<T>(endpoint, { method: "POST", body: JSON.stringify(body), ...opts }),
};

// ─── Auth ────────────────────────────────────────────────────────────────

/** Login and return the JWT token */
export async function login(email: string, password: string): Promise<string> {
	const res = await api.post<{ token: string }>("/auth/login", { email, password }, { skipAuth: true });
	return res.token;
}

// ─── Tags ────────────────────────────────────────────────────────────────

/** List all tags (sorted by name asc) */
export async function fetchTags(): Promise<TagResponse[]> {
	return api.get<TagResponse[]>("/tags");
}

// ─── Substances ──────────────────────────────────────────────────────────

/** List all substances (sorted by name asc) */
export async function fetchSubstances(): Promise<SubstanceResponse[]> {
	return api.get<SubstanceResponse[]>("/substances");
}

// ─── Activities ──────────────────────────────────────────────────────────

/** List all activities (sorted by name asc) */
export async function fetchActivities(): Promise<ActivityResponse[]> {
	return api.get<ActivityResponse[]>("/activities");
}

// ─── Records ─────────────────────────────────────────────────────────────

/** Fetch today's record (returns null when none exists) */
export async function fetchTodayRecord(): Promise<DailyRecordResponse | null> {
	return api.get<DailyRecordResponse | null>("/records/today");
}

/** Fetch record for a specific date (YYYY-MM-DD). Returns the record or null. */
export async function fetchRecordByDate(date: string): Promise<DailyRecordResponse | null> {
	const records = await api.get<DailyRecordResponse[]>("/records", { date });
	return records.length > 0 ? records[0] : null;
}

/** Submit a daily record (upsert by date) */
export async function submitDailyRecord(payload: DailyRecordPayload): Promise<DailyRecordResponse> {
	return api.post<DailyRecordResponse>("/records", payload);
}

// ─── Export ──────────────────────────────────────────────────────────────

/** Export full data dump as JSON */
export async function exportDumpJSON(): Promise<{ generatedAt: string; records: DailyRecordResponse[] }> {
	return api.get<{ generatedAt: string; records: DailyRecordResponse[] }>("/export/dump");
}

/** Export full data dump as CSV (triggers download) */
export async function exportDumpCSV(): Promise<void> {
	const token = getToken();
	const headers: Record<string, string> = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;

	const response = await fetch(`${BASE_URL}/export/dump.csv`, { headers });
	if (!response.ok) throw new Error(`Export CSV failed: ${response.status}`);

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "health-self-tracker-dump.csv";
	a.click();
	URL.revokeObjectURL(url);
}
