<script lang="ts">
	import { X } from "@lucide/svelte";

	interface SearchItem {
		id?: string;
		name: string;
		[key: string]: unknown;
	}

	interface Props {
		placeholder?: string;
		items?: SearchItem[];
		selected?: SearchItem[];
		onselect?: (item: SearchItem) => void;
		onremove?: (item: SearchItem) => void;
		oncreate?: (name: string) => void;
		onsearch?: (query: string) => void;
		renderBadge?: (item: SearchItem) => { class: string; label: string };
		disabled?: boolean;
		id?: string;
	}

	let {
		placeholder = "Pesquisar...",
		items = [],
		selected = $bindable([]),
		onselect,
		onremove,
		oncreate,
		onsearch,
		renderBadge,
		disabled = false,
		id = "autocomplete",
	}: Props = $props();

	let query = $state("");
	let isOpen = $state(false);
	let highlightedIndex = $state(-1);
	let inputRef = $state<HTMLInputElement | null>(null);

	let filteredItems = $derived.by(() => {
		if (!query.trim()) return items;
		return items.filter(
			(item) =>
				item.name.toLowerCase().includes(query.toLowerCase()) &&
				!selected.some((s) => s.name === item.name)
		);
	});

	let showCreateOption = $derived.by(() => {
		if (!query.trim()) return false;
		const q = query.trim().toLowerCase();
		const existsInList = items.some((i) => i.name.toLowerCase() === q);
		const alreadySelected = selected.some((s) => s.name.toLowerCase() === q);
		return !existsInList && !alreadySelected;
	});

	let debounceTimer: ReturnType<typeof setTimeout>;

	function handleInput() {
		isOpen = true;
		highlightedIndex = -1;

		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			onsearch?.(query);
		}, 300);
	}

	function selectItem(item: SearchItem) {
		if (!selected.some((s) => s.name === item.name)) {
			selected = [...selected, item];
			onselect?.(item);
		}
		query = "";
		isOpen = false;
		highlightedIndex = -1;
		inputRef?.focus();
	}

	function createItem() {
		const name = query.trim();
		if (name) {
			oncreate?.(name);
			query = "";
			isOpen = false;
			highlightedIndex = -1;
			inputRef?.focus();
		}
	}

	function removeItem(item: SearchItem) {
		selected = selected.filter((s) => s.name !== item.name);
		onremove?.(item);
	}

	function handleKeydown(e: KeyboardEvent) {
		const totalItems = filteredItems.length + (showCreateOption ? 1 : 0);

		if (e.key === "ArrowDown") {
			e.preventDefault();
			isOpen = true;
			highlightedIndex = (highlightedIndex + 1) % Math.max(totalItems, 1);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			isOpen = true;
			highlightedIndex =
				highlightedIndex <= 0 ? totalItems - 1 : highlightedIndex - 1;
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
				selectItem(filteredItems[highlightedIndex]);
			} else if (showCreateOption && highlightedIndex === filteredItems.length) {
				createItem();
			} else if (showCreateOption && highlightedIndex === -1) {
				createItem();
			}
		} else if (e.key === "Escape") {
			isOpen = false;
			highlightedIndex = -1;
		} else if (e.key === "Backspace" && !query && selected.length > 0) {
			removeItem(selected[selected.length - 1]);
		}
	}

	function handleFocus() {
		isOpen = true;
	}

	function handleBlur() {
		// Delay to allow clicks on dropdown items
		setTimeout(() => {
			isOpen = false;
			highlightedIndex = -1;
		}, 200);
	}

	function getBadgeProps(item: SearchItem) {
		return renderBadge
			? renderBadge(item)
			: { class: "bg-zinc-700/50 text-zinc-300 border-zinc-600/50", label: item.name };
	}

	export function focus() {
		inputRef?.focus();
	}
</script>

<div class="relative w-full" {id}>
	<!-- Selected badges -->
	{#if selected.length > 0}
		<div class="mb-2 flex flex-wrap gap-1.5">
			{#each selected as item (item.name)}
				{@const badge = getBadgeProps(item)}
				<span
					class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs transition-all {badge.class}"
				>
					{badge.label}
					<button
						type="button"
						class="ml-0.5 rounded-sm opacity-60 hover:opacity-100 transition-opacity"
						onclick={() => removeItem(item)}
						aria-label="Remover {item.name}"
					>
						<X class="size-3" />
					</button>
				</span>
			{/each}
		</div>
	{/if}

	<!-- Input -->
	<input
		bind:this={inputRef}
		bind:value={query}
		oninput={handleInput}
		onkeydown={handleKeydown}
		onfocus={handleFocus}
		onblur={handleBlur}
		{placeholder}
		{disabled}
		class="w-full rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
		autocomplete="off"
		role="combobox"
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		aria-controls="{id}-listbox"
	/>

	<!-- Dropdown -->
	{#if isOpen && (filteredItems.length > 0 || showCreateOption)}
		<ul
			id="{id}-listbox"
			role="listbox"
			class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
		>
			{#each filteredItems as item, i (item.name)}
				<li
					role="option"
					aria-selected={highlightedIndex === i}
					class="cursor-pointer rounded-md px-3 py-2 text-sm font-mono transition-colors {highlightedIndex === i
						? 'bg-accent text-accent-foreground'
						: 'text-popover-foreground hover:bg-accent/50'}"
					onmousedown={() => selectItem(item)}
					onmouseenter={() => (highlightedIndex = i)}
				>
					{item.name}
				</li>
			{/each}

			{#if showCreateOption}
				<li
					role="option"
					aria-selected={highlightedIndex === filteredItems.length}
					class="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors {highlightedIndex === filteredItems.length
						? 'bg-accent text-accent-foreground'
						: 'text-muted-foreground hover:bg-accent/50'}"
					onmousedown={() => createItem()}
					onmouseenter={() => (highlightedIndex = filteredItems.length)}
				>
					<span class="text-muted-foreground">Criar</span>
					<span class="ml-1 font-mono text-foreground">"{query.trim()}"</span>
				</li>
			{/if}
		</ul>
	{/if}
</div>
