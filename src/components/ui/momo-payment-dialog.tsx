"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Smartphone,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  Landmark,
  UploadCloud,
  FileCheck2,
  FileText,
  ArrowLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { applicantServices } from "@/services/applicant.services";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("250")) return digits;
  if (digits.startsWith("0")) return `250${digits.slice(1)}`;
  return digits;
}

type Stage =
  | "method"
  | "form"
  | "pending"
  | "success"
  | "failed"
  | "manual"
  | "manual-submitted";

const POLL_INTERVAL_MS = 4000;
const ACTIVE_POLL_TIMEOUT_MS = 90 * 1000;

export interface MomoPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  amount: number;
  currency?: string;
  defaultPhone?: string;
  applicationId: string;
  /** Starts the payment; must resolve to the transaction id to poll. */
  initiate: (mobilephone: string) => Promise<{ transactionId: string; message?: string }>;
  /** Polls a previously-initiated payment for its current status. */
  checkStatus: (transactionId: string) => Promise<{ status: string; rejectionReason?: string | null }>;
  /** Called once the payment is confirmed Paid. */
  onSuccess: () => void;
  successMessage?: string;
  /** Reason from a previous attempt that ended in Failed status, if any — shown immediately on open instead of the method picker. */
  priorFailureReason?: string | null;
}

