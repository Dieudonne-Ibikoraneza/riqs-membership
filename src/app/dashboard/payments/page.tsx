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
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";

export default function Payments() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  const isFirm = data?.application?.entityType === "Firm" || data?.profile?.membershipClass?.includes("Firm");
  const feeNumber = (data?.application as any)?.annual_renewal_fee || 50000;
  const feeAmount = `RWF ${Number(feeNumber).toLocaleString()}`;
  const renewalDesc = isFirm ? "Company Annual Subscription" : "Annual Renewal";

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: queryKeys.applicant.payments(),
    queryFn: applicantServices.getPaymentHistory,
  });

  const transactions = paymentsData?.transactions || [];
  
  // Calculate total paid
  const totalPaid = transactions
    .filter((tx: any) => tx.status === 'Cleared')
    .reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);

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
                  {isLoading ? "Loading..." : `31 Dec 2025 · ${feeAmount}`}
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
            <div className="mt-1 text-2xl font-bold text-navy">{isPaymentsLoading ? "..." : `RWF ${totalPaid.toLocaleString()}`}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              {transactions.filter((tx: any) => tx.status === 'Cleared').length} successful verification cycles
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
                {isPaymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading payment history...
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No payment records found.
                    </TableCell>
                  </TableRow>
                ) : transactions.map((tx: any) => (
                  <TableRow
                    key={tx.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">
                      {tx.transactionReference}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-700 dark:text-zinc-350">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">{tx.txType.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {tx.currency} {Number(tx.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        tx.status === 'Unpaid' ? "bg-red-100 text-red-700 hover:bg-red-100 border-none font-medium" :
                        tx.status === 'Pending_Verification' ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-medium" :
                        tx.status === 'Cleared' ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-medium" :
                        "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-none font-medium"
                      }>
                        {tx.status.replace(/_/g, ' ')}
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
