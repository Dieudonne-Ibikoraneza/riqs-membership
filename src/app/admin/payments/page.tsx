"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingPayments, verifyPayment, AdminPaymentTransaction } from "@/lib/api/admin";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Search, XCircle, RefreshCw, FileText } from "lucide-react";
import { format } from "date-fns";
import { axiosClient } from "@/lib/axiosClient";
import { cn } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("Pending_Verification");
  const [selectedTx, setSelectedTx] = useState<AdminPaymentTransaction | null>(null);
  const [verifyAction, setVerifyAction] = useState<"Cleared" | "Failed" | "Refunded">("Cleared");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminPayments", page, status],
    queryFn: () => getPendingPayments(page, 15, status),
  });

  const { mutate: handleVerify, isPending: isVerifying } = useMutation({
    mutationFn: () => verifyPayment(selectedTx!.id, verifyAction, rejectionReason),
    onSuccess: (res) => {
      toast.success(res.message || `Payment ${verifyAction.toLowerCase()} successfully`);
      setIsDialogOpen(false);
      setSelectedTx(null);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["adminPayments"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Verification failed");
    },
  });

  const openVerifyDialog = (tx: AdminPaymentTransaction) => {
    setSelectedTx(tx);
    setVerifyAction("Cleared");
    setRejectionReason("");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Cleared":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">Cleared</Badge>;
      case "Pending_Verification":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">Pending</Badge>;
      case "Failed":
      case "Refunded":
        return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400">{s}</Badge>;
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const formatTxType = (t: string) => t.replace(/_/g, " ");
  const formatMethod = (m: string) => m.replace(/_/g, " ");
  const formatAmount = (amt: number, curr: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: curr }).format(amt);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Finance & Payments</h1>
          <p className="text-muted-foreground">Manage and clear member transaction references.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <CardTitle>Transactions Queue</CardTitle>
            <CardDescription>Review and verify submitted payments.</CardDescription>
          </div>
          <div className="w-[200px]">
            <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending_Verification">Pending Verification</SelectItem>
                <SelectItem value="Cleared">Cleared</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider w-[180px]">Reference</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Member</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Method</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="mb-2 h-6 w-6 animate-spin" />
                        Loading queue...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 h-32 text-center text-red-500">
                      Failed to load transactions.
                    </td>
                  </tr>
                ) : data?.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 h-32 text-center text-muted-foreground">
                      No transactions found for this status.
                    </td>
                  </tr>
                ) : (
                  data?.transactions.map((tx: any, i: number) => (
                    <tr
                      key={tx.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5",
                        i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10"
                      )}
                    >
                      <td className="px-5 py-4 text-xs font-semibold text-navy dark:text-gold">{tx.transactionReference}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{tx.full_name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{tx.email || "No email"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">{formatTxType(tx.txType)}</td>
                      <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-400">{formatMethod(tx.paymentMethod)}</td>
                      <td className="px-5 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">{formatAmount(tx.amount, tx.currency)}</td>
                      <td className="px-5 py-4">{getStatusBadge(tx.status)}</td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {tx.status === "Pending_Verification" ? (
                          <Button size="sm" onClick={() => openVerifyDialog(tx)}>
                            Verify
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            Resolved
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Clear or reject this transaction. This action will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTx && (
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="font-semibold text-navy dark:text-gold">{selectedTx.transactionReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">{formatAmount(selectedTx.amount, selectedTx.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <span>{formatMethod(selectedTx.paymentMethod)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{formatTxType(selectedTx.txType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member:</span>
                  <span>{selectedTx.full_name}</span>
                </div>
                {selectedTx.receiptUrl && (
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-muted/50">
                    <span className="text-muted-foreground">Uploaded Receipt:</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        try {
                          const res = await axiosClient.get(`/files/download/${selectedTx.receiptUrl}`, { responseType: 'blob' });
                          const url = window.URL.createObjectURL(res.data);
                          window.open(url, '_blank');
                        } catch (err) {
                          toast.error("Failed to load receipt document");
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                      View Document
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="action">Action</Label>
                <Select value={verifyAction} onValueChange={(val: any) => setVerifyAction(val)}>
                  <SelectTrigger id="action">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cleared" className="text-emerald-600 font-medium">Clear Payment</SelectItem>
                    <SelectItem value="Failed" className="text-red-600 font-medium">Mark as Failed</SelectItem>
                    <SelectItem value="Refunded" className="text-amber-600 font-medium">Mark as Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {verifyAction !== "Cleared" && (
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason (Required)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter the reason for rejection or refund..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isVerifying}>
              Cancel
            </Button>
            <Button 
              onClick={() => handleVerify()} 
              disabled={isVerifying || (verifyAction !== "Cleared" && !rejectionReason.trim())}
              variant={verifyAction === "Cleared" ? "default" : "destructive"}
            >
              {isVerifying ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : verifyAction === "Cleared" ? (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {verifyAction === "Cleared" ? "Confirm Clearance" : `Confirm ${verifyAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
