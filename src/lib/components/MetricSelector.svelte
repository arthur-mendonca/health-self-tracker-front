<script lang="ts">
	interface Props {
		label: string;
		value?: number | null;
		onchange?: (value: number | null) => void;
		min?: number;
		max?: number;
		id?: string;
	}

	let {
		label,
		value = $bindable(null),
		onchange,
		min = 1,
		max = 5,
		id = "metric",
	}: Props = $props();

	const levels = $derived(
		Array.from({ length: max - min + 1 }, (_, i) => i + min)
	);

	function select(level: number) {
		if (value === level) {
			value = null;
			onchange?.(null);
		} else {
			value = level;
			onchange?.(level);
		}
	}

	function handleKeydown(e: KeyboardEvent, level: number) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			select(level);
		}
	}
</script>

<div class="flex flex-col gap-1.5" role="radiogroup" aria-label={label}>
	<span class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
		{label}
	</span>
	<div class="flex gap-1">
		{#each levels as level (level)}
			<button
				type="button"
				role="radio"
				aria-checked={value === level}
				id="{id}-{level}"
				class="flex size-9 items-center justify-center rounded-md border font-mono text-sm font-medium transition-all
					{value === level
						? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
						: 'border-border bg-background text-muted-foreground hover:border-ring hover:text-foreground'}"
				onclick={() => select(level)}
				onkeydown={(e) => handleKeydown(e, level)}
				tabindex={value === level || (value === null && level === min) ? 0 : -1}
			>
				{level}
			</button>
		{/each}
	</div>
</div>
