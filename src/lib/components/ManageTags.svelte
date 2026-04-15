<script lang="ts">
	import { Trash2 } from "@lucide/svelte";
	import type { TagResponse, TagCategory } from "$lib/api/client";
	import { TAG_CATEGORIES } from "$lib/stores/dailyLog.svelte";

	let {
		items,
		isLoading,
		getColor,
		onCreate,
		onUpdate,
		onDelete
	}: {
		items: TagResponse[];
		isLoading: boolean;
		getColor: (category: TagCategory) => string;
		onCreate: (name: string, category: TagCategory) => Promise<void>;
		onUpdate: (id: string, payload: { name?: string; category?: TagCategory }) => Promise<void>;
		onDelete: (id: string) => Promise<void>;
	} = $props();

	let newName = $state("");
	let newCategory = $state<TagCategory>("GENERAL");
	let isCreating = $state(false);

	let editingId = $state<string | null>(null);
	let editName = $state("");
	let editCategory = $state<TagCategory>("GENERAL");
	let isUpdating = $state(false);

	let confirmingDeleteId = $state<string | null>(null);

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newName) return;
		isCreating = true;
		try {
			await onCreate(newName, newCategory);
			newName = "";
			newCategory = "GENERAL";
		} finally {
			isCreating = false;
		}
	}

	function startEdit(item: TagResponse) {
		editingId = item.id;
		editName = item.name;
		editCategory = item.category;
		confirmingDeleteId = null;
	}

	function cancelEdit() {
		editingId = null;
		editName = "";
		editCategory = "GENERAL";
	}

	async function handleUpdate(id: string) {
		const original = items.find((i) => i.id === id);
		if (!original || !editName || (editName === original.name && editCategory === original.category)) {
			cancelEdit();
			return;
		}
		isUpdating = true;
		try {
			await onUpdate(id, { name: editName, category: editCategory });
			cancelEdit();
		} finally {
			isUpdating = false;
		}
	}
</script>

<div class="space-y-6">
	<!-- Mini formulário de criação -->
	<form onsubmit={handleCreate} class="flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm flex-wrap sm:flex-nowrap">
		<input
			type="text"
			bind:value={newName}
			placeholder="Nome da nova tag..."
			class="flex-1 rounded-md bg-transparent px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none min-w-[150px]"
			required
		/>
		<select
			bind:value={newCategory}
			class="rounded-md border border-input bg-transparent px-2 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
		>
			{#each TAG_CATEGORIES as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
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
			<div class="py-6 text-center text-sm text-muted-foreground">Carregando tags...</div>
		{:else if items.length === 0}
			<div class="py-6 text-center text-sm text-muted-foreground">Nenhuma tag cadastrada.</div>
		{:else}
			{#each items as item (item.id)}
				<div class="group flex items-center justify-between rounded-md border border-border/50 bg-card/50 px-4 py-2 hover:border-border transition-colors">
					
					{#if editingId === item.id}
						<!-- Modo Edição -->
						<form
							onsubmit={(e) => { e.preventDefault(); handleUpdate(item.id); }}
							class="flex flex-1 items-center gap-2"
						>
							<div class="flex items-center gap-2 flex-1">
								<input
									type="text"
									bind:value={editName}
									class="flex-1 rounded border border-ring/50 bg-background px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring"
									autofocus
									onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
								/>
								<select
									bind:value={editCategory}
									class="rounded border border-ring/50 bg-background px-2 py-1.5 text-xs focus:ring-1 focus:ring-ring outline-none {getColor(editCategory)}"
								>
									{#each TAG_CATEGORIES as opt (opt.value)}
										<option value={opt.value} class="bg-background text-foreground">{opt.label}</option>
									{/each}
								</select>
							</div>
							<div class="flex items-center gap-1">
								<button type="submit" class="text-xs font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1">OK</button>
								<button type="button" onclick={cancelEdit} class="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancela</button>
							</div>
						</form>
					{:else}
						<!-- Modo Visualização -->
						<div
							class="flex-1 py-1 flex items-center cursor-pointer"
							onclick={() => startEdit(item)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && startEdit(item)}
						>
							<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors {getColor(item.category)} font-mono">
								{item.name}
							</span>
						</div>
					{/if}

					<!-- Ações -->
					{#if editingId !== item.id}
						<div class="ml-4 flex items-center">
							{#if confirmingDeleteId === item.id}
								<div class="flex items-center gap-2 inline-flex">
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
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>
