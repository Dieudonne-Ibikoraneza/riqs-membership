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
import { AlertCircle, CheckCircle2, Search, XCircle, RefreshCw, FileText, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { axiosClient } from "@/lib/axiosClient";
import { cn } from "@/lib/utils";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("All");
  const [selectedTx, setSelectedTx] = useState<AdminPaymentTransaction | null>(null);
  const [verifyAction, setVerifyAction] = useState<"Cleared" | "Failed">("Cleared");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingCpd, setViewingCpd] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminPayments", page, status],
    queryFn: () => getPendingPayments(page, 15, status),
  });

  const { mutate: handleVerify, isPending: isVerifying } = useMutation({
    mutationFn: () => verifyPayment(selectedTx!.id, verifyAction, rejectionReason),
    onSuccess: (res) => {
      let msg = res.message;
      if (!msg) {
        msg = verifyAction === "Failed" 
          ? "Payment marked as failed and sent back to user for re-upload."
          : `Payment ${verifyAction.toLowerCase()} successfully.`;
      }
      toast.success(msg);
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
    setViewingCpd(false);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "Cleared":
        return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">Cleared</Badge>;
      case "Pending_Verification":
        return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400">Pending</Badge>;
      case "Failed":
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

  if (selectedTx) {
    const isImage = selectedTx.receiptFileName?.match(/\.(jpeg|jpg|gif|png)$/i) != null || selectedTx.receiptUrl?.match(/\.(jpeg|jpg|gif|png)$/i) != null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('riqs.auth.token') : '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const activeDocId = viewingCpd ? (selectedTx as any).cpdDocumentUrl : selectedTx.receiptUrl;
    const documentUrl = activeDocId ? `${baseUrl}/files/download/${activeDocId}?token=${token}` : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="text-navy hover:text-navy hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { setSelectedTx(null); setRejectionReason(""); setIsDialogOpen(false); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to queue
          </Button>
          <div className="flex items-center gap-2">
            {getStatusBadge(selectedTx.status)}
            {selectedTx.status === "Pending_Verification" && (
              <>
                <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20" onClick={() => { setVerifyAction("Failed"); setIsDialogOpen(true); }}>
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> Fail
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald" onClick={() => { setVerifyAction("Cleared"); setIsDialogOpen(true); }}>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Clear
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Left Column: Details & Actions */}
          <div className="space-y-4 lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-zinc-100 dark:border-zinc-800">
                <CardHeader className="py-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                  <CardTitle className="text-sm font-bold text-navy">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800/60">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-semibold text-navy dark:text-gold">{selectedTx.transactionReference}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800/60">
                    <span className="text-muted-foreground">Member</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedTx.full_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800/60">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{selectedTx.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800/60">
                    <span className="text-muted-foreground">Type</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatTxType(selectedTx.txType)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800/60">
                    <span className="text-muted-foreground">Method</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatMethod(selectedTx.paymentMethod)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800/60">
                    <span className="text-muted-foreground">Date</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{format(new Date(selectedTx.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-navy dark:text-gold text-base">{formatAmount(selectedTx.amount, selectedTx.currency)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Document Viewer */}
          <div className="lg:col-span-3">
            <Card className="border-zinc-100 dark:border-zinc-800 flex flex-col sticky top-2 h-[calc(100vh-5rem)]">
              <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800 py-3 px-4 shrink-0">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-sm font-bold text-navy">
                    {viewingCpd ? "CPD Document" : "Receipt Document"}
                  </CardTitle>
                  {(selectedTx as any)?.cpdDocumentUrl && (
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-md">
                      <button 
                        onClick={() => setViewingCpd(false)} 
                        className={`px-3 py-1 text-xs font-medium rounded-sm ${!viewingCpd ? "bg-white shadow-sm text-navy" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        Receipt
                      </button>
                      <button 
                        onClick={() => setViewingCpd(true)} 
                        className={`px-3 py-1 text-xs font-medium rounded-sm ${viewingCpd ? "bg-white shadow-sm text-navy" : "text-zinc-500 hover:text-zinc-700"}`}
                      >
                        CPD Report
                      </button>
                    </div>
                  )}
                </div>
                {documentUrl && (
                  <Button variant="ghost" size="sm" onClick={() => window.open(documentUrl, '_blank')} className="h-8">
                    <FileText className="mr-2 h-4 w-4" />
                    Open Original
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950/50">
                {documentUrl ? (
                  isImage ? (
                    <div className="w-full h-full p-4 relative flex items-center justify-center">
                      <ImageViewer src={documentUrl} alt="Receipt" fileName={selectedTx.receiptFileName || "receipt.png"} />
                    </div>
                  ) : (
                    <PDFViewer src={documentUrl} fileName={selectedTx.receiptFileName || "receipt.pdf"} />
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-8 text-center">
                    <FileText className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-sm font-medium">No document uploaded</p>
                    <p className="text-xs mt-1">This transaction does not have an attached receipt.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Verification Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                You are about to mark this transaction as <strong>{verifyAction}</strong>.
                {verifyAction !== "Cleared" && " Please provide a reason below."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {verifyAction !== "Cleared" && (
                <div className="grid gap-2">
                  <Label htmlFor="dialog-reason">Reason (Required)</Label>
                  <Textarea
                    id="dialog-reason"
                    placeholder={`Enter the reason for ${verifyAction.toLowerCase()}...`}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="resize-none"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isVerifying}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleVerify()} 
                disabled={isVerifying || (verifyAction !== "Cleared" && !rejectionReason.trim())}
                variant={verifyAction === "Cleared" ? "default" : "destructive"}
              >
                {isVerifying && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

function Avatar({ name, url }: { name: string; url?: string }) {
  const [token, setToken] = React.useState("");
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("riqs.auth.token") || "");
    }
  }, []);

  const fullUrl = url && token ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/files/download/${url}?token=${token}` : null;

  if (fullUrl) {
    return (
      <img
        src={fullUrl}
        alt={name}
        className="flex h-10 w-10 shrink-0 object-cover rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
      />
    );
  }

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
                <SelectItem value="All">All Transactions</SelectItem>
                <SelectItem value="Pending_Verification">Pending Verification</SelectItem>
                <SelectItem value="Cleared">Cleared</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
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
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Amount</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <RefreshCw className="mb-2 h-6 w-6 animate-spin" />
                        Loading queue...
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 h-32 text-center text-red-500">
                      Failed to load transactions.
                    </td>
                  </tr>
                ) : data?.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 h-32 text-center text-muted-foreground">
                      No transactions found for this status.
                    </td>
                  </tr>
                ) : (
                  data?.transactions.map((tx: any, i: number) => (
                    <tr
                      key={tx.id}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5 cursor-pointer",
                        i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10"
                      )}
                      onClick={() => openVerifyDialog(tx)}
                    >
                      <td className="px-5 py-4 text-xs font-semibold text-navy dark:text-gold">{tx.transactionReference}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={tx.full_name || "Unknown"} />
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{tx.full_name || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">{tx.email || "No email"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm">{formatTxType(tx.txType)}</td>
                      <td className="px-5 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">{formatAmount(tx.amount, tx.currency)}</td>
                      <td className="px-5 py-4 text-xs text-zinc-650 dark:text-zinc-400 font-medium">
                        {format(new Date(tx.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end">{getStatusBadge(tx.status)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
