export const EXPORT_FIELDS = [
  { k: "membershipId", l: "Membership ID" },
  { k: "fullName", l: "Full Name" },
  { k: "category", l: "Category" },
  { k: "practiceLocation", l: "Practice Location" },
  { k: "country", l: "Country" },
  { k: "phoneNumber", l: "Phone" },
  { k: "email", l: "Email" },
  { k: "status", l: "Status" },
  { k: "expiresAt", l: "Expiry Date" },
] as const;

type ExportField = (typeof EXPORT_FIELDS)[number];
export type ExportMember = Record<string, unknown>;
type RegistryPage = { members: ExportMember[]; pagination: { total: number } };

// Fetch every page with the selected status applied by the registry itself.
// A single oversized request silently truncates once a roster grows past its limit.
export async function loadExportMembers(fetchPage: (page: number, limit: number) => Promise<RegistryPage>): Promise<ExportMember[]> {
  const members: ExportMember[] = [];
  const limit = 500;
  for (let page = 1; ; page++) {
    const result = await fetchPage(page, limit);
    members.push(...result.members);
    if (members.length >= result.pagination.total) return members;
    if (result.members.length === 0) throw new Error("The member list changed while loading. Please refresh and try again.");
  }
}

export function exportFilename(filter: string, format: "csv" | "xlsx", date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kigali", year: "numeric", month: "long", day: "numeric",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value;
  const timestamp = `${part("day")} ${part("month")} ${part("year")}`;
  const label = filter === "all" ? "All Members" : filter;
  const status = label.replace(/[<>:"/\\|?*]/g, " ").replace(/\s+/g, " ").trim();
  return `RIQS ${status} ${timestamp}.${format}`;
}

export function exportRows(members: ExportMember[], fields: readonly ExportField[]): string[][] {
  return [fields.map(field => field.l), ...members.map(member => fields.map(field => {
    const value = field.k === "expiresAt" && member.expiresAtIso
      ? String(member.expiresAtIso).slice(0, 10)
      : member[field.k];
    return value === null || value === undefined ? "" : String(value);
  }))];
}

export function exportCsv(rows: string[][]): string {
  // Excel recognizes UTF-8 reliably with a BOM. Escape embedded quotes and keep
  // commas/newlines inside quoted cells so they cannot shift report columns.
  return "\uFEFF" + rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

export async function exportExcel(rows: string[][]): Promise<ArrayBuffer> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Members");
  sheet.addRows(rows);
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: rows[0].length } };
  sheet.columns.forEach((column, index) => {
    column.width = rows.reduce((width, row) => Math.min(55, Math.max(width, (row[index] || "").length + 2)), 16);
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer).buffer;
}
