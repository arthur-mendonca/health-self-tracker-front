<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { exportDataDump } from "$lib/api/index.js";
	import type { ExportFormat } from "$lib/api/client.js";
	import { Download, Loader2 } from "@lucide/svelte";

	let { disabled = false } = $props();

	let open = $state(false);
	let format = $state<ExportFormat>("json");
	let filterType = $state<"all" | "days" | "range">("all");
	let days = $state<number>(7);
	let startDate = $state("");
	let endDate = $state("");

	let isExporting = $state(false);
	let errorMsg = $state("");

	async function handleExport() {
		isExporting = true;
		errorMsg = "";
		try {
			const params: Record<string, any> = {};
			if (filterType === "days" && days) {
				params.days = days;
			} else if (filterType === "range") {
				if (startDate) params.startDate = startDate;
				if (endDate) params.endDate = endDate;
			}

			await exportDataDump(format, params);
			open = false; // Close on success
		} catch (err: any) {
			errorMsg = err.message || "Erro ao exportar.";
		} finally {
			isExporting = false;
		}
	}
</script>

<Button variant="ghost" size="sm" type="button" {disabled} onclick={() => open = true}>
	<Download class="size-3.5" />
	Dump
</Button>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Exportar Registros</Dialog.Title>
			<Dialog.Description class="pt-1">
				Faça o download do seu banco de dados no formato de sua preferência.
			</Dialog.Description>
		</Dialog.Header>

		{#if errorMsg}
			<div class="mb-4 rounded border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
				{errorMsg}
			</div>
		{/if}

		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<label for="export-format" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Formato</label>
				<select id="export-format" bind:value={format} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring select-custom">
					<option value="json">JSON (Base de Dados)</option>
					<option value="csv">CSV (Planilhas Excel/Sheets)</option>
					<option value="pdf">PDF (Leitura e Impressão)</option>
					<option value="txt">TXT (Texto Simples)</option>
				</select>
			</div>

			<div class="grid gap-2">
				<label for="export-period" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período</label>
				<select id="export-period" bind:value={filterType} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring select-custom">
					<option value="all">Todo o histórico (Completo)</option>
					<option value="days">Últimos X dias dinâmicos</option>
					<option value="range">Intervalo de datas estático</option>
				</select>
			</div>

			{#if filterType === "days"}
				<div class="grid gap-2 animate-in fade-in duration-200">
					<label for="export-days" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantidade de dias passados</label>
					<input id="export-days" type="number" bind:value={days} min="1" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
				</div>
			{/if}

			{#if filterType === "range"}
				<div class="grid gap-2 animate-in fade-in duration-200">
					<label for="export-start" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data Inicial</label>
					<!-- Browser native date inputs have good usability on desktop and excelent on mobile -->
					<input id="export-start" type="date" bind:value={startDate} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring dark:[color-scheme:dark]" />

					<label for="export-end" class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2">Data Final</label>
					<input id="export-end" type="date" bind:value={endDate} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring dark:[color-scheme:dark]" />
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button type="button" onclick={handleExport} disabled={isExporting} class="w-full sm:w-auto">
				{#if isExporting}
					<Loader2 class="size-4 mr-2 animate-spin" />
					Gerando...
				{:else}
					Fazer Download
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
/* Remove the default arrow to keep standard visual language but allows native menu popup */
.select-custom {
	appearance: none;
	background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
	background-position: right 0.5rem center;
	background-repeat: no-repeat;
	background-size: 1.5em 1.5em;
	padding-right: 2.5rem;
}
</style>
