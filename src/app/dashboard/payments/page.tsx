"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Wallet, AlertCircle, CheckCircle2, Clock, Loader2, UploadCloud, FileText, Trash2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { cn } from "@/lib/utils";

// --- Status Badge Helper ---

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

// --- Main Page ---

export default function Payments() {
  const queryClient = useQueryClient();

  const { data: rawData, isLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });
  const data = rawData as any;

  const { data: rawPaymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: queryKeys.applicant.payments(),
    queryFn: applicantServices.getPaymentHistory,
  });
  const paymentsData = rawPaymentsData as any;

  const [file, setFile] = useState<File | null>(null);
  const [cpdFile, setCpdFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { mutate: submit, isPending } = useMutation<any, any, any>({
    mutationFn: applicantServices.submitPayment,
    onSuccess: () => {
      toast.success("Payment submitted successfully — pending administrative verification.");
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.payments() });
      setFile(null);
      setCpdFile(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || "Failed to submit payment. Please try again.";
      toast.error(msg);
    },
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

  const transactions = paymentsData?.transactions || [];
  const unpaidTx = transactions.find((tx: any) => tx.status === "Failed") || transactions.find((tx: any) => tx.status === "Unpaid");

  const totalPaid = transactions
    .filter((tx: any) => tx.status === "Cleared")
    .reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);
  const pendingCount = transactions.filter(
    (tx: any) => tx.status === "Pending_Verification"
  ).length;

  const checklist = data?.application?.documentChecklist || [];
  const paymentDoc = checklist.find((d: any) => d.k.toLowerCase().includes("payment") || d.n.toLowerCase().includes("payment"));
  const appPaymentDocName = paymentDoc?.n || "Payment Document / Receipt";
  const appPaymentDocCode = paymentDoc?.k || undefined;

  // --- Successive Payment Logic ---
  const hasProcessingFeeTx = transactions.some((tx: any) => tx.txType === "Processing_Fee");
  const isAppApproved = data?.application?.status === "Approved" || data?.application?.status === "Active";
  const isAppPending = data?.application?.status && !isAppApproved && data?.application?.status !== "Draft" && data?.application?.status !== "Correction_Required";

  let displayDesc = renewalDesc;
  let displayAmount = feeAmount;
  let defaultTxType = "Annual_Renewal";
  let defaultAmountNum = feeNumber;
  let displayDocName = "Annual Renewal Receipt";
  let paymentCode = "Annual_Renewal_receipt";
  let canUpload = true;
  let isUpToDate = false;

  const membershipExpiresAt = data?.profile?.membershipExpiresAt ? new Date(data.profile.membershipExpiresAt) : null;
  const isExpired = membershipExpiresAt ? membershipExpiresAt < new Date() : false;
  // Prompt renewal if within 30 days of expiry
  const isExpiringSoon = membershipExpiresAt && (membershipExpiresAt.getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000);
  const needsRenewal = isExpired || isExpiringSoon;

  if (unpaidTx) {
    displayDesc = unpaidTx.status === "Failed" ? `${unpaidTx.txType.replace(/_/g, " ")} Failed` : unpaidTx.txType.replace(/_/g, " ") + " Due";
    displayAmount = `${unpaidTx.currency} ${Number(unpaidTx.amount).toLocaleString()}`;
    defaultTxType = unpaidTx.txType;
    defaultAmountNum = unpaidTx.amount;
    
    if (unpaidTx.txType === "Processing_Fee") {
      displayDocName = appPaymentDocName || "Processing Fee Receipt";
      paymentCode = appPaymentDocCode || "Processing_Fee_receipt";
    } else {
      displayDocName = `${unpaidTx.txType.replace(/_/g, " ")} Receipt`;
      paymentCode = `${unpaidTx.txType}_receipt`;
    }
  } else if (!hasProcessingFeeTx && !isAppApproved) {
    // Hasn't submitted application fee
    const processingFee = data?.application?.category?.processingFee || (isRwandan ? 50000 : 100);
    const currency = data?.application?.category?.currency || (isRwandan ? "RWF" : "USD");
    displayDesc = appPaymentDocName || "Processing Fee";
    displayAmount = `${currency} ${Number(processingFee).toLocaleString()}`;
    defaultTxType = "Processing_Fee";
    defaultAmountNum = processingFee;
    displayDocName = appPaymentDocName || "Processing Fee Receipt";
    paymentCode = appPaymentDocCode || "Processing_Fee_receipt";
  } else if (!unpaidTx && hasProcessingFeeTx && isAppPending) {
    // App is under review, processing fee paid
    displayDesc = "Application under review";
    displayAmount = "Awaiting Admin";
    canUpload = false;
  } else if (isAppApproved && !unpaidTx && pendingCount === 0) {
    if (needsRenewal) {
      displayDesc = isExpired ? "Membership Expired (Annual Renewal Due)" : "Membership Expiring Soon (Annual Renewal Due)";
      displayAmount = feeAmount;
      canUpload = true;
      isUpToDate = false;
      defaultTxType = "Annual_Renewal";
      defaultAmountNum = feeNumber;
      displayDocName = "Annual Renewal Receipt";
      paymentCode = "Annual_Renewal_receipt";
    } else {
      // App is approved and no unpaid/pending fees, and not expired
      displayDesc = "All Fees Up to Date";
      displayAmount = "No payment due";
      canUpload = false;
      isUpToDate = true;
    }
  } else if (isAppApproved && !unpaidTx && pendingCount > 0) {
    // App is approved but some fees are pending verification
    displayDesc = "Payment Under Review";
    displayAmount = "Awaiting Admin";
    canUpload = false;
  }

  async function handleUpload() {
    if (!file) {
      toast.error("Please upload your payment document/receipt.");
      return;
    }
    if (defaultTxType === "Annual_Renewal" && !cpdFile) {
      toast.error("Please upload your CPD / Annual Report document.");
      return;
    }

    const applicationId = data?.application?.id;
    if (!applicationId) {
      toast.error("Cannot upload receipt: Application ID is missing.");
      return;
    }

    let receiptUrl: string | undefined = undefined;
    let cpdUrl: string | undefined = undefined;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("applicationId", applicationId);
    formData.append("documentType", paymentCode);
    formData.append("skipTransaction", "true");
    
    const uploadToastId = toast.loading("Uploading receipt document...");
    try {
      const uploadRes = await applicantServices.uploadDocument(formData);
      if (uploadRes?.document?.id) {
        receiptUrl = uploadRes.document.id;
      }
      toast.success("Receipt uploaded successfully", { id: uploadToastId });
    } catch (err: any) {
      toast.error("Failed to upload receipt: " + (err?.response?.data?.error || err.message), { id: uploadToastId });
      setIsUploading(false);
      return;
    }

    if (cpdFile) {
      const cpdData = new FormData();
      cpdData.append("file", cpdFile);
      cpdData.append("applicationId", applicationId);
      cpdData.append("documentType", "CPD_Annual_Report");
      cpdData.append("skipTransaction", "true");
      try {
        const cpdRes = await applicantServices.uploadDocument(cpdData);
        if (cpdRes?.document?.id) cpdUrl = cpdRes.document.id;
      } catch (err: any) {
        toast.error("Failed to upload CPD document.");
        setIsUploading(false);
        return;
      }
    }

    setIsUploading(false);

    const generatedTxRef = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const numAmount = defaultAmountNum ? parseFloat(String(defaultAmountNum)) : 1;

    submit({
      applicationId: applicationId,
      amount: numAmount,
      currency: isRwandan ? "RWF" : "USD",
      txType: defaultTxType,
      paymentMethod: isRwandan ? "MTN_Momo" : "Bank_Transfer",
      transactionReference: generatedTxRef,
      receiptUrl,
      cpdDocumentUrl: cpdUrl,
    });
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Payments &amp; Renewals</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Track your subscription payments and submit proof of annual renewal.
        </p>
      </div>

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

      {unpaidTx?.status === "Failed" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Your payment proof was rejected.</span>
            <span>Reason: {unpaidTx.rejectionReason || "Invalid or missing documentation."}</span>
            <span>Please re-upload a valid proof of payment below.</span>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-3 items-start">
        {/* Next payment card */}
        <Card className="md:col-span-2 border-gold/45 bg-gold/5 dark:bg-gold/10">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gold text-[#1a1a1a]">
                {isUpToDate ? <CheckCircle className="h-6 w-6" /> : canUpload ? <Wallet className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground font-medium">{displayDesc}</div>
                <div className="text-xl font-bold text-navy mt-0.5">
                  {isLoading ? "Loading..." : displayAmount}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {isUpToDate ? "Your account is active and in good standing" : canUpload ? (isRwandan ? "Pay via MoMo Code: 604516" : "Pay via international bank transfer") : "Awaiting administrator review"}
                </div>
              </div>
            </div>

            {canUpload && (
              <div className="mt-2 pt-5 border-t border-gold/20">
                <Label className="text-navy font-semibold">{displayDocName} <span className="text-red-500">*</span></Label>
                <div className="mt-3">
                  {!file ? (
                    <label 
                      htmlFor="paymentFile" 
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 mb-2 text-gold" />
                        <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                          <span className="font-bold text-navy dark:text-gold hover:underline">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-zinc-500">PDF, JPG, PNG (Max 5MB)</p>
                      </div>
                      <input 
                        id="paymentFile" 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md shrink-0">
                          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="truncate pr-4">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{file.name}</p>
                          <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setFile(null)}
                          disabled={isUploading || isPending}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* CPD File Upload for Annual Renewal */}
                  {defaultTxType === "Annual_Renewal" && (
                    <div className="mt-6">
                      <Label className="text-navy font-semibold">CPD / Annual Report Document <span className="text-red-500">*</span></Label>
                      <div className="mt-3">
                        {!cpdFile ? (
                          <label 
                            htmlFor="cpdFile" 
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 mb-2 text-gold" />
                              <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                                <span className="font-bold text-navy dark:text-gold hover:underline">Click to upload CPD</span>
                              </p>
                              <p className="text-xs text-zinc-500">PDF, JPG, PNG (Max 5MB)</p>
                            </div>
                            <input 
                              id="cpdFile" 
                              type="file" 
                              className="hidden" 
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setCpdFile(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md shrink-0">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="truncate pr-4">
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{cpdFile.name}</p>
                                <p className="text-xs text-zinc-500">{(cpdFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setCpdFile(null)}
                                disabled={isUploading || isPending}
                                className="text-zinc-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {(file && (defaultTxType !== "Annual_Renewal" || cpdFile)) && (
                    <div className="mt-6 flex justify-end">
                      <Button 
                        type="button"
                        onClick={handleUpload}
                        disabled={isUploading || isPending}
                        className="bg-navy hover:bg-navy/90 text-white shadow-sm w-full md:w-auto"
                      >
                        {isUploading || isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" /> Submit Payment &amp; Renewal
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lifetime Paid card */}
        <Card className="border-zinc-100 dark:border-zinc-800">
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Total paid (lifetime)</div>
            <div className="mt-1 text-2xl font-bold text-navy">
              {isPaymentsLoading ? "..." : `RWF ${totalPaid.toLocaleString()}`}
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
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  {["Reference", "Date", "Type", "Method", "Amount", "Status"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isPaymentsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                      Loading payment history...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                      <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <div className="font-medium">No payment records yet</div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any, i: number) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800/80 transition-colors hover:bg-gold/5",
                        i % 2 === 1 && "bg-zinc-50/20 dark:bg-zinc-950/10"
                      )}
                    >
                      <td className="px-5 py-4 text-xs font-semibold text-navy dark:text-gold">
                        {tx.transactionReference}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-700 dark:text-zinc-350 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {tx.txType.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        {tx.paymentMethod?.replace(/_/g, " ") || "—"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {tx.currency} {Number(tx.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                    </motion.tr>
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
