"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet } from "lucide-react";
import { MEMBERS } from "@/lib/mock-data";
import { toast } from "sonner";
import { motion } from "framer-motion";

const FIELDS = [
  { k: "membershipId", l: "Membership ID" },
  { k: "fullName", l: "Full Name" },
  { k: "category", l: "Category" },
  { k: "practiceLocation", l: "Practice Location" },
  { k: "entityType", l: "Entity Type" },
  { k: "phone", l: "Phone" },
  { k: "email", l: "Email" },
  { k: "status", l: "Status" },
  { k: "joinedAt", l: "Joined Date" },
  { k: "expiresAt", l: "Expiry Date" },
];

export default function Export() {
  const [fields, setFields] = useState<Record<string, boolean>>(
    Object.fromEntries(FIELDS.map(f => [f.k, true]))
  );
  const [filter, setFilter] = useState("all");

  const data = filter === "all" ? MEMBERS : MEMBERS.filter(m => m.status === filter);
  const chosen = FIELDS.filter(f => fields[f.k]);

  const doExport = (format: "csv" | "xlsx") => {
    const rows = [chosen.map(f => f.l)];
    data.forEach(m => rows.push(chosen.map(f => String((m as any)[f.k] ?? ""))));
    const blob = new Blob([rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); 
    const a = document.createElement("a");
    a.href = url; 
    a.download = `riqs-export.${format === "xlsx" ? "csv" : "csv"}`; 
    a.click();
    toast.success(`${data.length} records exported successfully as ${format.toUpperCase()}`);
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
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  <SelectItem value="Active">Active only</SelectItem>
                  <SelectItem value="In Mentorship">In Mentorship</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="rounded-md bg-navy/5 dark:bg-navy/15 px-3 py-2.5 text-sm text-navy dark:text-gold font-medium">
              {data.length} records · {chosen.length} columns selected
            </div>
            
            <div className="space-y-2 pt-2">
              <Button 
                className="w-full bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none" 
                onClick={() => doExport("csv")}
              >
                <Download className="mr-2 h-4 w-4" />Export CSV
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50" 
                onClick={() => doExport("xlsx")}
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
