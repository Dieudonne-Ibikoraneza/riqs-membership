"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Lock, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DOCS = [
  { name: "National ID Scan", file: "national-id.pdf", locked: true, uploaded: "2025-12-01" },
  { name: "Passport photography", file: "photo.jpg", locked: true, uploaded: "2025-12-01" },
  { name: "Notarized Degree Cert", file: "degree-notarized.pdf", locked: true, uploaded: "2025-12-01" },
  { name: "Curriculum Vitae", file: "cv-2026.pdf", locked: false, uploaded: "2026-01-10" },
  { name: "CPD Attendance Letter", file: "cpd-2025.pdf", locked: false, uploaded: "2025-11-20" },
];

export default function Documents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Documents</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Download your active files and credentials. Locked files can only be replaced via administrative request.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 stagger">
        {DOCS.map((d, index) => (
          <motion.div
            key={d.file}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card className="hover-lift border-zinc-100 dark:border-zinc-800">
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{d.name}</span>
                    {d.locked && (
                      <Badge variant="outline" className="gap-1 text-xs border-zinc-200 bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400">
                        <Lock className="h-3 w-3 text-gold" />Locked
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-sans">
                    {d.file} · Uploaded {d.uploaded}
                  </div>
                </div>
                
                <div className="flex gap-1.5">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => toast.success(`Download started for ${d.file}`)}
                    className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="h-4 w-4 text-gold" />
                  </Button>
                  {!d.locked && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => toast.success(`${d.name} successfully updated`)}
                      className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                    >
                      <Upload className="h-4 w-4 text-navy" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
