<script lang="ts">
	import { Trash2 } from "@lucide/svelte";
	import type { ActivityResponse } from "$lib/api/client";

	let {
		items,
		isLoading,
		onCreate,
		onUpdate,
		onDelete
	}: {
		items: ActivityResponse[];
		isLoading: boolean;
		onCreate: (name: string) => Promise<void>;
		onUpdate: (id: string, name: string) => Promise<void>;
		onDelete: (id: string) => Promise<void>;
	} = $props();

	let newName = $state("");
	let isCreating = $state(false);

	let editingId = $state<string | null>(null);
	let editName = $state("");
	let isUpdating = $state(false);

	let confirmingDeleteId = $state<string | null>(null);

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newName) return;
		isCreating = true;
		try {
			await onCreate(newName);
			newName = "";
		} finally {
			isCreating = false;
		}
	}

	function startEdit(item: ActivityResponse) {
		editingId = item.id;
		editName = item.name;
		confirmingDeleteId = null;
	}

	function cancelEdit() {
		editingId = null;
		editName = "";
	}

	async function handleUpdate(id: string) {
		if (!editName || editName === items.find((i) => i.id === id)?.name) {
			cancelEdit();
			return;
		}
		isUpdating = true;
		try {
			await onUpdate(id, editName);
			cancelEdit();
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Mini formulário de criação -->
	<form onsubmit={handleCreate} class="flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
		<input
			type="text"
			bind:value={newName}
			placeholder="Nome da nova atividade..."
			class="flex-1 rounded-md bg-transparent px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none"
			required
		/>
		<button
			type="submit"
			disabled={isCreating}
			class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
		>
			{isCreating ? "Criando..." : "Adicionar"}
		</button>
	</form>

	<!-- Lista -->
	<div class="space-y-2">
		{#if isLoading}
			<div class="py-6 text-center text-sm text-muted-foreground">Carregando atividades...</div>
		{:else if items.length === 0}
			<div class="py-6 text-center text-sm text-muted-foreground">Nenhuma atividade cadastrada.</div>
		{:else}
			{#each items as item (item.id)}
				<div class="group flex items-center justify-between rounded-md border border-border/50 bg-card/50 px-4 py-2 hover:border-border transition-colors">
					
					{#if editingId === item.id}
						<!-- Modo Edição -->
						<form
							onsubmit={(e) => { e.preventDefault(); handleUpdate(item.id); }}
							class="flex flex-1 items-center gap-2"
						>
							<input
								type="text"
								bind:value={editName}
								class="flex-1 rounded border border-ring/50 bg-background px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
								autofocus
								onblur={() => handleUpdate(item.id)}
								onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
							/>
						</form>
					{:else}
						<!-- Modo Visualização -->
						<div
							class="flex-1 cursor-text py-1"
							onclick={() => startEdit(item)}
							onkeydown={(e) => e.key === 'Enter' && startEdit(item)}
							role="button"
							tabindex="0"
						>
							<span class="font-mono text-sm">{item.name}</span>
						</div>
					{/if}

					<!-- Ações -->
					<div class="ml-4 flex items-center">
						{#if confirmingDeleteId === item.id}
							<div class="flex items-center gap-2">
								<span class="text-xs text-destructive">Certeza?</span>
								<button
									onclick={() => onDelete(item.id)}
									class="rounded px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
								>
									Sim
								</button>
								<button
									onclick={() => confirmingDeleteId = null}
									class="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
								>
									Não
								</button>
							</div>
						{:else}
							<button
								onclick={() => confirmingDeleteId = item.id}
								class="p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
								aria-label="Deletar {item.name}"
							>
								<Trash2 class="size-4" />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
