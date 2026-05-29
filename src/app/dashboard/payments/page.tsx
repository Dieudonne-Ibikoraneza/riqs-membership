"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Wallet, AlertCircle, CheckCircle2, Clock, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";

// ─── Payment Dialog ──────────────────────────────────────────────────────────

function PaymentSubmitDialog({
  open,
  onClose,
  applicationId,
  isFirm,
  practiceLocation,
}: {
  open: boolean;
  onClose: () => void;
  applicationId?: string;
  isFirm: boolean;
  practiceLocation: string;
}) {
  const queryClient = useQueryClient();
  const isRwandan = practiceLocation === "Rwandan";

  const [form, setForm] = useState({
    amount: "",
    currency: isRwandan ? "RWF" : "USD",
    txType: "Annual_Renewal",
    paymentMethod: isRwandan ? "MTN_Momo" : "Bank_Transfer",
    transactionReference: "",
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: applicantServices.submitPayment,
    onSuccess: () => {
      toast.success("Payment submitted successfully — pending administrative verification.");
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.payments() });
      onClose();
      setForm({
        amount: "",
        currency: isRwandan ? "RWF" : "USD",
      txType: "Annual_Renewal",
      paymentMethod: isRwandan ? "MTN_Momo" : "Bank_Transfer",
        transactionReference: "",
      });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || "Failed to submit payment. Please try again.";
      toast.error(msg);
    },
  });

  function handleSubmit() {
    if (!form.amount || !form.transactionReference.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const numAmount = parseFloat(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    submit({
      applicationId: applicationId || undefined,
      amount: numAmount,
      currency: form.currency,
      txType: form.txType,
      paymentMethod: form.paymentMethod,
      transactionReference: form.transactionReference.trim(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">Submit Payment Record</DialogTitle>
          <DialogDescription>
            After making your payment via {isRwandan ? "Mobile Money or Bank Transfer" : "International Bank Transfer"}, 
            enter the reference code below. An administrator will verify and clear your transaction.
          </DialogDescription>
        </DialogHeader>

        {/* Info box */}
        <div className="rounded-md border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {isRwandan
              ? "Payments via MoMo Code: 604516. For bank transfers, obtain a bank reference slip."
              : "For international wire transfers, enter the SWIFT/bank reference code from your bank receipt."}
          </span>
        </div>

        <div className="space-y-4 py-1">
          {/* Transaction Type */}
          <div className="space-y-1.5">
            <Label htmlFor="txType">Payment type</Label>
            <Select
              value={form.txType}
              onValueChange={(v) => setForm((f) => ({ ...f, txType: v }))}
            >
              <SelectTrigger id="txType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Processing_Fee">Processing Fee</SelectItem>
                <SelectItem value="First_Year_Fee">First Year Fee</SelectItem>
                <SelectItem value="Annual_Renewal">Annual Renewal</SelectItem>
                <SelectItem value="Stamp_Fee">Stamp Fee</SelectItem>
                <SelectItem value="APC_Fee">APC Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount + Currency Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RWF">RWF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="any"
                placeholder={form.currency === "RWF" ? "50000" : "100"}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MTN_Momo">MTN Mobile Money (MoMo)</SelectItem>
                <SelectItem value="Bank_Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Card_Payment">Card Payment</SelectItem>
                <SelectItem value="Manual_Cash">Cash (Office)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Reference */}
          <div className="space-y-1.5">
            <Label htmlFor="transactionRef">
              Transaction reference / receipt code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="transactionRef"
              placeholder={form.paymentMethod === "MTN_Momo" ? "e.g. TXN1234567890" : "e.g. REF-BANK-2025-001"}
              value={form.transactionReference}
              onChange={(e) =>
                setForm((f) => ({ ...f, transactionReference: e.target.value }))
              }
            />
            <p className="text-[11px] text-muted-foreground">
              This must match the reference on your proof of payment. The admin team may contact you if it cannot be verified.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit for verification
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status Badge Helper ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "Cleared")
    return (
      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium gap-1">
        <CheckCircle2 className="h-3 w-3" /> Cleared
      </Badge>
    );
  if (status === "Pending_Verification")
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-medium gap-1">
        <Clock className="h-3 w-3" /> Pending Verification
      </Badge>
    );
  if (status === "Unpaid")
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-medium gap-1">
        <AlertCircle className="h-3 w-3" /> Unpaid
      </Badge>
    );
  return (
    <Badge className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-none font-medium">
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Payments() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  const isFirm =
    data?.application?.entityType === "Firm" ||
    data?.profile?.membershipClass?.includes("Firm");
  const practiceLocation = data?.application?.practiceLocation || "Rwandan";
  const isRwandan = practiceLocation === "Rwandan";
  const feeNumber = (data?.application as any)?.annual_renewal_fee || (isRwandan ? 50000 : 100);
  const feeAmount = isRwandan
    ? `RWF ${Number(feeNumber).toLocaleString()}`
    : `USD ${Number(feeNumber).toLocaleString()}`;
  const renewalDesc = isFirm ? "Company Annual Subscription" : "Annual Renewal";

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: queryKeys.applicant.payments(),
    queryFn: applicantServices.getPaymentHistory,
  });

  const transactions = paymentsData?.transactions || [];
  const totalPaid = transactions
    .filter((tx: any) => tx.status === "Cleared")
    .reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);
  const pendingCount = transactions.filter(
    (tx: any) => tx.status === "Pending_Verification"
  ).length;

  return (
    <>
      <PaymentSubmitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        applicationId={data?.application?.id}
        isFirm={!!isFirm}
        practiceLocation={practiceLocation}
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Payments &amp; Renewals</h1>
          <p className="text-sm text-muted-foreground font-sans">
            Track your subscription payments and submit proof of annual renewal.
          </p>
        </div>

        {/* Pending verification notice */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              You have <strong>{pendingCount}</strong> payment{pendingCount > 1 ? "s" : ""} awaiting
              administrative verification. You will be notified once cleared.
            </span>
          </motion.div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {/* Next renewal card */}
          <Card className="md:col-span-2 border-gold/45 bg-gold/5 dark:bg-gold/10">
            <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gold text-[#1a1a1a]">
                  <Wallet className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">{renewalDesc}</div>
                  <div className="text-lg font-bold text-navy mt-0.5">
                    {isLoading ? "Loading…" : feeAmount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {isRwandan ? "Pay via MoMo Code: 604516" : "Pay via international bank transfer"}
                  </div>
                </div>
              </div>
              <Button
                className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold shrink-0"
                onClick={() => setDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Submit payment record
              </Button>
            </CardContent>
          </Card>

          {/* Lifetime Paid card */}
          <Card className="border-zinc-100 dark:border-zinc-800">
            <CardContent className="p-6">
              <div className="text-sm text-muted-foreground">Total paid (lifetime)</div>
              <div className="mt-1 text-2xl font-bold text-navy">
                {isPaymentsLoading ? "…" : `RWF ${totalPaid.toLocaleString()}`}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {transactions.filter((tx: any) => tx.status === "Cleared").length} cleared
                transaction{transactions.filter((tx: any) => tx.status === "Cleared").length !== 1 ? "s" : ""}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History Ledger */}
        <Card className="border-zinc-100 dark:border-zinc-800 overflow-hidden">
          <CardHeader className="border-b border-zinc-50 dark:border-zinc-800 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-navy">Payment history</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-navy border-zinc-200 hover:bg-navy/5"
              onClick={() => setDialogOpen(true)}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" /> Record new payment
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-navy/5 dark:bg-navy/10 border-b border-zinc-100 dark:border-zinc-800">
                    <TableHead className="text-navy font-semibold">Reference</TableHead>
                    <TableHead className="text-navy font-semibold">Date</TableHead>
                    <TableHead className="text-navy font-semibold">Type</TableHead>
                    <TableHead className="text-navy font-semibold">Method</TableHead>
                    <TableHead className="text-navy font-semibold">Amount</TableHead>
                    <TableHead className="text-navy font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPaymentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Loading payment history…
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <div className="font-medium">No payment records yet</div>
                        <div className="text-xs mt-1">
                          Use the button above to record your annual payment after completing the transfer.
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx: any, index: number) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800"
                      >
                        <TableCell className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                          {tx.transactionReference}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-700 dark:text-zinc-350 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {tx.txType.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                          {tx.paymentMethod?.replace(/_/g, " ") || "—"}
                        </TableCell>
                        <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {tx.currency} {Number(tx.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={tx.status} />
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
