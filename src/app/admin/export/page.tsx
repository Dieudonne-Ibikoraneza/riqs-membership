"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { getMembersRegistry } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { EXPORT_FIELDS as FIELDS, loadExportMembers, exportFilename, exportRows, exportCsv, exportExcel } from "@/lib/export/smartExport";


export default function Export() {
  const [fields, setFields] = useState<Record<string, boolean>>(
    Object.fromEntries(FIELDS.map(f => [f.k, true]))
  );
  const [filter, setFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const { data: members = [], isFetching, isError, refetch } = useQuery({
    queryKey: ["adminExportMembers", filter],
    queryFn: () => loadExportMembers((page, limit) => getMembersRegistry(page, limit, undefined, filter)),
  });

  const data = members;
  const chosen = FIELDS.filter(f => fields[f.k]);
  const exportDisabled = isFetching || isError || exporting || data.length === 0 || chosen.length === 0;

  const doExport = async (format: "csv" | "xlsx") => {
    if (exportDisabled) return;
    setExporting(true);
    const filename = exportFilename(filter, format);
    try {
      const rows = exportRows(data, chosen);
      const blob = format === "xlsx"
        ? new Blob([await exportExcel(rows)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        : new Blob([exportCsv(rows)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${data.length} records exported successfully as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Smart Export</h1>
        <p className="text-sm text-muted-foreground font-sans">Filter members, pick the columns you need, then export.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Left Column Fields picker */}
        <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy text-base font-bold">1. Choose columns to export</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map(f => (
              <label 
                key={f.k} 
                className="flex items-center gap-3 rounded border border-zinc-100 dark:border-zinc-800 p-3 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all cursor-pointer"
              >
                <Checkbox 
                  checked={fields[f.k]}
                  disabled={exporting}
                  onCheckedChange={(v) => setFields({ ...fields, [f.k]: !!v })} 
                />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{f.l}</span>
              </label>
            ))}
          </CardContent>
        </Card>
        
        {/* Right Column Filter & Trigger */}
        <Card className="border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy text-base font-bold">2. Filter & download</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Member Status
              </label>
              <Select value={filter} onValueChange={setFilter} disabled={exporting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="Active">Active only</SelectItem>
                  <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                  <SelectItem value="In Mentorship">In Mentorship</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-md bg-navy/5 dark:bg-navy/15 px-3 py-2.5 text-sm text-navy dark:text-gold font-medium">
              {isFetching ? "Loading members…" : isError ? "Unable to load members." : `${data.length} records · ${chosen.length} columns selected`}
            </div>
            {isError && <Button variant="outline" onClick={() => refetch()}>Retry loading members</Button>}
            {!isFetching && !isError && data.length === 0 && <p className="text-sm text-muted-foreground">No members match this filter.</p>}
            {chosen.length === 0 && <p className="text-sm text-muted-foreground">Select at least one column to export.</p>}
            <p className="text-xs text-muted-foreground">Filenames include the selected status and export date in Kigali.</p>
            
            <div className="space-y-2 pt-2">
              <Button 
                className="w-full bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none" 
                onClick={() => doExport("csv")}
                disabled={exportDisabled}
              >
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50" 
                onClick={() => doExport("xlsx")}
                disabled={exportDisabled}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4 text-[#0b3363]" />Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
