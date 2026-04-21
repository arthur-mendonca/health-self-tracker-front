import { env } from '$env/dynamic/public';

// ─── Config ──────────────────────────────────────────────────────────────

export const BASE_URL = (() => {
	try {
		return env.PUBLIC_API_URL || "http://localhost:3000";
	} catch {
		return "http://localhost:3000";
	}
})();

// ─── Token access ────────────────────────────────────────────────────────
// The auth store is the source of truth, but to avoid circular imports the
// HTTP layer reads/writes the token directly from localStorage.

const AUTH_STATUS_KEY = "health-tracker-auth-status";

export function getAuthStatus(): boolean {
	try {
		return localStorage.getItem(AUTH_STATUS_KEY) === "true";
	} catch {
		return false;
	}
}

export function clearAuthStatus(): void {
	try {
		localStorage.removeItem(AUTH_STATUS_KEY);
	} catch { /* SSR-safe */ }
}

// ─── HTTP Client ─────────────────────────────────────────────────────────

export interface FetchOptions extends RequestInit {
	params?: Record<string, string>;
	skipAuth?: boolean;
}

export type ApiErrorBody = {
	error?: string;
	message?: string | string[];
	requestId?: string;
	statusCode?: number;
};

export class ApiError extends Error {
	readonly endpoint: string;
	readonly requestId?: string;
	readonly status: number;
	readonly statusText: string;

	constructor(args: {
		endpoint: string;
		message: string;
		requestId?: string;
		status: number;
		statusText: string;
	}) {
		super(args.message);
		this.name = "ApiError";
		this.endpoint = args.endpoint;
		this.requestId = args.requestId;
		this.status = args.status;
		this.statusText = args.statusText;
	}
}

export async function readResponseBody(response: Response): Promise<{ json?: ApiErrorBody | unknown; text: string }> {
	const text = await response.text();

	if (!text) {
		return { text };
	}

	try {
		return { json: JSON.parse(text) as ApiErrorBody | unknown, text };
	} catch {
		return { text };
	}
}

export function normalizeApiMessage(message: string | string[] | undefined): string | null {
	if (Array.isArray(message)) {
		return message.join("; ");
	}

	return message?.trim() || null;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
	return typeof value === "object" && value !== null;
}

export function createApiError(
	response: Response,
	endpoint: string,
	body: { json?: ApiErrorBody | unknown; text: string },
): ApiError {
	const apiBody = isApiErrorBody(body.json) ? body.json : undefined;
	const apiMessage = normalizeApiMessage(apiBody?.message) || body.text || response.statusText;
	const requestId = apiBody?.requestId ?? response.headers.get("x-request-id") ?? undefined;
	const suffix = requestId ? ` (requestId: ${requestId})` : "";
	const message = `API ${response.status} ${response.statusText} em ${endpoint}: ${apiMessage}${suffix}`;

	return new ApiError({
		endpoint,
		message,
		requestId,
		status: response.status,
		statusText: response.statusText,
	});
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { params, skipAuth: _skipAuth, ...fetchOptions } = options;
	void _skipAuth;

	let endpointWithQuery = endpoint;
	let url = `${BASE_URL}${endpoint}`;
	if (params) {
		const query = new URLSearchParams(params).toString();
		endpointWithQuery += `?${query}`;
		url += `?${query}`;
	}

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(fetchOptions.headers as Record<string, string>),
	};

	const response = await fetch(url, { 
		...fetchOptions, 
		headers,
		cache: "no-store",
		credentials: "include" 
	});
	const responseBody = await readResponseBody(response);

	// Handle 401 — clear auth status so the UI redirects to login
	if (response.status === 401) {
		clearAuthStatus();
		// Dispatch a storage event so the auth store reacts immediately
		if (typeof window !== "undefined") {
			window.dispatchEvent(new StorageEvent("storage", { key: AUTH_STATUS_KEY }));
		}
		throw createApiError(response, endpointWithQuery, responseBody);
	}

	if (!response.ok) {
		throw createApiError(response, endpointWithQuery, responseBody);
	}

	// Some endpoints (e.g. GET /records/today with no record) return null as
	// body — handle the case where there is no JSON payload.
	if (!responseBody.text) return null as T;
	return responseBody.json as T;
}

export const api = {
	get: <T>(endpoint: string, params?: Record<string, string>) =>
		request<T>(endpoint, { method: "GET", params }),
	post: <T>(endpoint: string, body: unknown, opts?: Partial<FetchOptions>) =>
		request<T>(endpoint, { method: "POST", body: JSON.stringify(body), ...opts }),
	patch: <T>(endpoint: string, body: unknown, opts?: Partial<FetchOptions>) =>
		request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body), ...opts }),
	put: <T>(endpoint: string, body: unknown, opts?: Partial<FetchOptions>) =>
		request<T>(endpoint, { method: "PUT", body: JSON.stringify(body), ...opts }),
	delete: <T>(endpoint: string, opts?: Partial<FetchOptions>) =>
		request<T>(endpoint, { method: "DELETE", ...opts }),
};
