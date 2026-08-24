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
import { Smartphone, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("250")) return digits;
  if (digits.startsWith("0")) return `250${digits.slice(1)}`;
  return digits;
}

type Stage = "form" | "pending" | "success" | "failed";

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
  /** Starts the payment; must resolve to the transaction id to poll. */
  initiate: (mobilephone: string) => Promise<{ transactionId: string; message?: string }>;
  /** Polls a previously-initiated payment for its current status. */
  checkStatus: (transactionId: string) => Promise<{ status: string; rejectionReason?: string | null }>;
  /** Called once the payment is confirmed Paid. */
  onSuccess: () => void;
  successMessage?: string;
}

export function MomoPaymentDialog({
  open,
  onOpenChange,
  title,
  description,
  amount,
  currency = "RWF",
  defaultPhone,
  initiate,
  checkStatus,
  onSuccess,
  successMessage = "Payment confirmed.",
}: MomoPaymentDialogProps) {
  const [stage, setStage] = useState<Stage>("form");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

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
      setStage("form");
      setPhone(defaultPhone || "");
      setError(null);
      setTransactionId(null);
      setTimedOut(false);
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

  return (
    <Dialog open={open} onOpenChange={(next) => { if (stage !== "pending" || !next) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-gold" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {stage === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4 pt-1"
            >
              <div className="rounded-lg border border-gold/30 bg-gold/10 p-4 text-center">
                <p className="text-xs text-muted-foreground">Amount due</p>
                <p className="text-2xl font-bold text-navy">
                  {currency} {Number(amount).toLocaleString()}
                </p>
              </div>

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
                onClick={() => { setStage("form"); setError(null); }}
                className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-bold"
              >
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {stage === "form" && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3 w-3" /> Secured by IntouchPay Mobile Money.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
