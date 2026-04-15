/**
 * Format a Date to a locale-friendly display string (e.g. "14 de abril de 2026")
 */
export function formatDateDisplay(date: Date): string {
	return date.toLocaleDateString("pt-BR", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

/**
 * Format a Date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

/**
 * Get yesterday's date
 */
export function getYesterday(from: Date = new Date()): Date {
	const d = new Date(from);
	d.setDate(d.getDate() - 1);
	return d;
}

/**
 * Get tomorrow's date
 */
export function getTomorrow(from: Date = new Date()): Date {
	const d = new Date(from);
	d.setDate(d.getDate() + 1);
	return d;
}

/**
 * Simple debounce utility
 */
export function debounce<T extends (...args: unknown[]) => void>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timeout: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timeout);
		timeout = setTimeout(() => fn(...args), delay);
	};
}

/**
 * Map TagCategory enum to display color class
 */
export function tagCategoryColor(category: string): string {
	const map: Record<string, string> = {
		SYMPTOM: "bg-red-500/20 text-red-400 border-red-500/30",
		INTERFERENCE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
		TRIGGER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
		RESCUE: "bg-teal-500/20 text-teal-400 border-teal-500/30",
		GENERAL: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
	};
	return map[category] || map.GENERAL;
}

/**
 * Map TagCategory to a human-readable label
 */
export function tagCategoryLabel(category: string): string {
	const map: Record<string, string> = {
		SYMPTOM: "Sintoma",
		INTERFERENCE: "Interferência",
		TRIGGER: "Gatilho",
		RESCUE: "Resgate",
		GENERAL: "Geral",
	};
	return map[category] || "Geral";
}
