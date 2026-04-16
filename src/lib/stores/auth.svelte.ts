import { login as apiLogin, logout as apiLogout, fetchMe } from "$lib/api/client";

const AUTH_STATUS_KEY = "health-tracker-auth-status";

/**
 * Reactive auth store using Svelte 5 runes.
 * Authentication is handled by HTTP-only cookies in the API.
 * The front-end only keeps a boolean flag in localStorage to avoid UI flicker
 * before the backend confirms authentication.
 */
class AuthStore {
	isAuthenticated = $state<boolean>(false);
	user = $state<{ id: string; email: string } | null>(null);

	constructor() {
		// Hydrate auth status flag from localStorage
		try {
			this.isAuthenticated = localStorage.getItem(AUTH_STATUS_KEY) === "true";
		} catch {
			// SSR or storage unavailable
		}

		// Listen for storage changes (e.g. 401 auto-logout from the HTTP layer,
		// or another tab logging out).
		if (typeof window !== "undefined") {
			window.addEventListener("storage", (e: StorageEvent) => {
				if (e.key === AUTH_STATUS_KEY) {
					this.isAuthenticated = e.newValue === "true";
					if (!this.isAuthenticated) {
						this.user = null;
					}
				}
			});
			
			// Verify session with the backend on startup if we think we're authenticated
			if (this.isAuthenticated) {
				this.checkSession();
			}
		}
	}
	
	async checkSession(): Promise<void> {
		const user = await fetchMe();
		if (user) {
			this.user = user;
			this.isAuthenticated = true;
			try { localStorage.setItem(AUTH_STATUS_KEY, "true"); } catch {}
		} else {
			this.user = null;
			this.isAuthenticated = false;
			try { localStorage.removeItem(AUTH_STATUS_KEY); } catch {}
		}
	}

	async login(email: string, password: string): Promise<void> {
		await apiLogin(email, password);
		this.isAuthenticated = true;
		try {
			localStorage.setItem(AUTH_STATUS_KEY, "true");
		} catch { /* storage unavailable */ }
		
		// Fetch the user information
		await this.checkSession();
	}

	async logout(): Promise<void> {
		try {
			await apiLogout();
		} catch {
			// Ignore if API call fails, we still want to log out locally
		}
		
		this.isAuthenticated = false;
		this.user = null;
		try {
			localStorage.removeItem(AUTH_STATUS_KEY);
		} catch { /* storage unavailable */ }
	}
}

export const authStore = new AuthStore();
