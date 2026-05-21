"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
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
  Undo2,
  Redo2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function RichTextEditor({
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

  const lastHtmlRef = useRef(value);
  // Set initial content cleanly and handle uncontrolled updates.
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML === "" || value !== lastHtmlRef.current) {
        editorRef.current.innerHTML = value || "<p><br></p>";
        lastHtmlRef.current = value;
        setIsEmpty(!value || value === "<br>" || value === "<p><br></p>");
      }
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
