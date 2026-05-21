"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award,
  Wallet,
  FileText,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { ME_APPLICATION } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function Overview() {
  const me = ME_APPLICATION;

  return (
    <div className="space-y-6">
      {/* Brand Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl brand-gradient p-6 text-white md:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm text-white/70">Welcome back,</div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {me.applicantName}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-gold fill-gold" />
              <span className="text-sm">RIQS-2025-001</span>
              <Badge className="bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold">
                Active
              </Badge>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-3 backdrop-blur border border-white/10">
            <div className="text-xs text-white/70">Membership expires</div>
            <div className="flex items-center gap-2 text-lg font-semibold mt-0.5">
              <Calendar className="h-4 w-4 text-gold" /> 31 Dec 2025
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {[
          {
            i: Award,
            label: "Membership Category",
            v: "Professional",
            c: "text-navy",
          },
          {
            i: Wallet,
            label: "Last Payment",
            v: "RWF 50,000",
            c: "text-emerald-600",
          },
          {
            i: GraduationCap,
            label: "CPD Hours Logged",
            v: "24 / 40",
            c: "text-amber-600",
          },
          {
            i: FileText,
            label: "Uploaded Documents",
            v: "8 on file",
            c: "text-navy",
          },
        ].map((s, index) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover-lift border-zinc-100 dark:border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {s.label}
                  </span>
                  <s.i className={`h-4 w-4 ${s.c}`} />
                </div>
                <div className="mt-2 text-xl font-bold text-navy">{s.v}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Grid: CPD and Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy">
              Continuing Professional Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm font-sans">
              <span className="text-zinc-600 dark:text-zinc-400">
                2025 progress
              </span>
              <span className="font-semibold text-navy">
                24 / 40 hours completed
              </span>
            </div>
            <Progress value={60} className="mt-2 h-2.5" />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                { t: "Cost planning workshop", d: "Jan 2025 · 8 hrs" },
                { t: "Construction Law CPD", d: "Mar 2025 · 6 hrs" },
                { t: "BIM for QS", d: "Apr 2025 · 10 hrs" },
              ].map((x) => (
                <div
                  key={x.t}
                  className="rounded-md border border-zinc-100 dark:border-zinc-800 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors"
                >
                  <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {x.t}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {x.d}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-navy">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: "/dashboard/certificate", l: "Download certificate" },
              { to: "/dashboard/payments", l: "Pay annual renewal" },
              { to: "/dashboard/profile", l: "Update profile" },
              { to: "/dashboard/documents", l: "Manage documents" },
            ].map((a) => (
              <Link key={a.to} href={a.to} className="block w-full">
                <Button
                  variant="outline"
                  className="w-full justify-between border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300"
                >
                  <span>{a.l}</span>
                  <ArrowRight className="h-4 w-4 text-gold" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
