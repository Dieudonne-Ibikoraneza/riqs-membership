"use client";

import { useQuery } from "@tanstack/react-query";
import { teacherServices } from "@/services/teacher.services";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TeacherDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["teacherStudents"],
    queryFn: teacherServices.getStudents
  });

  const students = data?.students || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Teacher Workspace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register students and submit their applications directly to the Approver.
          </p>
        </div>
        <Link href="/teacher/register">
          <Button className="bg-navy hover:bg-[#1a2c42] text-white">
            <UserPlus className="mr-2 h-4 w-4" />
            Register New Student
          </Button>
        </Link>
      </div>

      <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 px-5 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-navy dark:text-zinc-100">Registered Students</h2>
          <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {students.length} Total
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <UserPlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-navy dark:text-zinc-100">No students registered yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
              Get started by registering a new student. Their account will be created and you can fill out their application on their behalf.
            </p>
            <Link href="/teacher/register">
              <Button variant="outline">Register First Student</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Student Name</th>
                  <th className="px-5 py-3 text-left font-medium">Email</th>
                  <th className="px-5 py-3 text-left font-medium">Category</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => (
                  <motion.tr 
                    key={student.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-t border-zinc-100 dark:border-zinc-800/80 group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{student.fullName}</div>
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                      {student.email}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className="font-normal text-xs bg-white dark:bg-black/20 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700">
                        {student.categoryName || "Graduate"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {student.status === "Draft" || student.status === "Correction_Required" ? (
                        <Link href={`/teacher/application/${student.applicationId}`}>
                          <Button size="sm" variant="ghost" className="text-gold hover:text-gold hover:bg-gold/10">
                            Continue Setup
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">Locked</span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  
  const displayStatus = status.replace(/_/g, " ");
  
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium border-none px-2 py-1 text-[11px] flex items-center w-fit gap-1",
        status === "Approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
        : status === "Pending_Approval" ? "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
        : status === "Draft" ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400"
        : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
      )}
    >
      {status === "Approved" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
      {status === "Pending_Approval" && <Clock className="h-3 w-3 shrink-0" />}
      {status === "Correction_Required" && <AlertTriangle className="h-3 w-3 shrink-0" />}
      {displayStatus}
    </Badge>
  );
}
