"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { motion } from "framer-motion";

const MSGS = [
  { from: "RIQS Council", subject: "Welcome to RIQS", date: "12 Jan 2026", body: "Dear member, welcome to the Rwanda Institute of Quantity Surveyors...", unread: false },
  { from: "RIQS Finance", subject: "Annual renewal reminder", date: "01 Dec 2025", body: "This is a friendly reminder that your annual membership is due...", unread: true },
  { from: "RIQS CPD Committee", subject: "Upcoming CPD: BIM for Quantity Surveyors", date: "20 Nov 2025", body: "Join our virtual CPD session on Building Information Modelling...", unread: false },
];

export default function Communications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Communications</h1>
        <p className="text-sm text-muted-foreground font-sans">
          All official communications, announcements, and notices from RIQS.
        </p>
      </div>

      <div className="space-y-3">
        {MSGS.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={m.unread ? "border-navy/40 bg-navy/5 dark:bg-navy/10" : "border-zinc-100 dark:border-zinc-800"}>
              <CardContent className="flex gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy text-white">
                  <Mail className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{m.subject}</span>
                    {m.unread && (
                      <Badge className="bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold text-[10px]">
                        New
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-sans mt-0.5">{m.from} · {m.date}</div>
                  <p className="mt-2 text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed">{m.body}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
