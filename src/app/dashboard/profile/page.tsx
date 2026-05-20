"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
        {label} <Lock className="h-3 w-3 text-gold" />
      </Label>
      <Input value={value} disabled readOnly className="mt-1 bg-zinc-50 dark:bg-zinc-950 cursor-not-allowed border-zinc-200 dark:border-zinc-800" />
      <p className="text-[11px] text-muted-foreground/80">Locked compliance field — contact RIQS admin to update.</p>
    </div>
  );
}

export default function Profile() {
  const [name, setName] = useState("Demo Member");
  const [edu, setEdu] = useState([
    { degree: "BSc Quantity Surveying", institution: "University of Rwanda", year: 2020 },
    { degree: "MSc Construction Management", institution: "Strathmore University", year: 2023 },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ degree: "", institution: "", year: 2026 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Profile</h1>
        <p className="text-sm text-muted-foreground font-sans">Some fields are locked for compliance. Contact RIQS admin to request changes.</p>
      </div>

      {/* Personal Info Card */}
      <Card className="border-zinc-100 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800/50 py-4">
          <CardTitle className="text-navy">Personal Information</CardTitle>
          <Button 
            size="sm" 
            onClick={() => toast.success("Profile saved successfully")} 
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold"
          >
            <Pencil className="mr-2 h-4 w-4" />Save changes
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 p-6">
          <div className="space-y-1">
            <Label htmlFor="prof-name">Full Name</Label>
            <Input id="prof-name" placeholder="e.g. Demo Member" value={name} onChange={e => setName(e.target.value)} />
            <p className="text-xs text-muted-foreground">Editable. Change is audit-logged.</p>
          </div>
          <LockedField label="National ID / Passport" value="1 1990 8 0123456 7 89" />
          <LockedField label="Primary Email Address" value="demo@riqs.rw" />
          <LockedField label="Mobile Phone" value="+250 788 000 000" />
          <LockedField label="Practice Category" value="Professional" />
          <LockedField label="Date of Birth" value="14 May 1990" />
        </CardContent>
      </Card>

      {/* Education Qualifications */}
      <Card className="border-zinc-100 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-50 dark:border-zinc-800/50 py-4">
          <CardTitle className="text-navy">Education</CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowAdd(s => !s)}
            className="border-zinc-200 dark:border-zinc-800"
          >
            <Plus className="mr-2 h-4 w-4" />Add qualification
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {edu.map((e, i) => (
            <div key={i} className="flex items-start justify-between rounded-md border border-zinc-100 dark:border-zinc-850 p-4">
              <div>
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">{e.degree}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{e.institution} · {e.year}</div>
              </div>
              <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/50">
                Verified
              </Badge>
            </div>
          ))}
          
          {showAdd && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 p-4 space-y-3"
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="edu-deg">Degree/Diploma</Label>
                  <Input id="edu-deg" placeholder="e.g. BSc Quantity Surveying" value={draft.degree} onChange={e => setDraft({ ...draft, degree: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edu-inst">Institution</Label>
                  <Input id="edu-inst" placeholder="e.g. University of Rwanda" value={draft.institution} onChange={e => setDraft({ ...draft, institution: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edu-yr">Graduation Year</Label>
                  <Input id="edu-yr" type="number" placeholder="e.g. 2026" value={draft.year} onChange={e => setDraft({ ...draft, year: +e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button 
                  size="sm" 
                  className="bg-navy border-none" 
                  onClick={() => {
                    if (!draft.degree) return toast.error("Enter qualification name");
                    setEdu([...edu, draft]); 
                    setDraft({ degree: "", institution: "", year: 2026 }); 
                    setShowAdd(false);
                    toast.success("Qualification added (pending verification review)");
                  }}
                >
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Employment Record */}
      <Card className="border-zinc-100 dark:border-zinc-800">
        <CardHeader className="border-b border-zinc-50 dark:border-zinc-800/50 py-4">
          <CardTitle className="text-navy">Employment</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div className="rounded-md border border-zinc-100 dark:border-zinc-850 p-4">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200">
              Senior Quantity Surveyor — Kigali Build Ltd
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">Jun 2020 — Present</div>
          </div>
        </CardContent>
      </Card>

      {/* Warning locked notice */}
      <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
        <CardHeader className="py-4">
          <CardTitle className="text-amber-900 dark:text-amber-400 text-base font-bold">Documents on file</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-sm text-amber-900/80 dark:text-amber-400/80 leading-relaxed">
            Your notarized academic degree scans, National ID/passport duplicates, passport photography, and primary verification records are locked for security. Visit the **Documents** page to view copies or request replacement options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
