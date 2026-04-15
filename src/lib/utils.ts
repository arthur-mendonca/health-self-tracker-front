// Re-export everything from the utils directory
// This file exists because shadcn-svelte components import from "$lib/utils.js"
export { cn, type WithElementRef, type WithoutChildren, type WithChildren } from "./utils/index.js";

// Additional type used by some shadcn-svelte components (popover, switch)
import type { Snippet } from "svelte";
import type { ComponentProps } from "svelte";

export type WithoutChildrenOrChild<T> = Omit<T, "children" | "child">;
