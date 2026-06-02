"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Send,
  Paperclip,
  Users,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Heading1,
  Heading2,
  Type,
  Undo2,
  Redo2,
  X,
  FileText,
  Image as ImageIcon,
  File,
  Mail,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TemplateSidebar } from "@/components/TemplateSidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTemplates } from "@/services/template.services";
import { getMembersRegistry, sendAdminEmail } from "@/lib/api/admin";



/* ─────────────────────── Attachment Chip ─────────────────────── */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type === "application/pdf") return FileText;
  return File;
}

interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  id: string;
  file: File;
}

function AttachmentChip({
  file,
  onRemove,
}: {
  file: AttachmentFile;
  onRemove: () => void;
}) {
  const Icon = getFileIcon(file.type);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs"
    >
      <Icon className="h-4 w-4 text-navy dark:text-gold shrink-0" />
      <div className="min-w-0">
        <div className="font-medium text-zinc-800 dark:text-zinc-200 truncate max-w-[160px]">
          {file.name}
        </div>
        <div className="text-muted-foreground">{formatFileSize(file.size)}</div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}



/* ─────────────────────── Main Page ─────────────────────── */

export default function Email() {
  const { data: TEMPLATES = [], isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: getTemplates,
  });

  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ["adminMembersList"],
    queryFn: () => getMembersRegistry(1, 100, "", "all", "all", "all", "name", "asc"),
  });
  const members = membersData?.members || [];

  const [activeTpl, setActiveTpl] = useState<string | null>(null);
  
  // Independent States for Single Member Compose
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [singleRecipientEmail, setSingleRecipientEmail] = useState("");
  const [singleSubject, setSingleSubject] = useState("");
  const [singleBody, setSingleBody] = useState("");
  
  // Independent States for Bulk Email Compose
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");

  const [filter, setFilter] = useState("all");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memberSearch, setMemberSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filteredMembers = useMemo(() => {
    if (!memberSearch) return members;

    if (selectedMemberId) {
      const selectedMember = members.find((m: any) => m.id === selectedMemberId);
      if (selectedMember && memberSearch === `${selectedMember.fullName} - ${selectedMember.email}`) {
        return members;
      }
    }

    return members.filter((m: any) => {
      const combined = `${m.fullName} - ${m.email}`.toLowerCase();
      return combined.includes(memberSearch.toLowerCase());
    });
  }, [members, memberSearch, selectedMemberId]);

  const recipients = useMemo(() => {
    if (filter === "all") return members.length;
    if (filter === "active") return members.filter((m: any) => m.status === "Active").length;
    if (filter === "mentorship") return members.filter((m: any) => m.status === "In Mentorship").length;
    return 0; // Expired or none
  }, [filter, members]);

  const handleSelectTemplate = useCallback((tpl: any) => {
    setActiveTpl(tpl.id);
    const template = TEMPLATES.find((t) => t.id === tpl.id);
    if (template) {
      // If we have a single member selected, let's substitute {{name}} helper if present
      let finalBody = template.body;
      if (selectedMemberId) {
        const member = members.find((m: any) => m.id === selectedMemberId);
        if (member) {
          finalBody = finalBody.replace(/\{\{name\}\}/g, member.fullName);
        }
      }
      setSingleSubject(template.subject);
      setSingleBody(finalBody);
      setBulkSubject(template.subject);
      setBulkBody(template.body);
    }
  }, [TEMPLATES, selectedMemberId, members]);

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("bulk");

  const handleClearTemplate = useCallback(() => {
    setActiveTpl(null);
    if (activeTab === "single") {
      setSingleSubject("");
      setSingleBody("");
    } else {
      setBulkSubject("");
      setBulkBody("");
    }
  }, [activeTab]);

  const handleAttachFiles = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      const newAttachments: AttachmentFile[] = Array.from(files).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
      }));
      setAttachments((prev) => [...prev, ...newAttachments]);
      toast.success(
        `${newAttachments.length} file${newAttachments.length > 1 ? "s" : ""} attached`,
      );
      e.target.value = "";
    },
    [],
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sendMutation = useMutation({
    mutationFn: sendAdminEmail,
    onSuccess: (resData) => {
      toast.success(resData.message || "Email dispatched successfully.");
      setSingleSubject("");
      setSingleBody("");
      setBulkSubject("");
      setBulkBody("");
      setAttachments([]);
      setActiveTpl(null);
      setSelectedMemberId("");
      setSingleRecipientEmail("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to send email");
    }
  });

  const handleSend = useCallback(
    (mode: "single" | "bulk") => {
      const formData = new FormData();
      formData.append("recipientType", mode);

      if (mode === "bulk") {
        if (!bulkSubject || !bulkBody) {
          toast.error("Subject and body are required for bulk email.");
          return;
        }
        formData.append("groupFilter", filter);
        formData.append("subject", bulkSubject);
        formData.append("body", bulkBody);
      } else {
        if (!singleRecipientEmail) {
          toast.error("Please select a recipient member.");
          return;
        }
        if (!singleSubject || !singleBody) {
          toast.error("Subject and body are required for single email.");
          return;
        }
        formData.append("recipientEmail", singleRecipientEmail);
        formData.append("subject", singleSubject);
        formData.append("body", singleBody);
      }

      attachments.forEach((att) => {
        formData.append("attachments", att.file);
      });

      sendMutation.mutate(formData as any);
    },
    [bulkSubject, bulkBody, singleRecipientEmail, singleSubject, singleBody, filter, attachments, sendMutation]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Email System</h1>
        <p className="text-sm text-muted-foreground font-sans">
          Send direct emails to a single member or in bulk to a filtered group.
          Select a template from the sidebar to auto-fill.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
        {/* Template sidebar - Sticky top-6 to float cleanly at the top when scrolling, full vertical size, larger width */}
        <div className="lg:sticky lg:top-3 self-start z-10 w-full">
          <Card className="border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm lg:h-[calc(100vh-110px)] flex flex-col">
            <TemplateSidebar
              templates={TEMPLATES}
              activeId={activeTpl}
              onSelect={handleSelectTemplate}
            />
          </Card>
        </div>

        {/* Compose area */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "bulk")}>
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
            <TabsTrigger value="single" className="text-sm font-medium">
              Single member
            </TabsTrigger>
            <TabsTrigger value="bulk" className="text-sm font-medium">
              Bulk email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-navy">Direct email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5 relative">
                    <Label htmlFor="to-member">To (member)</Label>
                    <div className="relative">
                      <Input
                        id="to-member"
                        placeholder="Search by name or email..."
                        value={memberSearch}
                        onChange={(e) => {
                          setMemberSearch(e.target.value);
                          setIsDropdownOpen(true);
                          setSelectedMemberId("");
                          setSingleRecipientEmail("");
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                        className="w-full border-zinc-200 dark:border-zinc-800"
                        autoComplete="off"
                      />
                      <AnimatePresence>
                        {isDropdownOpen && memberSearch.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg z-50"
                          >
                            {filteredMembers.length > 0 ? (
                              filteredMembers.map((m: any) => (
                                <div
                                  key={m.id}
                                  onClick={() => {
                                    setSelectedMemberId(m.id);
                                    setSingleRecipientEmail(m.email);
                                    setMemberSearch(`${m.fullName} - ${m.email}`);
                                    setIsDropdownOpen(false);
                                    if (activeTpl) {
                                      const template = TEMPLATES.find((t) => t.id === activeTpl);
                                      if (template) {
                                        setSingleBody(template.body.replace(/\{\{name\}\}/g, m.fullName));
                                      }
                                    }
                                  }}
                                  className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer flex flex-col"
                                >
                                  <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{m.fullName}</span>
                                  <span className="text-xs text-muted-foreground">{m.email}</span>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                No members found matching "{memberSearch}"
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="single-subject">Subject</Label>
                    <Input
                      id="single-subject"
                      value={singleSubject}
                      onChange={(e) => setSingleSubject(e.target.value)}
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <RichTextEditor
                      value={singleBody}
                      onChange={setSingleBody}
                      placeholder="Compose your message... Use the toolbar above to format your text."
                    />
                  </div>

                  {/* Attachments */}
                  <AnimatePresence>
                    {attachments.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label className="text-xs text-muted-foreground">
                          Attachments ({attachments.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence mode="popLayout">
                            {attachments.map((file) => (
                              <AttachmentChip
                                key={file.id}
                                file={file}
                                onRemove={() => handleRemoveAttachment(file.id)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleAttachFiles}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-zinc-200 dark:border-zinc-800"
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attach files
                      </Button>
                      {activeTpl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearTemplate}
                          className="text-xs text-muted-foreground"
                        >
                          <X className="mr-1 h-3 w-3" />
                          Clear template
                        </Button>
                      )}
                    </div>
                     <Button
                      className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold"
                      onClick={() => handleSend("single")}
                      disabled={sendMutation.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendMutation.isPending ? "Sending..." : "Send Email"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="bulk" className="mt-4">
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-zinc-100 dark:border-zinc-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-navy">Bulk email</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="group">Recipient group</Label>
                      <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger id="group">
                          <SelectValue placeholder="Select recipient group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All members</SelectItem>
                          <SelectItem value="active">Active members</SelectItem>
                          <SelectItem value="mentorship">In Mentorship</SelectItem>
                          <SelectItem value="expired">Expired memberships</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-md bg-navy/5 dark:bg-navy/15 px-3 py-2 text-sm text-navy dark:text-gold flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-[#0b3363] dark:text-gold" />
                    <span>
                      <strong>{recipients}</strong> recipients will receive this
                      broadcast
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-subject">Subject</Label>
                    <Input
                      id="bulk-subject"
                      value={bulkSubject}
                      onChange={(e) => setBulkSubject(e.target.value)}
                      placeholder="Enter email subject..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <RichTextEditor
                      value={bulkBody}
                      onChange={setBulkBody}
                      placeholder="Compose your message... Use the toolbar above to format your text."
                    />
                  </div>

                  {/* Attachments */}
                  <AnimatePresence>
                    {attachments.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label className="text-xs text-muted-foreground">
                          Attachments ({attachments.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <AnimatePresence mode="popLayout">
                            {attachments.map((file) => (
                              <AttachmentChip
                                key={file.id}
                                file={file}
                                onRemove={() => handleRemoveAttachment(file.id)}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleAttachFiles}
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-zinc-200 dark:border-zinc-800"
                      >
                        <Paperclip className="mr-2 h-4 w-4" />
                        Attach files
                      </Button>
                      {activeTpl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearTemplate}
                          className="text-xs text-muted-foreground"
                        >
                          <X className="mr-1 h-3 w-3" />
                          Clear template
                        </Button>
                      )}
                    </div>
                     <Button
                      className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-none font-semibold"
                      onClick={() => handleSend("bulk")}
                      disabled={sendMutation.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {sendMutation.isPending ? "Sending..." : `Send to ${recipients}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
