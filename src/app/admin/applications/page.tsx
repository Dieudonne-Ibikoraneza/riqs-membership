"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { APPLICATIONS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const STATUSES = ["Pending", "Under Review", "Correction Required", "Approved", "Rejected"];

export default function AdminApps() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [loc, setLoc] = useState<string>("all");
  const [cat, setCat] = useState<string>("all");
  const [sel, setSel] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => APPLICATIONS.filter(a => {
    if (q && !`${a.applicantName} ${a.id} ${a.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (status !== "all" && a.status !== status) return false;
    if (loc !== "all" && a.practiceLocation !== loc) return false;
    if (cat !== "all" && a.category !== cat) return false;
    return true;
  }), [q, status, loc, cat]);

  const selectedIds = Object.keys(sel).filter(k => sel[k]);

  const exportCsv = () => {
    const rows = [["Application ID", "Name", "Category", "Location", "Status", "Submitted"]];
    filtered.forEach(a => rows.push([a.id, a.applicantName, a.category, a.practiceLocation, a.status, a.submittedAt]));
    const blob = new Blob([rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a");
    link.href = url; link.download = "applications.csv"; link.click();
    toast.success(`Exported ${filtered.length} records to CSV`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Application Queue</h1>
        <p className="text-sm text-muted-foreground font-sans">Review, filter and act on incoming membership applications.</p>
      </div>

      <Card className="border-zinc-100 dark:border-zinc-800">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name, ID, email..." 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                className="pl-9" 
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={cat} onValueChange={setCat}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {["Graduate","Technologist","Professional","Fellow","Firm"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={loc} onValueChange={setLoc}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Local">Local</SelectItem>
                  <SelectItem value="Foreign">Foreign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
            <div className="text-muted-foreground">
              {filtered.length} application{filtered.length !== 1 && "s"}
              {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="mr-2 h-4 w-4" />Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={selectedIds.length === 0} 
                onClick={() => toast.success(`Bulk email queued to ${selectedIds.length} applicants`)}
              >
                <Mail className="mr-2 h-4 w-4" />Bulk email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-navy/5 dark:bg-navy/10 border-b border-zinc-100 dark:border-zinc-800">
                <TableHead className="w-8">
                  <Checkbox 
                    checked={selectedIds.length === filtered.length && filtered.length > 0} 
                    onCheckedChange={(v) => { 
                      const next: Record<string, boolean> = {}; 
                      if (v) filtered.forEach(f => next[f.id] = true); 
                      setSel(next); 
                    }} 
                  />
                </TableHead>
                <TableHead className="text-navy font-semibold">App ID</TableHead>
                <TableHead className="text-navy font-semibold">Name</TableHead>
                <TableHead className="text-navy font-semibold">Category</TableHead>
                <TableHead className="text-navy font-semibold">Location</TableHead>
                <TableHead className="text-navy font-semibold">Submitted</TableHead>
                <TableHead className="text-navy font-semibold">Reviewer</TableHead>
                <TableHead className="text-navy font-semibold">Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a, index) => (
                <TableRow 
                  key={a.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <TableCell>
                    <Checkbox 
                      checked={!!sel[a.id]} 
                      onCheckedChange={(v) => setSel({ ...sel, [a.id]: !!v })} 
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{a.id}</TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{a.applicantName}</TableCell>
                  <TableCell>{a.category}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs">
                      {a.practiceLocation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.submittedAt}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.reviewer}</TableCell>
                  <TableCell><StatusBadge status={a.status} /></TableCell>
                  <TableCell>
                    <Link href={`/admin/review/${a.id}`}>
                      <Button size="sm" variant="ghost" className="text-navy dark:text-gold hover:bg-navy/5">
                        Review <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-muted-foreground">
                    No applications match the active search filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
    "Under Review": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
    "Correction Required": "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/50",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
    Rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
  };
  return <Badge variant="outline" className={map[status] || ""}>{status}</Badge>;
}
