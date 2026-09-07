import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines dynamic Tailwind CSS class names cleanly, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-readable label for a PracticeLocation enum value.
 * "Rwandan" -> "Rwandan", "Non_Rwandan" -> "Non-Rwandan".
 */
export function formatPracticeLocation(val: string | null | undefined): string {
  if (!val) return "—";
  const normalized = String(val).replace(/[-_\s]+/g, "_").toLowerCase();
  if (normalized === "non_rwandan") return "Non-Rwandan";
  if (normalized === "rwandan") return "Rwandan";
  return String(val).replace(/_/g, "-");
}
