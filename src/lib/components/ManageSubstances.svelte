<script lang="ts">
	import { Trash2 } from "@lucide/svelte";
	import type { SubstanceResponse, SubstanceType } from "$lib/api/client";

	let {
		items,
		isLoading,
		onCreate,
		onUpdate,
		onDelete
	}: {
		items: SubstanceResponse[];
		isLoading: boolean;
		onCreate: (name: string, type: SubstanceType, defaultDose?: string | null) => Promise<void>;
		onUpdate: (id: string, payload: { name?: string; type?: SubstanceType; defaultDose?: string | null }) => Promise<void>;
		onDelete: (id: string) => Promise<void>;
	} = $props();

	let newName = $state("");
	let newType = $state<SubstanceType>("MEDICATION");
	let newDefaultDose = $state("");
	let isCreating = $state(false);

	let editingId = $state<string | null>(null);
	let editName = $state("");
	let editType = $state<SubstanceType>("MEDICATION");
	let editDefaultDose = $state("");
	let isUpdating = $state(false);

	let confirmingDeleteId = $state<string | null>(null);

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newName) return;
		isCreating = true;
		try {
			await onCreate(newName, newType, newDefaultDose || null);
			newName = "";
			newType = "MEDICATION";
			newDefaultDose = "";
		} finally {
			isCreating = false;
		}
	}

	function startEdit(item: SubstanceResponse) {
		editingId = item.id;
		editName = item.name;
		editType = item.type;
		editDefaultDose = item.defaultDose || "";
		confirmingDeleteId = null;
	}

	function cancelEdit() {
		editingId = null;
		editName = "";
		editType = "MEDICATION";
		editDefaultDose = "";
	}

	async function handleUpdate(id: string) {
		const original = items.find((i) => i.id === id);
		if (!original || !editName || (editName === original.name && editType === original.type && (editDefaultDose || null) === original.defaultDose)) {
			cancelEdit();
			return;
		}
		isUpdating = true;
		try {
			await onUpdate(id, { name: editName, type: editType, defaultDose: editDefaultDose || null });
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
			placeholder="Nome (ex: Ibuprofeno)"
			class="flex-1 rounded-md bg-transparent px-3 py-1.5 font-mono text-sm text-foreground focus:outline-none min-w-[140px]"
			required
		/>
		<div class="flex items-center gap-2">
			<select
				bind:value={newType}
				class="rounded-md border border-input bg-transparent px-2 py-1.5 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
			>
				<option value="MEDICATION">Medicamento</option>
				<option value="SUPPLEMENT">Suplemento</option>
			</select>
			<input
				type="text"
				bind:value={newDefaultDose}
				placeholder="Dose padrão"
				class="w-24 rounded-md border border-input bg-transparent px-2 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
			/>
		</div>
		<button
			type="submit"
			disabled={isCreating}
			class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
		>
			{isCreating ? "..." : "Adicionar"}
		</button>
	</form>

	<!-- Lista -->
	<div class="space-y-2">
		{#if isLoading}
			<div class="py-6 text-center text-sm text-muted-foreground">Carregando substâncias...</div>
		{:else if items.length === 0}
			<div class="py-6 text-center text-sm text-muted-foreground">Nenhuma substância cadastrada.</div>
		{:else}
			{#each items as item (item.id)}
				<div class="group flex items-center justify-between rounded-md border border-border/50 bg-card/50 px-4 py-2 hover:border-border transition-colors">
					
					{#if editingId === item.id}
						<!-- Modo Edição -->
						<form
							onsubmit={(e) => { e.preventDefault(); handleUpdate(item.id); }}
							class="flex flex-1 items-center gap-2"
						>
							<div class="flex items-center gap-2 flex-1 flex-wrap sm:flex-nowrap">
								<input
									type="text"
									bind:value={editName}
									class="flex-[2] rounded border border-ring/50 bg-background px-2 py-1 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[140px]"
									autofocus
									onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
								/>
								<select
									bind:value={editType}
									class="rounded border border-ring/50 bg-background px-2 py-1 text-xs focus:ring-1 focus:ring-ring outline-none"
								>
									<option value="MEDICATION">Medicamento</option>
									<option value="SUPPLEMENT">Suplemento</option>
								</select>
								<input
									type="text"
									bind:value={editDefaultDose}
									placeholder="Dose"
									class="w-20 rounded border border-ring/50 bg-background px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-ring"
									onkeydown={(e) => e.key === 'Escape' && cancelEdit()}
								/>
							</div>
							<div class="flex items-center gap-1">
								<button type="submit" class="text-xs font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1">OK</button>
								<button type="button" onclick={cancelEdit} class="text-xs text-muted-foreground hover:text-foreground px-2 py-1">Cancela</button>
							</div>
						</form>
					{:else}
						<!-- Modo Visualização -->
						<div
							class="flex flex-1 items-center gap-3 py-1 cursor-pointer"
							onclick={() => startEdit(item)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && startEdit(item)}
						>
							<span class="text-xs {item.type === 'MEDICATION' ? 'text-blue-400' : 'text-green-400'}">
								{item.type === "MEDICATION" ? "💊" : "💚"}
							</span>
							<span class="font-mono text-sm font-medium flex-1 text-foreground">{item.name}</span>
							{#if item.defaultDose}
								<span class="text-xs text-muted-foreground mr-4">Dose: <span class="font-mono text-foreground">{item.defaultDose}</span></span>
							{/if}
						</div>
					{/if}

					<!-- Ações -->
					{#if editingId !== item.id}
						<div class="ml-2 flex items-center shrink-0">
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
