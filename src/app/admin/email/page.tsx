"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
import { MEMBERS } from "@/lib/mock-data";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─────────────────────── Template Data ─────────────────────── */

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  description: string;
}

const TEMPLATES: EmailTemplate[] = [
  {
    id: "welcome",
    name: "Welcome to RIQS",
    category: "Onboarding",
    subject: "Welcome to the Rwanda Institute of Quantity Surveyors",
    description: "Sent to newly approved members after their application is accepted.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">On behalf of the Council and entire membership of the <strong>Rwanda Institute of Quantity Surveyors (RIQS)</strong>, we are delighted to officially welcome you as a registered member of the Institute.</p>
<p class="mb-4">Your application has been <strong>reviewed and approved</strong>. You are now entitled to all privileges associated with your membership category, including:</p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li>Access to your <strong>digital Annual Practicing License</strong> and verifiable certificate</li>
  <li>Participation in <strong>Continuing Professional Development (CPD)</strong> events and workshops</li>
  <li>Listing in the <strong>RIQS public members directory</strong></li>
  <li>Eligibility to bid on <strong>government and private sector QS tenders</strong></li>
  <li>Access to the <strong>mentorship programme</strong> for career advancement</li>
</ul>
<p class="mb-4">Please log in to the <strong>RIQS Members Portal</strong> to download your certificate, update your profile, and explore upcoming CPD opportunities.</p>
<p class="mb-4">We look forward to your active participation in advancing the Quantity Surveying profession in Rwanda.</p>
<p class="mb-4">Warm regards,<br/><strong>RIQS Secretariat</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "renewal",
    name: "Annual Renewal Reminder",
    category: "Billing",
    subject: "RIQS Annual Membership Renewal — Action Required",
    description: "Reminder sent to members whose annual license is approaching expiry.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">This is a friendly reminder that your <strong>RIQS Annual Practicing License</strong> is due for renewal. To maintain your active membership status and continue enjoying all member privileges, please complete the renewal process before the expiry date.</p>
<p class="mb-4"><strong>Renewal Steps:</strong></p>
<ol class="list-decimal pl-5 mb-4 space-y-2">
  <li>Log in to the <strong>RIQS Members Portal</strong></li>
  <li>Navigate to the <strong>Payments</strong> section</li>
  <li>Complete the annual subscription payment via Mobile Money (Code: <strong>604516</strong>) or bank transfer</li>
  <li>Upload your <strong>proof of payment</strong></li>
</ol>
<p class="mb-4"><strong>Important:</strong> Failure to renew before the deadline may result in temporary suspension of your practicing license, removal from the public directory, and inability to participate in CPD events.</p>
<p class="mb-4">If you have already completed the renewal, please disregard this message. For any questions, contact our Secretariat at <strong>info@riqs.rw</strong>.</p>
<p class="mb-4">Best regards,<br/><strong>RIQS Finance Department</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "cpd",
    name: "CPD Event Invitation",
    category: "Events",
    subject: "You're Invited: Upcoming RIQS CPD Professional Development Session",
    description: "Invitation to attend a scheduled CPD workshop or seminar.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">We are pleased to invite you to our upcoming <strong>Continuing Professional Development (CPD)</strong> session organized by the Rwanda Institute of Quantity Surveyors.</p>
<p class="mb-4"><strong>Event Details:</strong></p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li><strong>Topic:</strong> Modern Cost Estimation Techniques in East African Construction</li>
  <li><strong>Date:</strong> Saturday, 15th June 2026</li>
  <li><strong>Time:</strong> 09:00 AM — 01:00 PM (CAT)</li>
  <li><strong>Venue:</strong> Kigali Convention Centre, Main Auditorium</li>
  <li><strong>CPD Points:</strong> 4 points will be awarded upon completion</li>
</ul>
<p class="mb-4">This session will feature presentations by leading industry experts and will cover practical methodologies for improving project cost accuracy, risk assessment frameworks, and digital BIM integration in quantity surveying workflows.</p>
<p class="mb-4"><strong>Registration is mandatory.</strong> Please confirm your attendance by replying to this email or through the Members Portal before <strong>10th June 2026</strong>.</p>
<p class="mb-4">We look forward to seeing you there!</p>
<p class="mb-4">Kind regards,<br/><strong>RIQS CPD Committee</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "mentorship-assign",
    name: "Mentorship Assignment",
    category: "Mentorship",
    subject: "RIQS Mentorship Programme — Mentor Assignment Confirmation",
    description: "Notification sent when a graduate is paired with a professional mentor.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">We are pleased to inform you that you have been successfully matched with a <strong>Professional Mentor</strong> under the RIQS Mentorship Programme.</p>
<p class="mb-4"><strong>Your Assigned Mentor:</strong></p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li><strong>Name:</strong> Eng. Patrick Nshuti, MRIQS</li>
  <li><strong>Registration ID:</strong> RIQS-2020-P-015</li>
  <li><strong>Specialization:</strong> Infrastructure & Civil Works Quantity Surveying</li>
  <li><strong>Experience:</strong> 12 years in professional practice</li>
</ul>
<p class="mb-4">Your mentor will guide you through the practical experience requirements needed for advancement from Graduate to Technologist status. You are expected to:</p>
<ol class="list-decimal pl-5 mb-4 space-y-2">
  <li>Maintain a <strong>structured logbook</strong> of professional activities</li>
  <li>Meet with your mentor at least <strong>once per month</strong></li>
  <li>Complete a minimum of <strong>2 CPD activities</strong> per year</li>
  <li>Submit quarterly <strong>progress reports</strong> through the Members Portal</li>
</ol>
<p class="mb-4">Your mentor has been notified and will reach out to schedule your first session. If you have any questions, please contact the RIQS Mentorship Coordinator.</p>
<p class="mb-4">Best wishes,<br/><strong>RIQS Mentorship Committee</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "correction",
    name: "Application Correction Required",
    category: "Applications",
    subject: "RIQS Application — Corrections Required",
    description: "Sent when an application needs amendments or additional documents.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">Thank you for submitting your membership application to the Rwanda Institute of Quantity Surveyors. After careful review, our Assessment Committee has identified items that require your attention before we can proceed with the approval process.</p>
<p class="mb-4"><strong>Required Corrections:</strong></p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li>The uploaded <strong>degree certificate</strong> appears to be incomplete — please provide the full notarized copy including all pages</li>
  <li>Your <strong>academic transcripts</strong> must clearly show the subjects studied and grades obtained</li>
  <li>The <strong>passport photograph</strong> does not meet the required specifications (white background, formal attire)</li>
</ul>
<p class="mb-4">Please log in to the <strong>RIQS Members Portal</strong>, navigate to your application, and re-upload the corrected documents within <strong>14 business days</strong>. Failure to provide corrections within this period may result in automatic rejection of the application.</p>
<p class="mb-4">If you believe these requirements have been met or need clarification, please reply to this email with supporting details.</p>
<p class="mb-4">Regards,<br/><strong>RIQS Applications Review Board</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "suspension",
    name: "Membership Suspension Notice",
    category: "Compliance",
    subject: "RIQS Membership Suspension — Immediate Action Required",
    description: "Formal suspension notice for non-compliance or overdue payments.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">We regret to inform you that your RIQS membership has been <strong>temporarily suspended</strong> effective immediately due to the following reason(s):</p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li>Outstanding annual subscription payment exceeding <strong>90 days</strong> past the renewal deadline</li>
  <li>Non-completion of the mandatory minimum <strong>CPD requirements</strong> for the current licensing year</li>
</ul>
<p class="mb-4"><strong>Impact of Suspension:</strong></p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li>Your <strong>Annual Practicing License</strong> is no longer valid for professional engagements</li>
  <li>Your profile has been <strong>removed from the public members directory</strong></li>
  <li>You are <strong>ineligible to participate</strong> in RIQS events, tenders, or mentorship activities</li>
</ul>
<p class="mb-4">To reinstate your membership, please settle all outstanding obligations and contact the RIQS Secretariat at <strong>info@riqs.rw</strong> within <strong>30 days</strong>. After this period, a formal reinstatement application and additional fees may be required.</p>
<p class="mb-4">Sincerely,<br/><strong>RIQS Compliance Office</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "agm",
    name: "AGM Invitation",
    category: "Events",
    subject: "Invitation to the RIQS Annual General Meeting 2026",
    description: "Annual General Meeting notice with agenda and logistics.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">You are cordially invited to attend the <strong>RIQS Annual General Meeting (AGM) 2026</strong>.</p>
<p class="mb-4"><strong>Meeting Details:</strong></p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li><strong>Date:</strong> Friday, 28th November 2026</li>
  <li><strong>Time:</strong> 02:00 PM — 05:00 PM (CAT)</li>
  <li><strong>Venue:</strong> Radisson Blu Hotel &amp; Convention Centre, Kigali</li>
  <li><strong>Dress Code:</strong> Business formal</li>
</ul>
<p class="mb-4"><strong>Agenda:</strong></p>
<ol class="list-decimal pl-5 mb-4 space-y-2">
  <li>Opening remarks by the RIQS Chairman</li>
  <li>Review and adoption of the 2025 AGM minutes</li>
  <li>Presentation of the <strong>Annual Financial Report</strong></li>
  <li>Report on membership growth, CPD statistics, and mentorship outcomes</li>
  <li>Election of new <strong>Council Members</strong> for the 2027–2029 term</li>
  <li>Discussion on the proposed <strong>QS Professional Standards Bill</strong></li>
  <li>Any Other Business (AOB)</li>
</ol>
<p class="mb-4">Your attendance and participation are highly valued. Please RSVP by <strong>20th November 2026</strong> via the Members Portal or by replying to this email.</p>
<p class="mb-4">With kind regards,<br/><strong>RIQS Secretariat</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
  {
    id: "promotion",
    name: "Category Promotion",
    category: "Membership",
    subject: "Congratulations — RIQS Membership Category Advancement",
    description: "Congratulatory notice when a member is promoted to a higher category.",
    body: `<p class="mb-4">Dear <strong>{{name}}</strong>,</p>
<p class="mb-4">We are thrilled to inform you that following a thorough review of your professional portfolio, practical experience records, and CPD achievements, the RIQS Assessment Committee has approved your <strong>category advancement</strong>.</p>
<p class="mb-4"><strong>Promotion Details:</strong></p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li><strong>Previous Category:</strong> Graduate Member (GRIQS)</li>
  <li><strong>New Category:</strong> Technologist Member (TRIQS)</li>
  <li><strong>Effective Date:</strong> 1st January 2027</li>
</ul>
<p class="mb-4">This promotion recognizes your dedication to professional development and your significant contributions to the Quantity Surveying profession. As a Technologist Member, you now have access to:</p>
<ul class="list-disc pl-5 mb-4 space-y-2">
  <li>Enhanced <strong>practicing rights</strong> for independent project engagement</li>
  <li>Eligibility to <strong>mentor Graduate members</strong></li>
  <li>Priority registration for <strong>advanced CPD workshops</strong></li>
  <li>Voting rights at the <strong>Annual General Meeting</strong></li>
</ul>
<p class="mb-4">Your updated certificate and practicing license will be available for download in the Members Portal within 5 business days.</p>
<p class="mb-4">Congratulations once again!</p>
<p class="mb-4">Warm regards,<br/><strong>RIQS Council</strong><br/>Rwanda Institute of Quantity Surveyors</p>`,
  },
];

/* ─────────────────────── Rich Text Editor ─────────────────────── */

function RichTextEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Formatting state
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    ul: false,
    ol: false,
    h1: false,
    h2: false,
    p: false,
  });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Link dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const savedSelectionRef = useRef<Range | null>(null);

  // Uncontrolled sync: We only push value changes to innerHTML if it's from external source
  const lastHtmlRef = useRef(value);
  useEffect(() => {
    if (editorRef.current && value !== lastHtmlRef.current) {
      editorRef.current.innerHTML = value || "<p><br></p>";
      lastHtmlRef.current = value;
      setIsEmpty(!value || value === "<br>" || value === "<p><br></p>");
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      lastHtmlRef.current = html;
      onChange(html);
      setIsEmpty(
        !html ||
          html === "<br>" ||
          html === "<p><br></p>" ||
          editorRef.current.textContent?.trim() === "",
      );
    }
  }, [onChange]);

  const updateActiveStyles = useCallback(() => {
    if (typeof document !== "undefined") {
      setActiveStyles({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
        h1: document.queryCommandValue("formatBlock") === "h1",
        h2: document.queryCommandValue("formatBlock") === "h2",
        p: document.queryCommandValue("formatBlock") === "p" || document.queryCommandValue("formatBlock") === "",
      });
      setCanUndo(document.queryCommandEnabled("undo"));
      setCanRedo(document.queryCommandEnabled("redo"));
    }
  }, []);

  // Listen to ALL events that change DOM or selection inside the contentEditable
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    const handleEvents = () => {
      updateActiveStyles();
      handleInput();
    };

    el.addEventListener("input", handleEvents);
    el.addEventListener("keyup", handleEvents);
    el.addEventListener("mouseup", handleEvents);
    el.addEventListener("click", handleEvents);
    el.addEventListener("focus", updateActiveStyles);
    el.addEventListener("blur", updateActiveStyles);

    return () => {
      el.removeEventListener("input", handleEvents);
      el.removeEventListener("keyup", handleEvents);
      el.removeEventListener("mouseup", handleEvents);
      el.removeEventListener("click", handleEvents);
      el.removeEventListener("focus", updateActiveStyles);
      el.removeEventListener("blur", updateActiveStyles);
    };
  }, [updateActiveStyles, handleInput]);

  const exec = useCallback((cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
    updateActiveStyles();
  }, [handleInput, updateActiveStyles]);

  // Save selection before opening modal
  const saveSelection = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedSelectionRef.current = sel.getRangeAt(0);
      }
    }
  };

  // Restore selection before inserting HTML
  const restoreSelection = () => {
    if (typeof window !== "undefined" && savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  const handleLinkClick = () => {
    saveSelection();
    let selectedText = "";
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel) {
        selectedText = sel.toString();
      }
    }
    setLinkText(selectedText);
    setLinkUrl("");
    setLinkDialogOpen(true);
  };

  const handleInsertLink = () => {
    restoreSelection();
    if (!linkUrl) {
      setLinkDialogOpen(false);
      return;
    }
    const text = linkText.trim() || linkUrl.trim();
    const url = linkUrl.trim();
    
    // Formatting link tag cleanly
    const linkHtml = `<a href="${url}" target="_blank" class="text-blue-600 underline hover:text-blue-800">${text}</a>`;
    exec("insertHTML", linkHtml);
    setLinkDialogOpen(false);
  };

  const ToolBtn = ({
    icon: Icon,
    cmd,
    val,
    title,
    onClick,
    isActive = false,
    disabled = false,
  }: {
    icon: React.ElementType;
    cmd?: string;
    val?: string;
    title: string;
    onClick?: () => void;
    isActive?: boolean;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        if (disabled) return;
        if (onClick) onClick();
        else if (cmd) exec(cmd, val);
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors cursor-pointer",
        isActive
          ? "bg-secondary/15 text-secondary dark:bg-primary/25 dark:text-primary ring-1 ring-secondary/25 dark:ring-primary/30 font-bold"
          : "text-zinc-600 hover:bg-zinc-100 hover:text-secondary dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-primary",
        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-zinc-650 dark:hover:bg-transparent dark:hover:text-zinc-400",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="rounded-md border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-2 py-1.5">
        <ToolBtn icon={Undo2} cmd="undo" title="Undo" disabled={!canUndo} />
        <ToolBtn icon={Redo2} cmd="redo" title="Redo" disabled={!canRedo} />
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolBtn
          icon={Heading1}
          title="Heading 1"
          isActive={activeStyles.h1}
          onClick={() => {
            if (activeStyles.h1) {
              exec("formatBlock", "p");
            } else {
              exec("formatBlock", "h1");
            }
          }}
        />
        <ToolBtn
          icon={Heading2}
          title="Heading 2"
          isActive={activeStyles.h2}
          onClick={() => {
            if (activeStyles.h2) {
              exec("formatBlock", "p");
            } else {
              exec("formatBlock", "h2");
            }
          }}
        />
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolBtn icon={Bold} cmd="bold" title="Bold (Ctrl+B)" isActive={activeStyles.bold} />
        <ToolBtn icon={Italic} cmd="italic" title="Italic (Ctrl+I)" isActive={activeStyles.italic} />
        <ToolBtn icon={Underline} cmd="underline" title="Underline (Ctrl+U)" isActive={activeStyles.underline} />
        <ToolBtn icon={Strikethrough} cmd="strikeThrough" title="Strikethrough" isActive={activeStyles.strikethrough} />
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolBtn icon={List} cmd="insertUnorderedList" title="Bullet list" isActive={activeStyles.ul} />
        <ToolBtn icon={ListOrdered} cmd="insertOrderedList" title="Numbered list" isActive={activeStyles.ol} />
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolBtn icon={AlignLeft} cmd="justifyLeft" title="Align left" />
        <ToolBtn icon={AlignCenter} cmd="justifyCenter" title="Align center" />
        <ToolBtn icon={AlignRight} cmd="justifyRight" title="Align right" />
        <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
        <ToolBtn icon={Link2} title="Insert link" onClick={handleLinkClick} />
      </div>

      {/* Editable Area */}
      <div className="relative">
        {isEmpty && placeholder && (
          <div className="pointer-events-none absolute inset-0 px-4 py-3 text-sm text-muted-foreground font-sans">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[280px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm leading-relaxed outline-none focus:ring-0 prose prose-sm prose-zinc dark:prose-invert max-w-none [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-2 [&_h1]:mb-4 [&_h2]:mb-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-navy [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
        />
      </div>

      {/* Link Insertion Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-navy">Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="link-text">Text to display</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Enter text to link..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-url">To what URL should this link go?</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-gold text-[#1a1a1a] hover:bg-gold/90 font-semibold"
              onClick={handleInsertLink}
              disabled={!linkUrl.trim()}
            >
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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

/* ─────────────────────── Template Sidebar ─────────────────────── */

const CATEGORY_COLORS: Record<string, string> = {
  Onboarding: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Billing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Events: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Mentorship: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  Applications: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  Compliance: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  Membership: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
};

function TemplateSidebar({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (tpl: EmailTemplate) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="text-sm font-bold text-navy dark:text-gold">
          Templates
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium">
          {TEMPLATES.length} available
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelect(tpl)}
            className={cn(
              "w-full text-left rounded-md px-3 py-2.5 transition-all duration-150 group",
              activeId === tpl.id
                ? "bg-navy/5 dark:bg-gold/10 ring-1 ring-navy/20 dark:ring-gold/20"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
            )}
          >
            <div className="flex items-center gap-2">
              <Mail
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-colors",
                  activeId === tpl.id
                    ? "text-navy dark:text-gold"
                    : "text-zinc-400 group-hover:text-navy dark:group-hover:text-gold",
                )}
              />
              <span
                className={cn(
                  "text-xs font-semibold truncate transition-colors",
                  activeId === tpl.id
                    ? "text-navy dark:text-gold"
                    : "text-zinc-700 dark:text-zinc-300",
                )}
              >
                {tpl.name}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-snug pl-5">
              {tpl.description}
            </p>
            <div className="mt-1.5 pl-5">
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  CATEGORY_COLORS[tpl.category] || "bg-zinc-100 text-zinc-600",
                )}
              >
                {tpl.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Main Page ─────────────────────── */

export default function Email() {
  const [activeTpl, setActiveTpl] = useState<string | null>(null);
  
  // Independent States for Single Member Compose
  const [singleSubject, setSingleSubject] = useState("");
  const [singleBody, setSingleBody] = useState("");
  
  // Independent States for Bulk Email Compose
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");

  const [filter, setFilter] = useState("all");
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const recipients =
    filter === "all"
      ? MEMBERS.length
      : filter === "active"
        ? MEMBERS.filter((m) => m.status === "Active").length
        : filter === "mentorship"
          ? MEMBERS.filter((m) => m.status === "In Mentorship").length
          : MEMBERS.filter((m) => m.status === "Expired").length;

  const handleSelectTemplate = useCallback((tpl: EmailTemplate) => {
    setActiveTpl(tpl.id);
  }, []);

  const [activeTab, setActiveTab] = useState<"single" | "bulk">("bulk");

  useEffect(() => {
    if (activeTpl) {
      const template = TEMPLATES.find(t => t.id === activeTpl);
      if (template) {
        if (activeTab === "single") {
          setSingleSubject(template.subject);
          setSingleBody(template.body);
        } else {
          setBulkSubject(template.subject);
          setBulkBody(template.body);
        }
      }
    }
  }, [activeTpl, activeTab]);

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

  const handleSend = useCallback(
    (mode: "single" | "bulk") => {
      if (mode === "bulk") {
        toast.success(`Bulk email queued to ${recipients} members`);
        setBulkSubject("");
        setBulkBody("");
      } else {
        toast.success("Email sent successfully");
        setSingleSubject("");
        setSingleBody("");
      }
      setAttachments([]);
      setActiveTpl(null);
    },
    [recipients],
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
                  <div className="space-y-1.5">
                    <Label htmlFor="to-member">To (member)</Label>
                    <Input
                      id="to-member"
                      placeholder="Search member by name or ID..."
                    />
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
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
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
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send to {recipients}
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
