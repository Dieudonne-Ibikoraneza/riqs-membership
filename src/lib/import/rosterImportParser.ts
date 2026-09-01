import * as XLSX from "xlsx";

// Parses the legacy "LIST OF RIQS ALL MEMBERS" Excel roster (two sheets: a "PROF - TECH" shape
// with an already-assigned registration number, and a "GRADUATE" shape with no registration
// number and a free-text, inconsistently-spelled category column) into a flat, admin-reviewable
// row list. All parsing/cleanup happens here, client-side — the backend only ever receives the
// final, admin-confirmed structured rows, never the raw file.

export type SourceSheet = "PROF_TECH" | "GRADUATE";

export interface ParsedImportRow {
  key: string;
  sourceSheet: SourceSheet;
  fullName: string;
  email: string;
  phoneNumber?: string;
  categoryCode: string;
  membershipIdOverride?: string;
  registrationYear: number;
  membershipExpiresAt: string; // ISO date, yyyy-mm-dd
  blacklisted: boolean;
  include: boolean; // admin-controlled checkbox state — starts false for skip-by-default rows
  reason?: string; // why this row defaulted to excluded, or why it's invalid
  rawSourceRow: number;
}

export interface ParseResult {
  rows: ParsedImportRow[];
  warnings: string[];
}

function normalizeHeaderCell(v: unknown): string {
  return String(v ?? "").trim().toUpperCase();
}

function findColumn(headerRow: unknown[], matcher: RegExp): number {
  return headerRow.findIndex((cell) => matcher.test(normalizeHeaderCell(cell)));
}

function isProfTechHeaderRow(row: unknown[]): boolean {
  return (
    findColumn(row, /REGISTRATION NUMBER/) !== -1 &&
    findColumn(row, /EMAIL ADDRESS/) !== -1 &&
    findColumn(row, /^CONTACT$/) !== -1
  );
}

