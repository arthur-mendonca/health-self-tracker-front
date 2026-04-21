import { goto } from "$app/navigation";
import { authStore } from "./auth.svelte";

export class LoginStore {
	email = $state("");
	password = $state("");
	error = $state<string | null>(null);
	isLoading = $state(false);

	constructor() {
		// If already authenticated, redirect immediately
		$effect(() => {
			if (authStore.isAuthenticated) {
				goto("/", { replaceState: true });
			}
		});
	}

	handleSubmit = async (e: Event) => {
		e.preventDefault();
		this.error = null;
		this.isLoading = true;

		try {
			await authStore.login(this.email, this.password);
			goto("/", { replaceState: true });
		} catch {
			this.error = "Email ou senha inválidos.";
		} finally {
			this.isLoading = false;
		}
	};
}
