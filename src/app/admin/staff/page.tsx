"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield, Plus, Loader2, Copy, Check, AlertCircle,
  MoreVertical, Star, Lock, Unlock, Crown
} from "lucide-react";
import {
  getStaffRegistry, createStaffAccount, lockStaffAccount,
  unlockStaffAccount, promoteToHeadReviewer
} from "@/lib/api/admin";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy to-[#14467f] text-xs font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10">
      {initials}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function RoleBadge({ role }: { role: string }) {
  const cls =
    role === "Admin"
      ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
      : role === "Approver"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
      : role === "Head_Reviewer"
      ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
      : "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";

  return (
    <Badge variant="outline" className={cn("font-semibold flex items-center gap-1", cls)}>
      {role === "Head_Reviewer" && <Crown className="h-3 w-3" />}
      {role === "Head_Reviewer" ? "Head Reviewer" : role}
    </Badge>
  );
}

export default function StaffManagementPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    systemRole: "Reviewer"
  });

  const [staffToLock, setStaffToLock] = useState<{ id: string; name: string } | null>(null);
  const [lockDuration, setLockDuration] = useState<number>(30);

  const [promoteTarget, setPromoteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["adminStaffList"],
    queryFn: getStaffRegistry,
  });

  const staffList = data?.staff || [];
  const existingHead = staffList.find((s: any) => s.systemRole === "Head_Reviewer");

  const createMutation = useMutation({
    mutationFn: createStaffAccount,
    onSuccess: (res) => {
      toast.success(res.message || "Staff member created successfully!");
      setCreatedPassword(res.temporaryPassword);
      queryClient.invalidateQueries({ queryKey: ["adminStaffList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create staff member");
    }
  });

  const lockMutation = useMutation({
    mutationFn: ({ id, duration }: { id: string, duration: number }) => lockStaffAccount(id, duration),
    onSuccess: (res) => {
      toast.success(res.message || "Staff member locked successfully!");
      setStaffToLock(null);
      queryClient.invalidateQueries({ queryKey: ["adminStaffList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to lock staff member");
      setStaffToLock(null);
    }
  });

  const unlockMutation = useMutation({
    mutationFn: unlockStaffAccount,
    onSuccess: (res) => {
      toast.success(res.message || "Staff member unlocked successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminStaffList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to unlock staff member");
    }
  });

  const promoteMutation = useMutation({
    mutationFn: (id: string) => promoteToHeadReviewer(id),
    onSuccess: (res) => {
      toast.success(res.message || "Head Reviewer updated!");
      setPromoteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["adminStaffList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to promote Head Reviewer");
      setPromoteTarget(null);
    }
  });

  const handleCreate = () => {
    if (!formData.fullName || !formData.email || !formData.systemRole) {
      toast.error("Please fill in all fields");
      return;
    }
    createMutation.mutate(formData);
  };

  const copyToClipboard = () => {
    if (createdPassword) {
      navigator.clipboard.writeText(createdPassword);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setCreatedPassword(null);
    setFormData({ fullName: "", email: "", systemRole: "Reviewer" });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage internal administrative accounts (Reviewers, Approvers, Teachers, Admins).
          </p>
        </div>
        <Button
          className="bg-navy text-white hover:bg-navy/90"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Head Reviewer Banner */}
      {existingHead ? (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50/60 dark:bg-yellow-950/20 dark:border-yellow-900/50 px-4 py-3">
          <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-yellow-800 dark:text-yellow-300">Head Reviewer: </span>
            <span className="text-yellow-700 dark:text-yellow-400">{existingHead.fullName}</span>
            <span className="text-yellow-600 dark:text-yellow-500 ml-2">({existingHead.email})</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50/60 dark:bg-red-950/20 dark:border-red-900/50 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <div className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">No Head Reviewer assigned.</span> Applications cannot be forwarded to the Approver until a Head Reviewer is set.
          </div>
        </div>
      )}

      <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <CardTitle className="text-lg font-semibold text-navy">Registered Staff Members</CardTitle>
          <CardDescription>Accounts with privileged internal access.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Loader2 className="h-8 w-8 animate-spin text-navy/40" />
            </div>
          ) : staffList.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
              <p>No staff members found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy text-white">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Member</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Email Address</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">System Role</th>
                    <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-right">Date Created</th>
                    <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider w-16">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff: any, i: number) => (
                    <tr
                      key={staff.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5",
                        i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10"
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={staff.fullName} />
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                            {staff.fullName}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                        {staff.email}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 items-center">
                          <RoleBadge role={staff.systemRole} />
                          {staff.isLocked && (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                                Locked
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertCircle className="h-4 w-4 text-orange-500 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-zinc-900 text-white border-zinc-800 text-center max-w-xs">
                                  <p>Locked until {new Date(staff.lockedUntil).toLocaleDateString()}. Account will be permanently deleted without further action if not unlocked.</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right text-zinc-500 text-sm">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {/* Make Head Reviewer — only for Reviewer role */}
                            {staff.systemRole === "Reviewer" && (
                              <>
                                <DropdownMenuItem
                                  className="gap-2 text-yellow-700 dark:text-yellow-400 focus:text-yellow-700 focus:bg-yellow-50 dark:focus:bg-yellow-950/30 cursor-pointer"
                                  onClick={() => setPromoteTarget({ id: staff.id, name: staff.fullName })}
                                >
                                  <Crown className="h-4 w-4" />
                                  Make Head Reviewer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}

                            {/* Lock / Unlock */}
                            {staff.isLocked ? (
                              <DropdownMenuItem
                                className="gap-2 text-emerald-700 dark:text-emerald-400 focus:text-emerald-700 focus:bg-emerald-50 dark:focus:bg-emerald-950/30 cursor-pointer"
                                onClick={() => unlockMutation.mutate(staff.id)}
                                disabled={unlockMutation.isPending}
                              >
                                <Unlock className="h-4 w-4" />
                                Unlock Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="gap-2 text-orange-700 dark:text-orange-400 focus:text-orange-700 focus:bg-orange-50 dark:focus:bg-orange-950/30 cursor-pointer"
                                onClick={() => setStaffToLock({ id: staff.id, name: staff.fullName })}
                              >
                                <Lock className="h-4 w-4" />
                                Lock Account
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog
        open={isAddDialogOpen || !!createdPassword}
        onOpenChange={(o) => {
          if (!o && !createdPassword) setIsAddDialogOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {createdPassword ? "Account Created!" : "Add New Staff Member"}
            </DialogTitle>
          </DialogHeader>

          {!createdPassword ? (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="e.g. John Doe"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="e.g. reviewer@riqs.rw"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>System Role</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent dark:border-zinc-800 dark:bg-zinc-950"
                  value={formData.systemRole}
                  onChange={e => setFormData({...formData, systemRole: e.target.value})}
                >
                  <option value="Reviewer">Reviewer</option>
                  <option value="Approver">Approver</option>
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Staff member <strong>{formData.fullName}</strong> was successfully created.
                Please securely copy and share the temporary password below.
              </p>
              <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md">
                <code className="flex-1 text-lg font-mono font-bold tracking-wider text-navy dark:text-gold text-center">
                  {createdPassword}
                </code>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-red-500 font-medium">
                Warning: This password will not be shown again.
              </p>
            </div>
          )}

          <DialogFooter>
            {!createdPassword ? (
              <>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={createMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-navy hover:bg-navy/90 text-white">
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Account"}
                </Button>
              </>
            ) : (
              <Button onClick={closeDialogs} className="w-full bg-navy hover:bg-navy/90 text-white">
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Confirmation Dialog */}
      <Dialog open={!!staffToLock} onOpenChange={(open) => !open && setStaffToLock(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lock Staff Account</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to lock{" "}
              <strong className="text-navy dark:text-zinc-200">{staffToLock?.name}</strong>?
              They will not be able to log in.
            </p>
            <div className="space-y-2">
              <Label>Lock Duration (Days)</Label>
              <Input
                type="number"
                min="1"
                value={lockDuration}
                onChange={(e) => setLockDuration(parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground">
                If not unlocked within {lockDuration} days, the account will be permanently deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffToLock(null)} disabled={lockMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => staffToLock && lockMutation.mutate({ id: staffToLock.id, duration: lockDuration })}
              disabled={lockMutation.isPending}
            >
              {lockMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Lock Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote to Head Reviewer Dialog */}
      <Dialog open={!!promoteTarget} onOpenChange={(open) => !open && setPromoteTarget(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Appoint Head Reviewer
            </DialogTitle>
            <DialogDescription className="pt-1 leading-relaxed">
              {existingHead ? (
                <>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {existingHead.fullName}
                  </span>{" "}
                  is currently the Head Reviewer. Appointing{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {promoteTarget?.name}
                  </span>{" "}
                  will <span className="font-semibold text-red-600">revoke</span> their Head Reviewer role and downgrade them back to a regular Reviewer.
                </>
              ) : (
                <>
                  You are about to appoint{" "}
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {promoteTarget?.name}
                  </span>{" "}
                  as the Head Reviewer. They will be the only one able to forward applications to the Approver.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {existingHead && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900/50 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold text-orange-800 dark:text-orange-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Role Change Warning
              </div>
              <ul className="text-orange-700 dark:text-orange-400 space-y-0.5 pl-6 list-disc text-xs">
                <li><strong>{existingHead.fullName}</strong> → reverted to Reviewer</li>
                <li><strong>{promoteTarget?.name}</strong> → promoted to Head Reviewer</li>
              </ul>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoteTarget(null)} disabled={promoteMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => promoteTarget && promoteMutation.mutate(promoteTarget.id)}
              disabled={promoteMutation.isPending}
            >
              {promoteMutation.isPending
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                : <Crown className="mr-2 h-4 w-4" />
              }
              Confirm Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
