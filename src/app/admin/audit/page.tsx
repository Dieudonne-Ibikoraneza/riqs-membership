"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/api/admin";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  ShieldCheck,
  Loader2,
  X,
  ChevronRight,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  CreditCard,
  Pencil,
  Clock,
  Fingerprint,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, isStaffRole, STAFF_SYSTEM_ROLES } from "@/lib/utils";

interface AuditIdentity {
  id: string;
  fullName: string;
  email: string;
  systemRole: string | null;
}

interface AuditLogEntry {
  id: string;
  actionType: string;
  actionByEmail: string;
  details: string | null;
  createdAt: string | null;
  member?: AuditIdentity | null;
  performedByMember?: AuditIdentity | null;
}

// Staff accounts don't have a profile page under /admin/members/:id — they're managed on
// the Staff page instead, so any identity resolved back to a staff systemRole links there.
function identityHref(identity: AuditIdentity): string {
  return isStaffRole(identity.systemRole) ? "/admin/staff" : `/admin/members/${identity.id}`;
}

// Colors/icon per action, keyed off loose keyword matches so new actionType values still
// land in a sensible bucket instead of falling through to the generic default.
function getActionMeta(type: string): { icon: LucideIcon; color: string } {
  const t = type.toLowerCase();
  if (t.includes("delete")) return { icon: Trash2, color: "rose" };
  if (t.includes("unlock")) return { icon: Unlock, color: "emerald" };
  if (t.includes("lock")) return { icon: Lock, color: "orange" };
  if (t.includes("reject") || t.includes("fail") || t.includes("revoke") || t.includes("flag") || t.includes("return"))
    return { icon: XCircle, color: "rose" };
  if (t.includes("approve") || t.includes("accept") || t.includes("grant") || t.includes("activated"))
    return { icon: CheckCircle2, color: "emerald" };
  if (t.includes("email") || t.includes("mail") || t.includes("notif")) return { icon: Mail, color: "blue" };
  if (t.includes("assign") || t.includes("forward") || t.includes("submit") || t.includes("send"))
    return { icon: Send, color: "blue" };
  if (t.includes("payment")) return { icon: CreditCard, color: "emerald" };
  if (t.includes("update") || t.includes("change") || t.includes("edit") || t.includes("param"))
    return { icon: Pencil, color: "amber" };
  return { icon: ShieldCheck, color: "zinc" };
}

const colorClasses: Record<string, { badge: string; iconWrap: string; accent: string; headerBg: string }> = {
  rose: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    iconWrap: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    accent: "border-l-rose-400",
    headerBg: "bg-rose-50/60 dark:bg-rose-950/20",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    iconWrap: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    accent: "border-l-emerald-400",
    headerBg: "bg-emerald-50/60 dark:bg-emerald-950/20",
  },
  orange: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
    iconWrap: "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    accent: "border-l-orange-400",
    headerBg: "bg-orange-50/60 dark:bg-orange-950/20",
  },
  blue: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    iconWrap: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    accent: "border-l-blue-400",
    headerBg: "bg-blue-50/60 dark:bg-blue-950/20",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    iconWrap: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    accent: "border-l-amber-400",
    headerBg: "bg-amber-50/60 dark:bg-amber-950/20",
  },
  zinc: {
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
    iconWrap: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
    accent: "border-l-zinc-300 dark:border-l-zinc-700",
    headerBg: "bg-zinc-50/60 dark:bg-zinc-800/20",
  },
};

// Format actionType to friendly title case
const formatActionType = (type: string) =>
  type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (dateStr: string | null, opts?: Intl.DateTimeFormatOptions) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString(
    "en-US",
    opts || { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }
  );
};

// First + last initial, from a full name ("Dieudonne Ibikoraneza" -> "DI") or an email's
// local part when that's all we have ("assistant" -> "AS").
function getInitials(input: string): string {
  const base = input.includes("@") ? input.split("@")[0] : input;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function IdentityAvatar({ label, gradient }: { label: string; gradient: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10",
        gradient
      )}
    >
      {getInitials(label)}
    </div>
  );
}

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

// SystemRole enum values as they appear raw in audit log free text (e.g. "Head_Reviewer
// submitted an APC..."). Matched as whole words (underscore counts as a word character, so
// \bAdmin\b never matches inside "Admin_Assistant") and rendered with the underscore
// replaced by a space.
const ROLE_TOKENS = [...STAFF_SYSTEM_ROLES, "Mentor", "Standard", "Student"];
const ROLE_REGEX = new RegExp(`\\b(${ROLE_TOKENS.join("|")})\\b`, "g");
const formatRolesInText = (text: string) => text.replace(ROLE_REGEX, (m) => m.replace(/_/g, " "));

// Renders free-text audit details with any embedded UUIDs (application IDs, member IDs,
// etc.) shown in full, set off in monospace — same treatment as the Log ID field below —
// and any raw role tokens ("Head_Reviewer") formatted to their readable form.
function renderDetailsWithIds(text: string): ReactNode[] {
  const matches = text.match(UUID_REGEX) || [];
  const parts = text.split(UUID_REGEX);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (part) nodes.push(<span key={`t-${i}`}>{formatRolesInText(part)}</span>);
    if (matches[i]) {
      nodes.push(
        <span
          key={`id-${i}`}
          className="mx-0.5 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[12px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {matches[i]}
        </span>
      );
    }
  });
  return nodes;
}

