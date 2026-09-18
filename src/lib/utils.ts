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

/**
 * Generic underscore-separated enum -> readable label, e.g. "Visiting_Member" ->
 * "Visiting Member", "Firm_Local_Small" -> "Firm Local Small". Use for raw
 * MemberClass/category values shown in admin/profile views where the exact
 * technical value should stay recognizable, just without the underscores.
 */
export function formatEnumLabel(val: string | null | undefined): string {
  if (!val) return "—";
  return String(val).replace(/_/g, " ");
}

/**
 * SystemRole values that live in the `members` table but are managed on the Staff page
 * (/admin/staff) rather than the Members Register — mirrors STAFF_ROLES in
 * backend/src/controllers/adminController.ts. Used to tell staff and regular members
 * apart wherever a raw member id/role shows up (audit log links, member profile lookups).
 */
export const STAFF_SYSTEM_ROLES = ["Admin", "Admin_Assistant", "Head_Reviewer", "Reviewer", "Approver", "Teacher"];

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && STAFF_SYSTEM_ROLES.includes(role);
}

/**
 * Derives a stable `data-tour-id` for a sidebar nav link from its href, e.g.
 * "/admin/mentor-applications" -> "tour-nav-admin-mentor-applications". Shared between
 * AppShell (which tags the actual <Link> elements) and DashboardOnboardingTour (which
 * targets them) so the two can never drift out of sync with each other.
 *
 * Returns undefined for links that shouldn't be part of a tour: disabled ones, and ones
 * with a dynamic/session-specific href (e.g. "/teacher/application/<id>") whose target
 * wouldn't reliably exist or match between renders.
 */
export function navTourId(href: string, disabled?: boolean): string | undefined {
  if (disabled || href === "#" || /\/[0-9a-fA-F-]{16,}(\/|$)/.test(href)) return undefined;
  return `tour-nav-${href.replace(/^\//, "").replace(/\//g, "-")}`;
}
