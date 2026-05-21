"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const HISTORY = [
  {
    id: "PMT-2025-001",
    date: "2025-01-12",
    desc: "Annual Renewal 2025",
    amount: "RWF 50,000",
    status: "Verified",
  },
  {
    id: "PMT-2024-008",
    date: "2024-01-09",
    desc: "Annual Renewal 2024",
    amount: "RWF 50,000",
    status: "Verified",
  },
  {
    id: "PMT-2023-012",
    date: "2023-01-15",
    desc: "Annual Renewal 2023",
    amount: "RWF 45,000",
    status: "Verified",
  },
];

export default function Payments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Payments & Renewals</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Track your subscription payments, certificates, and annual renewals.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Next renewal card */}
        <Card className="md:col-span-2 border-gold/45 bg-gold/5 dark:bg-gold/10">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gold text-[#1a1a1a]">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">
                  Next renewal due
                </div>
                <div className="text-lg font-bold text-navy mt-0.5">
                  31 Dec 2025 · RWF 50,000
                </div>
              </div>
            </div>
            <Button
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold shrink-0"
              onClick={() =>
                toast.success(
                  "Proof uploaded successfully — pending administrative verification",
                )
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload proof of payment
            </Button>
          </CardContent>
        </Card>

        {/* Lifetime Paid card */}
        <Card className="border-zinc-100 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">
              Total paid (lifetime)
            </div>
            <div className="mt-1 text-2xl font-bold text-navy">RWF 245,000</div>
            <div className="mt-2 text-xs text-muted-foreground">
              5 successful verification cycles
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History Ledger */}
      <Card className="border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <CardHeader className="border-b border-zinc-50 dark:border-zinc-805 py-4">
          <CardTitle className="text-navy">Payment history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-navy/5 dark:bg-navy/10 border-b border-zinc-100 dark:border-zinc-800">
                  <TableHead className="text-navy font-semibold">
                    Reference
                  </TableHead>
                  <TableHead className="text-navy font-semibold">
                    Date
                  </TableHead>
                  <TableHead className="text-navy font-semibold">
                    Description
                  </TableHead>
                  <TableHead className="text-navy font-semibold">
                    Amount
                  </TableHead>
                  <TableHead className="text-navy font-semibold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HISTORY.map((h, i) => (
                  <TableRow
                    key={h.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {h.id}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700 dark:text-zinc-350">
                      {h.date}
                    </TableCell>
                    <TableCell className="text-sm">{h.desc}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {h.amount}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium">
                        {h.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
