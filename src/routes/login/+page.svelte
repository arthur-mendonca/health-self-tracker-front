<script lang="ts">
	import { LoginStore } from "$lib/stores/login.svelte";
	import { LogIn } from "@lucide/svelte";

	const store = new LoginStore();
</script>

<svelte:head>
	<title>Login — Health Self Tracker</title>
</svelte:head>

<div class="flex min-h-[80vh] items-center justify-center">
	<form
		onsubmit={store.handleSubmit}
		class="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg"
	>
		<div class="text-center">
			<h1 class="text-xl font-semibold tracking-tight text-foreground">Health Self Tracker</h1>
			<p class="mt-1 text-xs text-muted-foreground">Faça login para acessar seus registros</p>
		</div>

		{#if store.error}
			<div
				class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
			>
				{store.error}
			</div>
		{/if}

		<div class="space-y-4">
			<div>
				<label for="login-email" class="mb-1.5 block text-xs font-medium text-muted-foreground"
					>Email</label
				>
				<input
					id="login-email"
					type="email"
					bind:value={store.email}
					required
					autocomplete="email"
					placeholder="seu@email.com"
					class="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
				/>
			</div>

			<div>
				<label for="login-password" class="mb-1.5 block text-xs font-medium text-muted-foreground"
					>Senha</label
				>
				<input
					id="login-password"
					type="password"
					bind:value={store.password}
					required
					autocomplete="current-password"
					placeholder="••••••••"
					class="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
				/>
			</div>
		</div>

		<button
			type="submit"
			disabled={store.isLoading}
			class="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
		>
			<LogIn class="size-4" />
			{store.isLoading ? "Entrando..." : "Entrar"}
		</button>
	</form>
</div>
