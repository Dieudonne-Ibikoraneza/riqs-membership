"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const LOG = [
  { t: "2026-05-12 14:32", who: "Eng. P. Nshuti", action: "Approved application APP-1004", entity: "Hassan Al-Mansoori", type: "Approval" },
  { t: "2026-05-12 11:08", who: "Eng. C. Mukamana", action: "Requested correction on documents", entity: "Patrick Iradukunda", type: "Correction" },
  { t: "2026-05-11 16:45", who: "Admin System", action: "Issued Membership ID RIQS-2026-002", entity: "Aline Uwase", type: "System" },
  { t: "2026-05-11 09:22", who: "Eng. P. Nshuti", action: "Approved APP-1005 (outstanding portfolio)", entity: "Sandrine Umutoni", type: "Approval" },
  { t: "2026-05-10 13:01", who: "Eng. C. Mukamana", action: "Sent bulk email to 4 members", entity: "All Active", type: "Email" },
];

export default function Audit() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Audit Log</h1>
        <p className="text-sm text-muted-foreground font-sans">A chronological record of all administrative actions.</p>
      </div>
      
      <Card className="border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {LOG.map((l, i) => (
              <motion.li 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy/10 text-navy dark:bg-gold/15 dark:text-gold">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm md:text-base">
                      {l.action}
                    </span>
                    <Badge variant="outline" className="text-xs border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-black/50">
                      {l.type}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {l.who} · {l.entity} · {l.t}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