function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-0">
      <div className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 text-slate-400 mt-0.5 shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

function AuditDrawer({ log, onClose }: { log: AuditLogEntry | null; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keep rendering the last non-null log while the panel plays its exit animation, instead
  // of unmounting the content the instant `log` goes back to null — otherwise there'd be
  // nothing left to slide out.
  const [displayLog, setDisplayLog] = useState<AuditLogEntry | null>(log);
  useEffect(() => {
    if (log) setDisplayLog(log);
  }, [log]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {log && displayLog && (() => {
        const meta = getActionMeta(displayLog.actionType);
        const colors = colorClasses[meta.color];
        const Icon = meta.icon;
        return (
          <>
            <motion.div
              key="audit-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-[190] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              key="audit-drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed right-0 top-0 bottom-0 z-[200] w-full sm:w-[440px] bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
            >
              <div className={cn("flex items-start justify-between gap-3 p-5 border-b border-zinc-100 dark:border-zinc-800", colors.headerBg)}>
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", colors.iconWrap)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", colors.badge)}>
                    {formatActionType(displayLog.actionType)}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-md p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</h3>
                  <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-200 whitespace-pre-wrap">
                    {displayLog.details ? renderDetailsWithIds(displayLog.details) : "No additional details recorded for this action."}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Activity Info</h3>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    <div className="flex items-start gap-3 py-3.5">
                      <IdentityAvatar label={displayLog.performedByMember?.fullName || displayLog.actionByEmail} gradient="bg-gradient-to-br from-gold to-[#d18a00]" />
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Performed By</p>
                        {displayLog.performedByMember ? (
                          <>
                            <Link
                              href={identityHref(displayLog.performedByMember)}
                              className="inline-flex items-center gap-1 text-sm font-medium text-navy dark:text-gold hover:underline"
                            >
                              {displayLog.performedByMember.fullName}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <a
                              href={`mailto:${displayLog.actionByEmail}`}
                              className="block text-xs text-muted-foreground hover:text-navy dark:hover:text-gold hover:underline break-all"
                            >
                              {displayLog.actionByEmail}
                            </a>
                          </>
                        ) : (
                          <a
                            href={`mailto:${displayLog.actionByEmail}`}
                            className="text-sm font-medium text-navy dark:text-gold hover:underline break-all"
                          >
                            {displayLog.actionByEmail}
                          </a>
                        )}
                      </div>
                    </div>

                    {displayLog.member && (
                      <div className="flex items-start gap-3 py-3.5">
                        <IdentityAvatar label={displayLog.member.fullName} gradient="bg-gradient-to-br from-navy to-[#14467f]" />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Affected Member</p>
                          <Link
                            href={identityHref(displayLog.member)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-navy dark:text-gold hover:underline"
                          >
                            {displayLog.member.fullName}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <a
                            href={`mailto:${displayLog.member.email}`}
                            className="block text-xs text-muted-foreground hover:text-navy dark:hover:text-gold hover:underline break-all"
                          >
                            {displayLog.member.email}
                          </a>
                        </div>
                      </div>
                    )}

                    <InfoRow icon={Clock} label="Timestamp">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatDate(displayLog.createdAt, { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </InfoRow>

                    <InfoRow icon={Fingerprint} label="Log ID">
                      <p className="text-xs font-mono text-zinc-500 break-all">{displayLog.id}</p>
                    </InfoRow>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        );
      })()}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default function Audit() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminAuditLogs", page],
    queryFn: () => getAuditLogs(page, pageSize),
  });

  const logs: AuditLogEntry[] = data?.logs || [];
  const total = data?.pagination.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
        <p className="text-sm text-muted-foreground font-sans">
          A chronological record of all secure administrative actions.
        </p>
      </div>

      {isLoading ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="mt-4 text-sm text-muted-foreground font-sans">
              Loading system audit logs...
            </p>
          </CardContent>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-950/10">
          <CardContent className="py-16 text-center text-sm text-muted-foreground font-sans">
            No audit logs found in the database registry.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border border-zinc-150 dark:border-zinc-800/80 overflow-hidden shadow-sm bg-white dark:bg-zinc-900 animate-fade-in">
            <CardContent className="p-0">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.map((l, i) => {
                  const meta = getActionMeta(l.actionType);
                  const colors = colorClasses[meta.color];
                  const Icon = meta.icon;
                  return (
                    <motion.li
                      key={l.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedLog(l)}
                      className={cn(
                        "flex items-center gap-3 p-3.5 border-l-4 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/20 transition-colors",
                        colors.accent
                      )}
                    >
                      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", colors.iconWrap)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "shrink-0 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              colors.badge
                            )}
                          >
                            {formatActionType(l.actionType)}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {l.actionByEmail}
                            {l.member?.fullName && <> → {l.member.fullName}</>}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground font-sans hidden sm:block">
                        {formatDate(l.createdAt)}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-700" />
                    </motion.li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </>
      )}

      <AuditDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
