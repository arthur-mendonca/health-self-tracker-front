<script lang="ts">
	import { X } from "@lucide/svelte";
	import type { DropTime, SubstanceType } from "$lib/api/client";

	interface SubstanceEntry {
		name: string;
		type: SubstanceType;
		exactDose: string;
		notes?: string;
		effectDropTime?: DropTime;
		experiencedCrash: boolean;
	}

	interface Props {
		substance: SubstanceEntry;
		onchange?: (updated: SubstanceEntry) => void;
		onremove?: () => void;
	}

	let { substance = $bindable(), onchange, onremove }: Props = $props();

	const dropTimeOptions: { value: DropTime; label: string }[] = [
		{ value: "MORNING", label: "Manhã" },
		{ value: "AFTERNOON", label: "Tarde" },
		{ value: "EVENING", label: "Noite" },
		{ value: "NONE", label: "Nenhum" },
	];

	function update(field: keyof SubstanceEntry, value: unknown) {
		substance = { ...substance, [field]: value };
		onchange?.(substance);
	}
</script>

<div
	class="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/50 px-3 py-2 transition-all hover:border-ring/30"
>
	<!-- Substance name and type -->
	<div class="flex items-center gap-2 min-w-[140px]">
		<span class="text-xs {substance.type === 'MEDICATION' ? 'text-blue-400' : 'text-green-400'}">
			{substance.type === "MEDICATION" ? "💊" : "💚"}
		</span>
		<span class="font-mono text-sm font-medium text-foreground">{substance.name}</span>
	</div>

	<!-- Dose -->
	<div class="flex items-center gap-1.5">
		<label for="dose-{substance.name}" class="text-xs text-muted-foreground">Dose:</label>
		<input
			id="dose-{substance.name}"
			type="text"
			value={substance.exactDose}
			oninput={(e) => update("exactDose", e.currentTarget.value)}
			placeholder="Ex: 10mg"
			class="w-20 rounded-md border border-input bg-transparent px-2 py-1 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
		/>
	</div>

	<!-- Drop Time -->
	<div class="flex items-center gap-1.5">
		<label for="drop-{substance.name}" class="text-xs text-muted-foreground">Queda:</label>
		<select
			id="drop-{substance.name}"
			value={substance.effectDropTime || ""}
			onchange={(e) => update("effectDropTime", e.currentTarget.value || undefined)}
			class="rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
		>
			<option value="">—</option>
			{#each dropTimeOptions as opt (opt.value)}
				<option value={opt.value}>{opt.label}</option>
			{/each}
		</select>
	</div>

	<!-- Crash checkbox -->
	<label class="flex items-center gap-1.5 cursor-pointer" for="crash-{substance.name}">
		<input
			id="crash-{substance.name}"
			type="checkbox"
			checked={substance.experiencedCrash}
			onchange={(e) => update("experiencedCrash", e.currentTarget.checked)}
			class="size-3.5 rounded border-input accent-destructive"
		/>
		<span class="text-xs text-muted-foreground">Crash</span>
	</label>

	<!-- Remove button -->
	<button
		type="button"
		class="ml-auto rounded-md p-1 text-muted-foreground opacity-50 hover:bg-destructive/10 hover:text-destructive hover:opacity-100 transition-all"
		onclick={() => onremove?.()}
		aria-label="Remover {substance.name}"
	>
		<X class="size-3.5" />
	</button>
</div>
