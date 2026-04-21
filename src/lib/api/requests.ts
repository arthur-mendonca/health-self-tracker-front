import { api, BASE_URL, readResponseBody, createApiError } from './core';

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

// ─── Auth ────────────────────────────────────────────────────────────────

/** Login and session */
export async function login(email: string, password: string): Promise<void> {
	await api.post("/auth/login", { email, password }, { skipAuth: true });
}

export async function logout(): Promise<void> {
	await api.post("/auth/logout", {}, { skipAuth: true });
}

export async function fetchMe(): Promise<{ id: string; email: string } | null> {
	try {
		return await api.get<{ id: string; email: string }>("/auth/me");
	} catch {
		return null;
	}
}

// ─── Tags ────────────────────────────────────────────────────────────────

/** List all tags (sorted by name asc) */
export async function fetchTags(): Promise<TagResponse[]> {
	return api.get<TagResponse[]>("/tags");
}
export async function createTag(payload: { name: string; category?: TagCategory }): Promise<TagResponse> {
	return api.post<TagResponse>("/tags", payload);
}
export async function updateTag(id: string, payload: { name?: string; category?: TagCategory }): Promise<TagResponse> {
	return api.patch<TagResponse>(`/tags/${id}`, payload);
}
export async function deleteTag(id: string): Promise<void> {
	return api.delete<void>(`/tags/${id}`);
}

// ─── Substances ──────────────────────────────────────────────────────────

/** List all substances (sorted by name asc) */
export async function fetchSubstances(): Promise<SubstanceResponse[]> {
	return api.get<SubstanceResponse[]>("/substances");
}
export async function createSubstance(payload: { name: string; type: SubstanceType; defaultDose?: string | null }): Promise<SubstanceResponse> {
	return api.post<SubstanceResponse>("/substances", payload);
}
export async function updateSubstance(id: string, payload: { name?: string; type?: SubstanceType; defaultDose?: string | null }): Promise<SubstanceResponse> {
	return api.patch<SubstanceResponse>(`/substances/${id}`, payload);
}
export async function deleteSubstance(id: string): Promise<void> {
	return api.delete<void>(`/substances/${id}`);
}

// ─── Activities ──────────────────────────────────────────────────────────

/** List all activities (sorted by name asc) */
export async function fetchActivities(): Promise<ActivityResponse[]> {
	return api.get<ActivityResponse[]>("/activities");
}
export async function createActivity(payload: { name: string }): Promise<ActivityResponse> {
	return api.post<ActivityResponse>("/activities", payload);
}
export async function updateActivity(id: string, payload: { name?: string }): Promise<ActivityResponse> {
	return api.patch<ActivityResponse>(`/activities/${id}`, payload);
}
export async function deleteActivity(id: string): Promise<void> {
	return api.delete<void>(`/activities/${id}`);
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

export interface ExportDumpParams {
	startDate?: string;
	endDate?: string;
	days?: number;
}

export type ExportFormat = 'json' | 'csv' | 'txt' | 'pdf';

/** Export data dump in the specified format (triggers download) */
export async function exportDataDump(format: ExportFormat, params: ExportDumpParams = {}): Promise<void> {
	const headers: Record<string, string> = {};

	const searchParams = new URLSearchParams();
	if (params.startDate) searchParams.set("startDate", params.startDate);
	if (params.endDate) searchParams.set("endDate", params.endDate);
	if (params.days !== undefined) searchParams.set("days", params.days.toString());

	const query = searchParams.toString();
	const endpoint = `/export/dump.${format}${query ? `?${query}` : ''}`;
	const url = `${BASE_URL}${endpoint}`;

	const response = await fetch(url, { cache: "no-store", headers, credentials: "include" });
	if (!response.ok) {
		throw createApiError(response, endpoint, await readResponseBody(response));
	}

	const blob = await response.blob();
	const downloadUrl = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = downloadUrl;
	
	// Tenta extrair o filename do header content-disposition se existir
	let filename = `health-self-tracker-dump.${format}`;
	const contentDisposition = response.headers.get('content-disposition');
	if (contentDisposition && contentDisposition.includes('filename=')) {
		const match = contentDisposition.match(/filename="?([^"]+)"?/);
		if (match && match[1]) filename = match[1];
	}

	a.download = filename;
	a.click();
	URL.revokeObjectURL(downloadUrl);
}