export function MomoPaymentDialog({
  open,
  onOpenChange,
  title,
  description,
  amount,
  currency = "RWF",
  defaultPhone,
  applicationId,
  initiate,
  checkStatus,
  onSuccess,
  successMessage = "Payment confirmed.",
  priorFailureReason,
}: MomoPaymentDialogProps) {
  const [stage, setStage] = useState<Stage>("method");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadline = useRef<number>(0);

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect -- resetting local state when this
     controlled dialog opens is intentional; there's no other lifecycle hook to reset on. */
  useEffect(() => {
    if (open) {
      // A previous attempt (gateway rejection or admin-rejected manual proof) left this
      // application's Processing Fee in a Failed state — surface that immediately instead
      // of the method picker, so the member isn't left wondering why their earlier attempt
      // seemingly went nowhere.
      if (priorFailureReason) {
        setStage("failed");
        setError(priorFailureReason);
      } else {
        setStage("method");
        setError(null);
      }
      setPhone(defaultPhone || "");
      setTransactionId(null);
      setTimedOut(false);
      setProofFile(null);
      setUploadProgress(0);
    } else {
      stopPolling();
    }
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const beginPolling = (txId: string) => {
    setTransactionId(txId);
    setStage("pending");
    setTimedOut(false);
    pollDeadline.current = Date.now() + ACTIVE_POLL_TIMEOUT_MS;
    stopPolling();

    pollTimer.current = setInterval(async () => {
      try {
        const res = await checkStatus(txId);
        if (res.status === "Paid") {
          stopPolling();
          setStage("success");
          setTimeout(() => onSuccess(), 1400);
        } else if (res.status === "Failed") {
          stopPolling();
          setError(res.rejectionReason || "The payment was not completed.");
          setStage("failed");
        } else if (Date.now() > pollDeadline.current) {
          stopPolling();
          setTimedOut(true);
        }
      } catch {
        // Transient network hiccup — keep polling until the deadline.
        if (Date.now() > pollDeadline.current) {
          stopPolling();
          setTimedOut(true);
        }
      }
    }, POLL_INTERVAL_MS);
  };

  const handlePay = async () => {
    const normalized = normalizePhone(phone);
    if (normalized.length < 11) {
      setError("Enter a valid mobile money number (e.g. 0788123456).");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await initiate(normalized);
      beginPolling(res.transactionId);
    } catch (err) {
      const response = (err as { response?: { status?: number; data?: { error?: string; transactionId?: string } } })?.response;
      if (response?.status === 409 && response.data?.transactionId) {
        // Already in progress (e.g. dialog was closed and reopened) — resume polling it.
        beginPolling(response.data.transactionId);
      } else {
        setError(response?.data?.error || "Failed to start the payment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRecheck = async () => {
    if (!transactionId) return;
    beginPolling(transactionId);
  };

  const handleUploadProof = async () => {
    if (!proofFile) {
      setError("Select a file to upload.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("documentType", "payment");
      formData.append("file", proofFile);
      await applicantServices.uploadDocument(formData, (progressEvent) => {
        if (progressEvent.total) {
          setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      });
      setStage("manual-submitted");
    } catch (err) {
      const response = (err as { response?: { data?: { error?: string } } })?.response;
      setError(response?.data?.error || "Failed to upload your proof of payment. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (stage !== "pending" || !next) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-center">
          <p className="text-xs text-muted-foreground">Amount due</p>
          <p className="text-2xl font-bold text-navy">
            {currency} {Number(amount).toLocaleString()}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {stage === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3 pt-1"
            >
              <p className="text-sm font-medium text-navy">How would you like to pay?</p>

              <button
                type="button"
                onClick={() => setStage("form")}
                className="group flex w-full items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-left transition hover:border-gold hover:bg-gold/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Smartphone className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-navy">Mobile Money</span>
                  <span className="block text-xs text-muted-foreground">Instant — confirmed automatically on your phone.</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition" />
              </button>

              <button
                type="button"
                onClick={() => setStage("manual")}
                className="group flex w-full items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-left transition hover:border-gold hover:bg-gold/5"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Landmark className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-navy">Bank Transfer / Other Method</span>
                  <span className="block text-xs text-muted-foreground">Upload your proof of payment for our team to verify.</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition" />
              </button>
            </motion.div>
          )}

          {stage === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 pt-1"
            >
              <button
                type="button"
                onClick={() => setStage("method")}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-navy transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Choose a different method
              </button>

              <div className="space-y-2">
                <Label htmlFor="momo-phone">Mobile Money number</Label>
                <Input
                  id="momo-phone"
                  placeholder="0788123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  You&rsquo;ll receive a prompt on this phone to approve the payment.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                onClick={handlePay}
                disabled={isSubmitting || !phone}
                className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending request...</>
                ) : (
                  "Pay with Mobile Money"
                )}
              </Button>

              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Payments are processed securely.
              </p>
            </motion.div>
          )}

          {stage === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 pt-1"
            >
              <button
                type="button"
                onClick={() => setStage("method")}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-navy transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Choose a different method
              </button>

              <div className="space-y-2">
                <Label htmlFor="proof-file">Proof of payment</Label>

                {!proofFile ? (
                  <label
                    htmlFor="proof-file"
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-6 text-center transition hover:border-gold hover:bg-gold/5"
                  >
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-navy font-medium">Click to upload a bank slip or receipt</span>
                    <span className="text-xs text-muted-foreground">PDF, JPG or PNG</span>
                  </label>
                ) : isSubmitting ? (
                  <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-800/30 animate-pulse" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="h-11 w-11 rounded-lg bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 shadow-inner">
                        <FileText className="h-5 w-5 animate-bounce" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-navy dark:text-zinc-100">{proofFile.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold tracking-wide">
                            Uploading securely... {uploadProgress}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-blue-200/60 dark:bg-blue-900/60 rounded-full overflow-hidden mt-3 relative z-10">
                      <div
                        className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                    <div className="h-11 w-11 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate text-navy dark:text-zinc-100">{proofFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{(proofFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0 rounded-full"
                      onClick={() => setProofFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <input
                  id="proof-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={isSubmitting}
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                />

                <p className="text-xs text-muted-foreground">
                  Our secretariat team will review your proof and confirm the payment. You&rsquo;ll be notified once it&rsquo;s verified.
                </p>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                onClick={handleUploadProof}
                disabled={isSubmitting || !proofFile}
                className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                ) : (
                  "Submit Proof of Payment"
                )}
              </Button>
            </motion.div>
          )}

          {stage === "manual-submitted" && (
            <motion.div
              key="manual-submitted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                <FileCheck2 className="h-16 w-16 text-emerald-600" />
              </motion.div>
              <p className="font-semibold text-navy">Proof of payment submitted</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Our secretariat team will verify it shortly. Once approved, come back here to submit your application.
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
              >
                Got it
              </Button>
            </motion.div>
          )}

          {stage === "pending" && (
            <motion.div
              key="pending"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              <div className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/30" />
                <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
                  <Smartphone className="h-8 w-8 text-gold" />
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-navy">Check your phone</p>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Approve the Mobile Money prompt sent to <span className="font-medium">{normalizePhone(phone)}</span> to complete this payment.
                </p>
              </div>

              {timedOut ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Still waiting on confirmation — this can take a moment. You can keep this open or check back from your dashboard later.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleManualRecheck}>
                    Check again
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Waiting for confirmation...
                </div>
              )}
            </motion.div>
          )}

          {stage === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                <CheckCircle2 className="h-16 w-16 text-emerald-600" />
              </motion.div>
              <p className="font-semibold text-navy">{successMessage}</p>
            </motion.div>
          )}

          {stage === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-3 py-6 text-center"
            >
              <XCircle className="h-14 w-14 text-red-600" />
              <div className="space-y-1">
                <p className="font-semibold text-navy">Payment not completed</p>
                <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
              </div>
              <Button
                onClick={() => { setStage("method"); setError(null); }}
                className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
