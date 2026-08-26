import type { Role } from "@/lib/auth";

const STAFF_ROLES = ["Admin", "Admin_Assistant", "Reviewer", "Head_Reviewer", "Approver"];

export function getDefaultRouteForRole(role: Role, isTeacher: boolean): string {
  if (role && STAFF_ROLES.includes(role)) return "/admin";
  if (isTeacher) return "/teacher";
  return "/dashboard";
}

// Mirrors AppShell's top-level workspace boundary check (admin/teacher/member prefixes) so
// a post-login redirect never sends someone to a workspace their role can't access. Finer
// restrictions within /dashboard (student-only routes, no-pay membership classes, etc.)
// depend on profile data that isn't available yet at login time — those are still enforced
// by AppShell itself once the target page mounts, so this only needs to gate the top-level
// workspace.
export function isRouteAllowedForRole(path: string, role: Role, isTeacher: boolean): boolean {
  const isStaff = !!role && STAFF_ROLES.includes(role);
  if (path.startsWith("/admin")) return isStaff;
  if (path.startsWith("/teacher")) return isTeacher;
  if (path.startsWith("/dashboard")) return !isStaff && !isTeacher;
  return true;
}

// Only relative, in-app paths are safe to redirect to — never trust a redirect param into
// pushing the browser to an external origin.
export function isSafeRedirectTarget(path: string | null | undefined): path is string {
  return !!path && path.startsWith("/") && !path.startsWith("//");
}
