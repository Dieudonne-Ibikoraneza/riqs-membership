"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getMyTickets, createTicket, SupportTicket } from "@/lib/api/support";

export default function MemberSupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    subject: "",
    category: "",
    priority: "Medium",
    message: ""
  });

  const fetchTickets = async () => {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err: any) {
      toast.error("Failed to load your inquiries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.category || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setSubmitting(true);
    try {
      await createTicket(form);
      toast.success("Inquiry submitted successfully!");
      setDialogOpen(false);
      setForm({ subject: "", category: "", priority: "Medium", message: "" });
      fetchTickets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Open</Badge>;
      case "In Progress":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Progress</Badge>;
      case "Resolved":
      case "Closed":
        return <Badge className="bg-zinc-100 text-zinc-800 border-zinc-200">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy tracking-tight">Support & Inquiries</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit questions, report issues, or contact the administration team.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-navy hover:bg-navy/90 text-white gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          New Inquiry
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="border-dashed border-2 bg-zinc-50/50">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">No Inquiries Yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">You haven't submitted any questions or support requests. If you need help, feel free to open a new inquiry.</p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">Create your first inquiry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group overflow-hidden"
              onClick={() => router.push(`/dashboard/support/${ticket.id}`)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-navy opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    {ticket.status === 'Resolved' || ticket.status === 'Closed' ? (
                      <CheckCircle2 className="h-5 w-5 text-zinc-400" />
                    ) : ticket.status === 'In Progress' ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 line-clamp-1 group-hover:text-blue-700 transition-colors">
                      {ticket.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                      <span className="font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-full">{ticket.category}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {ticket._count?.replies || 0} replies
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center sm:flex-col sm:items-end gap-2 justify-between">
                  {getStatusBadge(ticket.status)}
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit New Inquiry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Application Issue">Application Issue</SelectItem>
                  <SelectItem value="Payment / Invoice">Payment / Invoice</SelectItem>
                  <SelectItem value="Technical Support">Technical Support</SelectItem>
                  <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                  <SelectItem value="Complaint">Complaint</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Input 
                id="subject" 
                placeholder="Brief summary of your inquiry" 
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message <span className="text-red-500">*</span></Label>
              <Textarea 
                id="message" 
                placeholder="Provide detailed information about your inquiry or issue..." 
                className="min-h-[150px] resize-none"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-navy hover:bg-navy/90" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
