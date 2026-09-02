"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldOff,
} from "lucide-react";
import {
  parseRosterWorkbook,
  toSubmitRow,
  getRowIssues,
  type ParsedImportRow,
} from "@/lib/import/rosterImportParser";
import { bulkImportMembers, type BulkImportRowResult } from "@/lib/api/admin";
import { publicServices } from "@/services/public.services";

type Step = "upload" | "preview" | "results";

export default function ImportMembersPage() {
  const router = useRouter();
  const { role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedImportRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ summary: { total: number; created: number; skipped: number; failed: number }; results: BulkImportRowResult[] } | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ code: string; name: string }>>([]);

  // Populate the per-row category dropdown from the real, currently-configured categories in
  // the database — never a hardcoded guess — so the admin always sees the actual names
  // ("Professional Quantity Surveyor", "Quantity Surveying Technologist", etc.) and picking one
  // can never drift out of sync with what the database actually has.
  useEffect(() => {
    publicServices
      .getCategories({ includeAdminOnly: true })
      .then((cats) => {
        const individual = cats
          .filter((c) => (c as any).entity_type === "Individual" || !(c as any).entity_type)
          .map((c) => ({ code: c.category_code, name: c.category_name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCategoryOptions(individual);
      })
      .catch((err) => console.error("Failed to load membership categories:", err));
  }, []);

  if (!["Admin", "Approver"].includes(role || "")) {
    return (
      <Card className="max-w-lg mx-auto mt-12 border-dashed">
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <ShieldOff className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold text-navy">Admins &amp; Approvers only</p>
          <p className="text-sm text-muted-foreground">Bulk member import is restricted to Administrators and Approvers.</p>
          <Link href="/admin/members"><Button variant="outline">Back to Members</Button></Link>
        </CardContent>
      </Card>
    );
  }

  const includedCount = rows.filter((r) => r.include).length;
  const skippedCount = rows.length - includedCount;
  const blacklistedCount = rows.filter((r) => r.blacklisted).length;

  const grouped = useMemo(() => {
    return { PROF_TECH: rows.filter((r) => r.sourceSheet === "PROF_TECH").length, GRADUATE: rows.filter((r) => r.sourceSheet === "GRADUATE").length };
  }, [rows]);

  async function handleParse() {
    if (!file) return;
    setParsing(true);
    try {
      const result = await parseRosterWorkbook(file);
      if (result.rows.length === 0) {
        toast.error("No recognizable rows found in this file.");
        return;
      }
      setRows(result.rows);
      setWarnings(result.warnings);
      setStep("preview");
    } catch (err: any) {
      console.error(err);
      toast.error("Couldn't read this file — make sure it's a valid .xlsx roster export.");
    } finally {
      setParsing(false);
    }
  }

  // Name/email/phone are editable directly in the preview table so a row that arrived with
  // missing/invalid contact info can be fixed on the spot instead of forcing a re-upload. A row
  // still missing any of those (blocking issues, recomputed live from its current values) can't
  // be included — its checkbox is disabled — until the admin actually fixes it here.
  function updateRow(key: string, patch: Partial<ParsedImportRow>) {
    setRows((prev) => prev.map((r) => {
      if (r.key !== key) return r;
      // Data-quality issues only — blacklist status is a separate, overridable business
      // decision the checkbox itself controls, not something an edit here should touch.
      const dataIssues = (row: ParsedImportRow) => getRowIssues({ ...row, blacklisted: false });
      const wasBlocked = dataIssues(r).length > 0;
      const merged = { ...r, ...patch };
      const nowBlocked = dataIssues(merged).length > 0;
      if (nowBlocked) {
        merged.include = false;
      } else if (wasBlocked && !("include" in patch)) {
        // Just got fixed by an edit (not by the checkbox itself) — include it by default.
        merged.include = true;
      }
      return merged;
    }));
  }

  async function handleConfirmImport() {
    const toImport = rows.filter((r) => r.include);
    if (toImport.length === 0) {
      toast.error("No rows selected to import.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = toImport.map(toSubmitRow);
      const res = await bulkImportMembers(payload);
      setResults(res);
      setStep("results");
      toast.success(`Import finished — ${res.summary.created} created, ${res.summary.skipped} skipped, ${res.summary.failed} failed.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Import failed — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      <div className="flex items-center gap-3">
        <Link href="/admin/members">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Import Members from Roster</h1>
          <p className="text-sm text-muted-foreground font-sans">
            Bulk-onboard existing members from the legacy Excel roster — each gets a one-time password emailed to them and must change it on first login.
          </p>
        </div>
      </div>

      {step === "upload" && (
        <Card className="border-zinc-150 dark:border-zinc-850 shadow-sm">
          <CardContent className="p-8 space-y-4">
            {file ? (
              <div className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 max-w-lg">
                <div className="h-11 w-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-navy dark:text-zinc-100">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0 rounded-full" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 max-w-lg w-full rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center hover:border-gold hover:bg-gold/5 transition-colors"
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-navy">Click to choose an .xlsx roster file</p>
                <p className="text-xs text-muted-foreground">Expects the "PROF - TECH" and "GRADUATE" sheet layout</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <Button
              onClick={handleParse}
              disabled={!file || parsing}
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
            >
              {parsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              {parsing ? "Reading file..." : "Parse File"}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          {warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3 text-sm text-amber-800 dark:text-amber-300">
              {warnings.map((w, i) => <p key={i}>{w}</p>)}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Badge variant="outline" className="text-sm py-1.5 px-3">{rows.length} rows parsed</Badge>
            <Badge className="text-sm py-1.5 px-3 bg-emerald-100 text-emerald-700 border-none">{includedCount} ready to import</Badge>
            <Badge className="text-sm py-1.5 px-3 bg-zinc-100 text-zinc-700 border-none">{skippedCount} excluded</Badge>
            {blacklistedCount > 0 && (
              <Badge className="text-sm py-1.5 px-3 bg-red-100 text-red-700 border-none">{blacklistedCount} blacklisted</Badge>
            )}
            <Badge variant="outline" className="text-sm py-1.5 px-3">{grouped.PROF_TECH} Prof/Tech · {grouped.GRADUATE} Graduate</Badge>
          </div>

          <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy text-white sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">Include</th>
                    <th className="p-3 text-left">Sheet</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Phone</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Reg. No / Year</th>
                    <th className="p-3 text-left">Expires</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    // Blacklist is a business decision the admin can override (checkbox stays
                    // enabled); missing name/email/phone are hard data gaps that must be fixed
                    // here before the row can be included at all — kept separate so a
                    // blacklisted-but-otherwise-complete row isn't wrongly locked out too.
                    const issues = getRowIssues({ ...r, blacklisted: false });
                    const blocked = issues.length > 0;
                    const inputClass = (invalid: boolean) =>
                      `w-full border rounded-md px-2 py-1 text-xs bg-white dark:bg-zinc-900 ${invalid ? "border-red-400 dark:border-red-700" : "border-zinc-200 dark:border-zinc-700"}`;
                    return (
                      <tr key={r.key} className={`border-b border-zinc-100 dark:border-zinc-800 ${!r.include ? "opacity-60" : ""}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={r.include}
                            disabled={blocked}
                            title={blocked ? `Fix before including: ${issues.join(", ")}` : undefined}
                            onChange={(e) => updateRow(r.key, { include: e.target.checked })}
                            className="h-4 w-4 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{r.sourceSheet === "PROF_TECH" ? "Prof/Tech" : "Graduate"}</td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={r.fullName}
                            onChange={(e) => updateRow(r.key, { fullName: e.target.value })}
                            placeholder="Full name"
                            className={inputClass(!r.fullName)}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="email"
                            value={r.email}
                            onChange={(e) => updateRow(r.key, { email: e.target.value.trim() })}
                            placeholder="Email address"
                            className={inputClass(issues.includes("Missing/invalid email"))}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={r.phoneNumber || ""}
                            onChange={(e) => updateRow(r.key, { phoneNumber: e.target.value.trim() || undefined })}
                            placeholder="+250..."
                            className={inputClass(issues.includes("Missing phone"))}
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={r.categoryCode}
                            onChange={(e) => updateRow(r.key, { categoryCode: e.target.value })}
                            className="border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-zinc-900 max-w-[220px]"
                          >
                            {!categoryOptions.some((c) => c.code === r.categoryCode) && (
                              <option value={r.categoryCode}>{r.categoryCode} (unrecognized)</option>
                            )}
                            {categoryOptions.map((c) => (
                              <option key={c.code} value={c.code}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-xs">{r.membershipIdOverride || r.registrationYear}</td>
                        <td className="p-3 text-xs">{r.membershipExpiresAt}</td>
                        <td className="p-3">
                          {r.blacklisted ? (
                            <Badge className="bg-red-100 text-red-700 border-none text-[10px]">Blacklisted</Badge>
                          ) : blocked ? (
                            <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">{issues.join(", ")}</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Ready</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              <strong className="text-navy">{includedCount}</strong> members will be created and emailed a one-time password.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button
                onClick={handleConfirmImport}
                disabled={submitting || includedCount === 0}
                className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {submitting ? "Importing..." : `Confirm Import (${includedCount})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "results" && results && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge className="text-sm py-1.5 px-3 bg-emerald-100 text-emerald-700 border-none">{results.summary.created} created</Badge>
            <Badge className="text-sm py-1.5 px-3 bg-zinc-100 text-zinc-700 border-none">{results.summary.skipped} skipped</Badge>
            {results.summary.failed > 0 && (
              <Badge className="text-sm py-1.5 px-3 bg-red-100 text-red-700 border-none">{results.summary.failed} failed</Badge>
            )}
          </div>
          <Card className="overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy text-white sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Membership ID / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {results.results.map((r) => (
                    <tr key={r.rowIndex} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="p-3 font-medium text-navy dark:text-zinc-100">{r.fullName}</td>
                      <td className="p-3">{r.email}</td>
                      <td className="p-3">
                        {r.status === "created" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] flex w-fit items-center gap-1"><CheckCircle2 className="h-3 w-3" />Created</Badge>
                        ) : r.status === "skipped" ? (
                          <Badge className="bg-zinc-100 text-zinc-700 border-none text-[10px]">Skipped</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-none text-[10px] flex w-fit items-center gap-1"><AlertTriangle className="h-3 w-3" />Failed</Badge>
                        )}
                      </td>
                      <td className="p-3 text-xs">{r.membershipId || r.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => router.push("/admin/members")} className="bg-navy text-white hover:bg-navy/90 font-semibold">
              Back to Members Register
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
