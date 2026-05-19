"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Send, Paperclip, Users } from "lucide-react";
import { MEMBERS } from "@/lib/mock-data";
import { toast } from "sonner";
import { motion } from "framer-motion";

const TEMPLATES = {
  none: "",
  welcome: "Dear {{name}},\n\nWelcome to RIQS. Your membership has been approved...",
  renewal: "Dear {{name}},\n\nThis is a reminder that your annual RIQS membership is due for renewal...",
  cpd: "Dear {{name}},\n\nWe are pleased to invite you to our upcoming CPD session...",
};

export default function Email() {
  const [tpl, setTpl] = useState("none");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState("all");

  const recipients = filter === "all" ? MEMBERS.length
    : filter === "active" ? MEMBERS.filter(m => m.status === "Active").length
    : filter === "mentorship" ? MEMBERS.filter(m => m.status === "In Mentorship").length
    : MEMBERS.filter(m => m.status === "Expired").length;

  const setTemplate = (k: string) => {
    setTpl(k);
    setBody(TEMPLATES[k as keyof typeof TEMPLATES] || "");
    if (k === "welcome") setSubject("Welcome to RIQS");
    if (k === "renewal") setSubject("RIQS annual renewal reminder");
    if (k === "cpd") setSubject("CPD invitation");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Email System</h1>
        <p className="text-sm text-muted-foreground font-sans">Send direct emails to a single member or in bulk to a filtered group.</p>
      </div>

      <Tabs defaultValue="bulk">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
          <TabsTrigger value="single" className="text-sm font-medium">Single member</TabsTrigger>
          <TabsTrigger value="bulk" className="text-sm font-medium">Bulk email</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-zinc-100 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-navy">Direct email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="to-member">To (member)</Label>
                  <Input id="to-member" placeholder="Search member by name or ID..." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="single-subject">Subject</Label>
                  <Input id="single-subject" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="single-msg">Message</Label>
                  <Textarea id="single-msg" rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="Compose..." />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline"><Paperclip className="mr-2 h-4 w-4" />Attach file</Button>
                  <Button 
                    className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none" 
                    onClick={() => {
                      toast.success("Email sent");
                      setSubject("");
                      setBody("");
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="bulk" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-zinc-100 dark:border-zinc-800">
              <CardHeader>
                <CardTitle className="text-navy">Bulk email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="group">Recipient group</Label>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger id="group">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All members</SelectItem>
                        <SelectItem value="active">Active members</SelectItem>
                        <SelectItem value="mentorship">In Mentorship</SelectItem>
                        <SelectItem value="expired">Expired memberships</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="template">Template</Label>
                    <Select value={tpl} onValueChange={setTemplate}>
                      <SelectTrigger id="template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        <SelectItem value="welcome">Welcome</SelectItem>
                        <SelectItem value="renewal">Renewal reminder</SelectItem>
                        <SelectItem value="cpd">CPD invitation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="rounded-md bg-navy/5 dark:bg-navy/15 px-3 py-2 text-sm text-navy dark:text-gold flex items-center gap-2 font-medium">
                  <Users className="h-4 w-4 text-[#0b3363]" /> 
                  <span><strong>{recipients}</strong> recipients will receive this broadcast</span>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-subject">Subject</Label>
                  <Input id="bulk-subject" value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-msg">Message</Label>
                  <Textarea id="bulk-msg" rows={8} value={body} onChange={e => setBody(e.target.value)} placeholder="Compose..." />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline"><Paperclip className="mr-2 h-4 w-4" />Attach file</Button>
                  <Button 
                    className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none" 
                    onClick={() => {
                      toast.success(`Bulk email queued to ${recipients} members`);
                      setSubject("");
                      setBody("");
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />Send to {recipients}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
