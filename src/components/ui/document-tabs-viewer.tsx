"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Check, Upload, FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import PDFViewer from "@/components/ui/pdf-viewer";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

export interface DocumentTab {
  k: string; // key
  l: string; // label
  r?: boolean; // required
  url?: string | null; // URL of the uploaded document (blob or API url)
}

interface DocumentTabsViewerProps {
  tabs: DocumentTab[];
  onUpload: (key: string, file: File) => void;
  onDelete?: (key: string) => void;
  onAddTab?: (activeTabKey: string, file: File) => void;
  isUploading?: boolean;
}

export function DocumentTabsViewer({ tabs, onUpload, onDelete, onAddTab, isUploading }: DocumentTabsViewerProps) {
  const [activeTabKey, setActiveTabKey] = useState<string>(tabs[0]?.k || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addTabFileInputRef = useRef<HTMLInputElement>(null);

  // If tabs change and active tab is no longer in the list, reset it.
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.k === activeTabKey)) {
      setActiveTabKey(tabs[0].k);
    }
  }, [tabs, activeTabKey]);

  if (tabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 dark:border-zinc-800">
        <Upload className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-zinc-500">No Documents Needed</h3>
        <p className="text-xs text-zinc-400 mt-1">This section doesn't require any document uploads.</p>
      </div>
    );
  }

  const activeTab = tabs.find((t) => t.k === activeTabKey) || tabs[0];
  const isUploaded = !!activeTab?.url;
  const isImage = activeTab?.url?.match(/\.(jpeg|jpg|gif|png)$/i) != null || (activeTab?.url?.startsWith('data:image'));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeTab) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      onUpload(activeTab.k, file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddTabFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddTab) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      onAddTab(activeTabKey, file);
    }
    if (addTabFileInputRef.current) {
      addTabFileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      {/* ── Browser Tabs Header ── */}
      <div className="flex items-center overflow-x-auto bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-2 gap-1 scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.k === activeTabKey;
          const done = !!tab.url;
          return (
            <div
              key={tab.k}
              role="button"
              tabIndex={0}
              onClick={() => setActiveTabKey(tab.k)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all flex-1 min-w-[140px] rounded-t-lg border border-transparent cursor-pointer select-none",
                isActive 
                  ? "bg-white dark:bg-zinc-900 border-x-zinc-200 border-t-zinc-200 dark:border-x-zinc-800 dark:border-t-zinc-800 text-navy dark:text-zinc-100 shadow-sm z-10" 
                  : "bg-transparent text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              {/* Status Indicator */}
              <div className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                done ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
              )}>
                {done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              
              <span className="truncate flex-1 text-left flex items-center">
                {tab.l}
                {tab.r && <span className="text-red-500 font-bold ml-1 text-lg leading-none">*</span>}
              </span>
              
              {done && onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(tab.k); }}
                  className={cn(
                    "ml-2 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors",
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  title="Remove document"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              
              {/* Active Tab Bottom Indicator (To cover the parent border-b) */}
              {isActive && (
                <div className="absolute -bottom-[1px] left-0 right-0 h-[1px] bg-white dark:bg-zinc-900" />
              )}
            </div>
          );
        })}
        
        {onAddTab && (
          <button 
            onClick={() => addTabFileInputRef.current?.click()}
            className="h-8 w-8 ml-2 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 shrink-0 transition-colors"
            title="Add another document"
            disabled={isUploading}
          >
            <Plus className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept=".pdf,image/jpeg,image/png"
      />
      <input 
        type="file" 
        className="hidden" 
        ref={addTabFileInputRef} 
        onChange={handleAddTabFileSelect} 
        accept=".pdf,image/jpeg,image/png"
      />

      {/* ── Tab Body (Viewer) ── */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
        {tabs.map((tab) => {
          const isActive = tab.k === activeTabKey;
          const url = tab.url;
          const isImage = url?.toLowerCase().match(/\.(jpeg|jpg|gif|png)$/i) || url?.startsWith("data:image");
          const isUploaded = !!url;
          
          return (
            <div
              key={tab.k}
              className={cn(
                "absolute inset-0 flex-1 flex flex-col transition-opacity duration-200",
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              )}
            >
              {isUploading && isActive ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-zinc-900/80 z-20 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
                  <p className="text-navy font-medium">Uploading document...</p>
                </div>
              ) : null}

              {isUploaded ? (
                <div className="w-full h-full p-0 flex-1 relative overflow-hidden flex items-center justify-center">
                  {isImage ? (
                    <img src={url!} alt={tab.l} className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <PDFViewer src={url!} fileName={tab.l + ".pdf"} />
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
                  <div 
                    onClick={() => isActive && fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center w-full max-w-md p-10 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl hover:border-gold hover:bg-gold/5 dark:hover:bg-gold/5 transition-colors group",
                      isActive ? "cursor-pointer pointer-events-auto" : "pointer-events-none"
                    )}
                  >
                    <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-gold/10 transition-all">
                      <FileText className="h-8 w-8 text-zinc-400 group-hover:text-gold" />
                    </div>
                    <h3 className="text-lg font-bold text-navy dark:text-zinc-200 mb-2">Upload {tab?.l}</h3>
                    <p className="text-sm text-zinc-500 max-w-[300px] mx-auto mb-6">
                      Click to browse or drag and drop your file here. Accepted formats: PDF, JPG, PNG (Max 5MB). You can click the <strong className="text-navy">plus button</strong> above to add more.
                    </p>
                    <Button className="bg-navy text-white hover:bg-navy/90 border-none shadow-sm group-hover:shadow-md transition-all">
                      <Upload className="h-4 w-4 mr-2" /> Browse Files
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
