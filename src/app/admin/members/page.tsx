"use client";

import Link from "next/link";
import { MEMBERS } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function AdminMembers() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Members</h1>
          <p className="text-sm text-muted-foreground font-sans">All approved members and their current status.</p>
        </div>
        <Link href="/members">
          <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50">
            View public directory
          </Button>
        </Link>
      </div>
      
      <Card className="border-zinc-100 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-navy/5 dark:bg-navy/10 border-b border-zinc-100 dark:border-zinc-800">
                <TableHead className="text-navy font-semibold">Membership ID</TableHead>
                <TableHead className="text-navy font-semibold">Name</TableHead>
                <TableHead className="text-navy font-semibold">Category</TableHead>
                <TableHead className="text-navy font-semibold">Location</TableHead>
                <TableHead className="text-navy font-semibold">Email</TableHead>
                <TableHead className="text-navy font-semibold">Expires</TableHead>
                <TableHead className="text-navy font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEMBERS.map((m, index) => (
                <TableRow 
                  key={m.id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    {m.membershipId}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {m.fullName}
                  </TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal text-xs">
                      {m.practiceLocation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{m.expiresAt}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      m.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400" :
                      m.status === "In Mentorship" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400" :
                      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400"
                    }>
                      {m.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
