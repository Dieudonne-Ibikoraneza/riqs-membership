"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Lock, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { publicServices } from "@/services/public.services";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";

/** Resolve a documentType key to its admin-configured display name.
 *  Falls back to a prettified version of the key if no match found.
 */
function resolveDocName(
  documentType: string,
  docTypeMap: Record<string, string>
): string {
  if (documentType.includes(' ') && documentType.charAt(0) === documentType.charAt(0).toUpperCase()) {
      return documentType;
  }
  
  const baseKey = documentType.replace(/_\d+$/, "");

  if (docTypeMap[documentType]) return docTypeMap[documentType];
  if (docTypeMap[baseKey]) return docTypeMap[baseKey];
  
  // Check against sanitized name (lowercase, underscores)
  const sanitized = baseKey.toLowerCase().replace(/[^a-z0-9]/g, "_");
  if (docTypeMap[sanitized]) return docTypeMap[sanitized];
  // Fallback: prettify the raw string
  return documentType
    .replace(/_+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function DocumentCard({ doc, docTypeMap }: { doc: any; docTypeMap: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const toggleExpand = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    
    if (willExpand && !previewUrl && !isLoading) {
      setIsLoading(true);
      setError(false);
      applicantServices.downloadDocument(doc.id)
        .then(blob => {
          const isImg = blob.type.startsWith("image/") || doc.fileName?.match(/\.(jpeg|jpg|gif|png)$/i);
          const url = URL.createObjectURL(blob) + (isImg ? "#image" : "#pdf");
          setPreviewUrl(url);
        })
        .catch(err => {
          console.error("Failed to load document", err);
          setError(true);
          toast.error(`Failed to load document`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const blob = await applicantServices.downloadDocument(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(`Failed to download ${doc.fileName}`);
    }
  };

  const friendlyName = doc.documentName || resolveDocName(doc.documentType, docTypeMap);

  return (
    <Card className="border-zinc-200 dark:border-zinc-800">
      <CardContent className="flex flex-col p-4">
        {/* Header */}
        <div 
          className="flex items-start justify-between gap-4 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm capitalize">{friendlyName}</span>
              <Badge variant="outline" className="gap-1 text-xs border-zinc-200 bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400">
                <Lock className="h-3 w-3 text-gold" />Locked
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground font-sans">
              {doc.fileName} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleDownload}
              className="border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
            >
              <Download className="h-4 w-4 text-gold md:mr-2" />
              <span className="hidden md:inline">Download</span>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Expandable Preview */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border border-zinc-200 dark:border-zinc-800 h-[450px] relative bg-zinc-50 dark:bg-zinc-900 rounded-md overflow-hidden">
                {isLoading ? (
                  <div className="w-full h-full p-4 flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-900 animate-pulse">
                    {/* Simulated PDF Toolbar */}
                    <div className="w-full h-12 bg-zinc-200/60 dark:bg-zinc-800 rounded-md flex items-center px-4 justify-between">
                      <div className="h-4 bg-zinc-300 dark:bg-zinc-700 rounded w-1/4 animate-pulse" />
                      <div className="flex gap-2">
                        <div className="h-7 w-7 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-7 w-7 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse" />
                        <div className="h-7 w-7 bg-zinc-300 dark:bg-zinc-700 rounded animate-pulse" />
                      </div>
                    </div>
                    {/* Simulated Document Body */}
                    <div className="w-full flex-1 bg-zinc-200/40 dark:bg-zinc-800/80 rounded-md animate-pulse" />
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center w-full h-full text-red-400 gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p className="text-sm">Failed to load preview</p>
                  </div>
                ) : previewUrl ? (
                  previewUrl.includes("#image") ? (
                    <ImageViewer src={previewUrl} fileName={friendlyName} />
                  ) : (
                    <PDFViewer src={previewUrl} fileName={friendlyName} />
                  )
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function Documents() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
  });

  const { data: docTypes = [] } = useQuery({
    queryKey: ["documentTypes"],
    queryFn: applicantServices.getDocumentTypes,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesData = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => publicServices.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const categories = categoriesData as any[];

  // Build a lookup map: code -> name and sanitized_name -> name
  const docTypeMap: Record<string, string> = {};
  for (const dt of docTypes) {
    docTypeMap[dt.code] = dt.name;
    docTypeMap[dt.name.toLowerCase().replace(/[^a-z0-9]/g, "_")] = dt.name;
  }

  // Override with category-specific names if available
  if (profileData?.application?.categoryId && categories && categories.length > 0) {
    const category = categories.find((c: any) => c.id === profileData!.application!.categoryId);
    if (category) {
      const allCategoryDocs = [
        ...(Array.isArray(category.requiredDocuments) ? category.requiredDocuments : []),
        ...(Array.isArray(category.optionalDocuments) ? category.optionalDocuments : [])
      ];
      for (const d of allCategoryDocs) {
        if (d.typeCode && d.name) {
          docTypeMap[d.typeCode] = d.name;
          docTypeMap[d.name.toLowerCase().replace(/[^a-z0-9]/g, "_")] = d.name;
        }
      }
    }
  }

  const documents = profileData?.documents || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy">Documents</h1>
        <p className="text-sm text-muted-foreground font-sans">
          View and download your active files and credentials. Locked files can only be replaced via administrative request.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No documents found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 stagger">
          {documents.map((d: any, index: number) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <DocumentCard doc={d} docTypeMap={docTypeMap} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
