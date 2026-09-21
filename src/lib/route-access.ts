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

// The only places a login/register redirect ever legitimately points: the three workspaces.
// AppShell is the sole producer of `?redirect=` values and it only ever emits paths under
// these roots, so anything else in that param is either a mistake or an attack.
const ALLOWED_REDIRECT_ROOTS = ["/dashboard", "/admin", "/teacher"];
const MAX_REDIRECT_LENGTH = 512;
// Never dereferenced — only used as a base so the URL parser can tell us whether a value
// stays on our own origin. `.invalid` is reserved (RFC 2606) and can't resolve to anything.
const SENTINEL_ORIGIN = "https://redirect-check.invalid";

/**
 * Validates an untrusted `?redirect=` value (an open-redirect / `javascript:` injection
 * vector) and returns a sanitized in-app path to navigate to, or null if it isn't safe.
 *
 * A plain `startsWith("/") && !startsWith("//")` check is bypassable, because browsers
 * parse URLs more leniently than that: `\` is treated as `/` (so `/\evil.com` becomes
 * `//evil.com`), and tabs/newlines are silently stripped (so `/<TAB>/evil.com` does too).
 * `searchParams.get()` hands us the already-decoded value, so `%5C` / `%09` arrive as those
 * raw characters. So instead this:
 *   1. rejects backslashes and all control characters/whitespace outright,
 *   2. requires a single leading "/" (no protocol-relative "//", no scheme like `javascript:`),
 *   3. parses it the way a browser would and confirms the origin didn't change,
 *   4. restricts it to the known workspace roots (after the parser has normalized any
 *      `..` / `%2e%2e` dot-segments, so traversal can't escape them), and
 *   5. returns the parser's normalized path+query+hash — never the raw input string.
 */
export function getSafeRedirectTarget(raw: string | null | undefined): string | null {
  if (!raw || raw.length > MAX_REDIRECT_LENGTH) return null;
  if (/[\\\u0000- \u007f-\u009f]/.test(raw)) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;

  let url: URL;
  try {
    url = new URL(raw, SENTINEL_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== SENTINEL_ORIGIN) return null;

  const path = url.pathname;
  const inAllowedRoot = ALLOWED_REDIRECT_ROOTS.some((root) => path === root || path.startsWith(`${root}/`));
  if (!inAllowedRoot) return null;

  return `${path}${url.search}${url.hash}`;
}