function isGraduateHeaderRow(row: unknown[]): boolean {
  return (
    findColumn(row, /^S\/N$/) !== -1 &&
    findColumn(row, /CATEGORY/) !== -1 &&
    findColumn(row, /YEAR OF REGISTRATION/) !== -1
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Real category codes this roster ever uses — used to recognize the code cell even when a
// neighboring separator cell has been corrupted (see reconstructRegistrationNumber below).
const KNOWN_CATEGORY_CODES = ["PrQS", "TcQS", "GrQS", "GrQST", "AsQS", "AsQST", "StQS", "F-PrQS", "F-TcQS"];

function cleanName(raw: unknown): string {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  // The "QS" title prefix shows up both as "QS Name" and "QS. Name" depending on which part of
  // the sheet a row is from (later registrations consistently use the period).
  return s.replace(/^QS\.?\s+/i, "").replace(/,+\s*$/, "").trim();
}

/**
 * A single phone number legitimately contains internal spaces or parens as visual grouping
 * ("+250 785 757 301", "(250) 788269846") — only a "/" genuinely separates two different
 * numbers crammed into one cell ("+250789584564/+250729087697"). Splitting on whitespace too
 * (as the email cleaner does) would wrongly truncate a normal single number to just its first
 * group, e.g. "+250".
 */
function firstPhoneToken(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  return s.split("/")[0].trim();
}

/**
 * Two genuinely different real-world messes show up in the EMAIL ADDRESS column:
 *   1. Two real addresses crammed into one cell, separated by "/" or "," — e.g.
 *      "mc.mugume@gmail.com , mmugume@real.rw" — the first one is what we want.
 *   2. A single address with a stray space typo'd into the middle of it — e.g.
 *      "a.umugwaneza @landmark.co.rw" or "janet chirchircheruto@gmail.com" — here a plain
 *      first-token split would grab "a.umugwaneza" or "janet" (not an email at all) and
 *      wrongly reject the whole row. Stripping whitespace *within* each "/" or ","-separated
 *      candidate before validating recovers the real address in both cases without ever
 *      needing to guess which half of a two-name mixup was the intended one.
 */
function firstEmailToken(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const candidates = s.split(/[\/,]+/).map((c) => c.replace(/\s+/g, "")).filter(Boolean);
  return candidates.find((c) => EMAIL_RE.test(c)) || candidates[0] || "";
}

/**
 * The backend expects phone numbers in one canonical shape: a leading "+" followed by the
 * country code and digits only — no spaces, dashes, or parens. The source sheet has every local
 * (Rwandan) format in the same convention the admin described:
 *   "0788123456"        (local, no country code)   -> "+250788123456"
 *   "(250) 788269846"   (country code, no plus)     -> "+250788269846"
 *   "+250 785 757 301"  (already has a plus)        -> "+250785757301"
 *   "782050938"         (bare subscriber number)    -> "+250782050938"
 * A number that already starts with "+" (including genuinely foreign ones like "+254 726 445
 * 756") just has its punctuation stripped — its country code is left alone.
 */
function normalizePhoneNumber(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;

  // A handful of contact cells in the source sheet were typed into a Number-formatted cell
  // instead of Text, so Excel rendered a large phone number in scientific notation (e.g.
  // "2.50787E+11") — the original digits are truncated/lost in the file itself and can't be
  // recovered here. Treat it as no phone number rather than emit garbage digits pulled from
  // the exponent.
  if (/e[+-]?\d+$/i.test(s)) return undefined;

  const hasPlus = s.startsWith("+");
  const digits = s.replace(/\D/g, "");
  if (!digits) return undefined;

  if (hasPlus) return `+${digits}`;
  if (digits.startsWith("250") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+25${digits}`;
  if (digits.length === 9) return `+250${digits}`; // bare subscriber number, no leading 0
  return `+${digits}`;
}

function isBlacklistedContact(raw: unknown): boolean {
  return String(raw ?? "").trim().toLowerCase() === "blacklisted";
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

/**
 * Every reason a row can't be imported as-is — computed fresh from its current field values
 * (not just at parse time) so the same check works both to set a row's initial default and to
 * re-validate it live after the admin edits a field in the preview table. A member needs a real
 * name, a valid email (their login), and a phone number to be importable; "Blacklisted" takes
 * priority and is reported alone since that's a business decision, not a data-quality gap.
 */
export function getRowIssues(row: { fullName: string; email: string; phoneNumber?: string; blacklisted: boolean }): string[] {
  if (row.blacklisted) return ["Blacklisted"];
  const issues: string[] = [];
  if (!row.fullName) issues.push("Missing name");
  if (!isValidEmail(row.email)) issues.push("Missing/invalid email");
  if (!row.phoneNumber) issues.push("Missing phone");
  return issues;
}

/**
 * The source workbook repeats its header row every ~35-40 rows (visible in Excel as a shaded
 * "REGISTRATION NUMBER | NAME | CONTACT | EMAIL ADDRESS" band re-inserted into the data area —
 * presumably left over from print-repeat formatting). Recognize one by its own header-looking
 * cell values landing in the name/email columns, so it can be dropped outright instead of
 * showing up as a bogus "member" named "NAME".
 */
function looksLikeRepeatedHeaderRow(fullName: string, rawEmail: string): boolean {
  const n = fullName.trim().toUpperCase();
  const e = rawEmail.trim().toUpperCase();
  return n === "NAME" || n === "NAMES" || e === "EMAIL ADDRESS" || e === "CONTACT";
}

/**
 * Reconstructs "RIQS-2015-PrQS-0001" from the registration-number cells spread between the
 * "REGISTRATION NUMBER" header and the NAME column (normally ['RIQS','/','2015','/','PrQS',
 * '/','1']). Matches each piece by its shape/vocabulary rather than trusting a fixed position,
 * because real rows in this roster do have a corrupted separator cell here and there (a phone
 * number fragment typed into the '/' cell by mistake) that would otherwise throw off a purely
 * positional read.
 */
function reconstructRegistrationNumber(cells: unknown[]): { year?: string; code?: string; seq?: string } {
  const parts = cells.map((v) => String(v ?? "").trim()).filter((v) => v && v !== "/");
  const year = parts.find((v) => /^\d{4}$/.test(v));
  const code = parts.find((v) => KNOWN_CATEGORY_CODES.some((c) => c.toLowerCase() === v.toLowerCase()));
  // The sequence number is always the last purely-numeric token (immediately before NAME) —
  // taking the *last* match rather than the first skips over stray numeric junk earlier in the
  // span, like a phone number accidentally typed into a separator cell.
  const numericTokens = parts.filter((v) => /^\d+$/.test(v) && v !== year);
  const seq = numericTokens[numericTokens.length - 1];
  return { year, code, seq };
}

/** GraduateSheet's CATEGORY column has 9+ distinct real-world spellings — resolve by route keyword. */
function resolveGraduateCategoryCode(rawCategory: unknown): string {
  const s = String(rawCategory ?? "").toLowerCase();
  if (/techn|tecn|techol/.test(s)) return "GrQST";
  return "GrQS";
}

function parseProfTechSheet(matrix: unknown[][], headerRowIdx: number): { rows: ParsedImportRow[]; warnings: string[] } {
  const headerRow = matrix[headerRowIdx];
  const regNumCol = findColumn(headerRow, /REGISTRATION NUMBER/);
  const nameCol = findColumn(headerRow, /^NAME$/);
  const contactCol = findColumn(headerRow, /^CONTACT$/);
  const emailCol = findColumn(headerRow, /EMAIL ADDRESS/);

  const rows: ParsedImportRow[] = [];
  const warnings: string[] = [];

  if (nameCol === -1 || contactCol === -1 || emailCol === -1 || regNumCol === -1) {
    return { rows, warnings: ["PROF-TECH-shaped sheet found but couldn't locate all expected columns — skipped."] };
  }

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const fullName = cleanName(row[nameCol]);
    const rawEmail = firstEmailToken(row[emailCol]);
    if (!fullName && !rawEmail) continue; // blank trailer row
    if (looksLikeRepeatedHeaderRow(fullName, rawEmail)) continue; // repeated header band, not a member

    // The registration number is spread across several merged cells between the
    // "REGISTRATION NUMBER" header and the NAME column, e.g. ['RIQS','/','2015','/','PrQS','/','1'].
    const { year: yearPart, code: codePart, seq: seqPart } = reconstructRegistrationNumber(row.slice(regNumCol, nameCol));
    const registrationYear = Number(yearPart) || new Date().getFullYear();
    const categoryCode = (codePart || "").trim() || "PrQS";
    const seq = seqPart ? String(seqPart).padStart(4, "0") : undefined;
    const membershipIdOverride = yearPart && codePart && seq ? `RIQS-${yearPart}-${codePart}-${seq}` : undefined;

    const rawContact = row[contactCol];
    const blacklisted = isBlacklistedContact(rawContact);
    const phoneNumber = blacklisted ? undefined : normalizePhoneNumber(firstPhoneToken(rawContact));

    const issues = getRowIssues({ fullName, email: rawEmail, phoneNumber, blacklisted });
    const include = issues.length === 0;
    const reason = issues.length > 0 ? issues.join(", ") : undefined;

    rows.push({
      key: `PROF_TECH-${r}`,
      sourceSheet: "PROF_TECH",
      fullName,
      email: rawEmail,
      phoneNumber,
      categoryCode,
      membershipIdOverride,
      registrationYear,
      membershipExpiresAt: "2026-12-31",
      blacklisted,
      include,
      reason,
      rawSourceRow: r + 1,
    });
  }

  return { rows, warnings };
}

function parseGraduateSheet(matrix: unknown[][], headerRowIdx: number): { rows: ParsedImportRow[]; warnings: string[] } {
  const headerRow = matrix[headerRowIdx];
  const nameCol = findColumn(headerRow, /^NAMES?$/);
  const categoryCol = findColumn(headerRow, /CATEGORY/);
  const yearCol = findColumn(headerRow, /YEAR OF REGISTRATION/);
  const contactCol = findColumn(headerRow, /^CONTACT$/);
  const emailCol = findColumn(headerRow, /EMAIL ADDRESS/);

  const rows: ParsedImportRow[] = [];
  const warnings: string[] = [];

  if (nameCol === -1 || categoryCol === -1 || yearCol === -1 || contactCol === -1 || emailCol === -1) {
    return { rows, warnings: ["GRADUATE-shaped sheet found but couldn't locate all expected columns — skipped."] };
  }

  for (let r = headerRowIdx + 1; r < matrix.length; r++) {
    const row = matrix[r] || [];
    const fullName = cleanName(row[nameCol]);
    const rawEmail = firstEmailToken(row[emailCol]);
    if (!fullName && !rawEmail) continue;
    if (looksLikeRepeatedHeaderRow(fullName, rawEmail)) continue;

    const registrationYear = Number(String(row[yearCol] ?? "").trim()) || new Date().getFullYear();
    const categoryCode = resolveGraduateCategoryCode(row[categoryCol]);
    const phoneNumber = normalizePhoneNumber(firstPhoneToken(row[contactCol]));

    const issues = getRowIssues({ fullName, email: rawEmail, phoneNumber, blacklisted: false });
    const include = issues.length === 0;
    const reason = issues.length > 0 ? issues.join(", ") : undefined;

    rows.push({
      key: `GRADUATE-${r}`,
      sourceSheet: "GRADUATE",
      fullName,
      email: rawEmail,
      phoneNumber,
      categoryCode,
      registrationYear,
      membershipExpiresAt: `${registrationYear}-12-31`,
      blacklisted: false,
      include,
      reason,
      rawSourceRow: r + 1,
    });
  }

  return { rows, warnings };
}

export async function parseRosterWorkbook(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const rows: ParsedImportRow[] = [];
  const warnings: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });

    let headerRowIdx = -1;
    let shape: "PROF_TECH" | "GRADUATE" | null = null;
    for (let i = 0; i < Math.min(matrix.length, 10); i++) {
      if (isProfTechHeaderRow(matrix[i])) {
        headerRowIdx = i;
        shape = "PROF_TECH";
        break;
      }
      if (isGraduateHeaderRow(matrix[i])) {
        headerRowIdx = i;
        shape = "GRADUATE";
        break;
      }
    }

    if (shape === null) {
      warnings.push(`Sheet "${sheetName}" didn't match a known layout and was skipped.`);
      continue;
    }

    const result = shape === "PROF_TECH"
      ? parseProfTechSheet(matrix, headerRowIdx)
      : parseGraduateSheet(matrix, headerRowIdx);
    rows.push(...result.rows);
    warnings.push(...result.warnings);
  }

  return { rows, warnings };
}

export interface BulkImportSubmitRow {
  sourceSheet: SourceSheet;
  fullName: string;
  email: string;
  phoneNumber?: string;
  categoryCode: string;
  membershipIdOverride?: string;
  registrationYear: number;
  membershipExpiresAt: string;
}

export function toSubmitRow(row: ParsedImportRow): BulkImportSubmitRow {
  return {
    sourceSheet: row.sourceSheet,
    fullName: row.fullName,
    email: row.email,
    phoneNumber: row.phoneNumber,
    categoryCode: row.categoryCode,
    membershipIdOverride: row.membershipIdOverride,
    registrationYear: row.registrationYear,
    membershipExpiresAt: row.membershipExpiresAt,
  };
}
