"use client";

import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Lock, ChevronDown, ChevronUp, Loader2, AlertCircle, UploadCloud, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import { publicServices } from "@/services/public.services";
import { useAuth } from "@/lib/auth";
import PDFViewer from "@/components/ui/pdf-viewer";
import ImageViewer from "@/components/ui/image-viewer";

function formatLabel(name: string): string {
  if (!name) return "";
  return name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

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
  return formatLabel(documentType);
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

  const friendlyName = formatLabel(doc.documentName || resolveDocName(doc.documentType, docTypeMap));

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden border-zinc-200 dark:border-zinc-800">
      <CardContent className="w-full min-w-0 max-w-full flex flex-col p-4">
        {/* Header */}
        <div 
          className="flex min-w-0 items-start justify-between gap-4 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-semibold text-zinc-900 dark:text-zinc-100 text-sm capitalize" title={friendlyName}>{friendlyName}</span>
              <Badge variant="outline" className="shrink-0 gap-1 text-xs border-zinc-200 bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400">
                <Lock className="h-3 w-3 text-gold" />Locked
              </Badge>
            </div>
            <div className="min-w-0 max-w-full whitespace-normal break-all text-xs text-muted-foreground font-sans">
              {doc.fileName} · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex shrink-0 items-center gap-1.5">
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
              <div className="mt-4 min-w-0 border border-zinc-200 dark:border-zinc-800 h-[min(70vh,450px)] min-h-[300px] relative bg-zinc-50 dark:bg-zinc-900 rounded-md overflow-hidden">
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

function MissingDocumentCard({
  doc,
  applicationId,
}: {
  doc: { uid: string; label: string; required: boolean };
  applicationId: string;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("applicationId", applicationId);
      formData.append("documentType", doc.uid);
      return applicantServices.uploadDocument(formData);
    },
    onMutate: () => setIsUploading(true),
    onSuccess: () => {
      toast.success(`${doc.label} uploaded and locked to your profile.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.applicant.profile() });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || `Failed to upload ${doc.label}.`);
    },
    onSettled: () => setIsUploading(false),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  return (
    <Card className="w-full min-w-0 max-w-full overflow-hidden border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-transparent">
      <CardContent className="w-full min-w-0 max-w-full flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="min-w-0 truncate font-semibold text-zinc-900 dark:text-zinc-100 text-sm" title={doc.label}>
              {doc.label}
            </span>
            {doc.required ? (
              <Badge variant="outline" className="shrink-0 text-xs border-red-200 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                Required
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0 text-xs border-zinc-200 bg-zinc-50 text-zinc-500 dark:bg-zinc-900">
                Optional
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-sans">Not yet uploaded.</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 border-zinc-200 dark:border-zinc-800"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin md:mr-2" />
          ) : (
            <UploadCloud className="h-4 w-4 text-gold md:mr-2" />
          )}
          <span className="hidden md:inline">Upload</span>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Documents() {
  const { isStudent } = useAuth();
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
      const catRequired = category.required_documents ?? category.requiredDocuments;
      const catOptional = category.optional_documents ?? category.optionalDocuments;
      const allCategoryDocs = [
        ...(Array.isArray(catRequired) ? catRequired : []),
        ...(Array.isArray(catOptional) ? catOptional : [])
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

  const membershipClass = (profileData?.profile as any)?.membershipClass || "";
  const isRestrictedMember = isStudent || membershipClass.includes("Student") || membershipClass.includes("Visiting");

  // Education documents (degree, transcripts, student-association proof, CPD certificates)
  // are attached via the Education Records section of the Profile page instead, and payment
  // proofs are irrelevant for an already-Approved, already-imported member (their Processing
  // Fee is assumed cleared before import) — neither belongs in this backfill checklist.
  const EDUCATION_DOC_TYPES = ["transcript", "certificate", "degree", "student_association", "cpd_certificate"];

  // Approved members (e.g. bulk-imported from the roster) may have no documents on file at
  // all yet. Compute which of their category's admin-configured documents are still missing
  // so they can self-upload them here — these skip reviewer verification entirely and lock
  // permanently the moment they're submitted.
  const missingDocs = useMemo(() => {
    if (profileData?.application?.status !== "Approved") return [];
    const category = categories.find((c: any) => c.id === profileData?.application?.categoryId);
    if (!category) return [];

    const paymentTypeCodes = new Set(
      (docTypes as any[]).filter((dt) => dt.isPaymentProof).map((dt) => dt.code)
    );

    const rawRequired = category.required_documents ?? category.requiredDocuments;
    const rawOptional = category.optional_documents ?? category.optionalDocuments;
    const reqDocs = (Array.isArray(rawRequired) ? rawRequired : []).map((d: any) => ({ ...d, required: true }));
    const optDocs = (Array.isArray(rawOptional) ? rawOptional : []).map((d: any) => ({ ...d, required: false }));

    const typeCounts: Record<string, number> = {};
    const checklist = [...reqDocs, ...optDocs]
      .map((d: any) => {
        const base = d.typeCode || (d.name ? d.name.toLowerCase().replace(/[^a-z0-9]/g, "_") : "unknown");
        typeCounts[base] = (typeCounts[base] || 0) + 1;
        const uid = typeCounts[base] > 1 ? `${base}_${typeCounts[base]}` : base;
        return { uid, base, label: d.name || formatLabel(uid), required: d.required };
      })
      .filter((d) => !EDUCATION_DOC_TYPES.includes(d.base) && !paymentTypeCodes.has(d.base));

    const uploadedTypes = new Set(documents.map((d: any) => d.documentType));
    return checklist.filter((d) => !uploadedTypes.has(d.uid));
  }, [profileData, categories, documents, docTypes]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
      ) : (
        <>
          {missingDocs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/5 p-4">
                <ShieldAlert className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Complete your document file</p>
                  <p className="text-muted-foreground font-sans">
                    Your membership category requires the documents below. Please double-check that the file you select
                    is correct before uploading — these uploads are not reviewed by our team, and once submitted they
                    cannot be changed or replaced.
                  </p>
                </div>
              </div>
              <div className="grid min-w-0 gap-3 stagger">
                {missingDocs.map((d, index) => (
                  <motion.div
                    key={d.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="min-w-0 max-w-full"
                  >
                    <MissingDocumentCard doc={d} applicationId={profileData!.application!.id} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {documents.length === 0 && missingDocs.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center px-4">
                {isRestrictedMember ? (
                  <div className="flex flex-col items-center gap-2 max-w-md">
                    <AlertCircle className="h-6 w-6 text-muted-foreground/60 mb-2" />
                    <p>No documents are attached to your profile.</p>
                    <p className="text-sm">If you require specific documents or believe this is an error, please contact the administrator for assistance.</p>
                  </div>
                ) : (
                  <p>No documents found.</p>
                )}
              </CardContent>
            </Card>
          ) : documents.length > 0 ? (
            <div className="grid min-w-0 gap-4 stagger">
              {documents.map((d: any, index: number) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="min-w-0 max-w-full"
                >
                  <DocumentCard doc={d} docTypeMap={docTypeMap} />
                </motion.div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
