import { login as apiLogin } from "$lib/api/client";

const TOKEN_KEY = "health-tracker-token";

/**
 * Reactive auth store using Svelte 5 runes.
 * Token is persisted in localStorage so it survives page reloads and browser restarts.
 */
class AuthStore {
	token = $state<string | null>(null);

	get isAuthenticated(): boolean {
		return this.token !== null;
	}

	constructor() {
		// Hydrate from localStorage
		try {
			this.token = localStorage.getItem(TOKEN_KEY);
		} catch {
			// SSR or storage unavailable
		}

		// Listen for storage changes (e.g. 401 auto-logout from the HTTP layer,
		// or another tab logging out).
		if (typeof window !== "undefined") {
			window.addEventListener("storage", (e: StorageEvent) => {
				if (e.key === TOKEN_KEY) {
					this.token = e.newValue;
				}
			});
		}
	}

	async login(email: string, password: string): Promise<void> {
		const token = await apiLogin(email, password);
		this.token = token;
		try {
			localStorage.setItem(TOKEN_KEY, token);
		} catch { /* storage unavailable */ }
	}

	logout(): void {
		this.token = null;
		try {
			localStorage.removeItem(TOKEN_KEY);
		} catch { /* storage unavailable */ }
	}
}

export const authStore = new AuthStore();
