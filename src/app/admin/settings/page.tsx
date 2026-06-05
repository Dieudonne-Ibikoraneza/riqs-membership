"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCategoryServices, type Category } from "@/services/adminCategory.services";
import { logbookServices } from "@/services/logbook.services";
type Competency = any;
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Trash2,
  Plus,
  Save,
  Settings as SettingsIcon,
  AlertTriangle,
  Building2,
  User,
  Globe,
  MapPin,
  Loader2,
  BadgeDollarSign,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role !== "Admin") {
      router.push("/admin");
    }
  }, [role, router]);

  // Fetch categories using React Query
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: adminCategoryServices.getCategories,
  });

  const { data: documentTypes = [], isLoading: isLoadingDocs } = useQuery({
    queryKey: ["adminDocumentTypes"],
    queryFn: adminCategoryServices.getDocumentTypes,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Category> | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<Omit<Category, "id">>({
    location: "Rwandan",
    entity_type: "Individual",
    category_name: "",
    category_code: "",
    processing_fee: 0,
    currency: "RWF",
    first_year_fee: 0,
    annual_renewal_fee: 0,
    stamp_fee: 0,
    required_documents: [],
    optional_documents: []
  });

  // Set the first category as active once loaded
  useEffect(() => {
    if (categories.length > 0 && !activeId) {
      const first = categories[0];
      setActiveId(first.id);
      setDraft(first);
    }
  }, [categories, activeId]);

  // Sync draft when active category changes
  useEffect(() => {
    if (activeId) {
      const found = categories.find((c) => c.id === activeId);
      if (found) {
        setDraft(found);
      }
    }
  }, [activeId, categories]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      adminCategoryServices.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
      toast.success("Category updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update category");
    },
  });

  const createMutation = useMutation({
    mutationFn: adminCategoryServices.createCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
      toast.success("Category created successfully");
      setIsCreateOpen(false);
      if (data?.category?.id) {
        setActiveId(data.category.id);
      }
      // Reset creation model
      setNewCategory({
        location: "Rwandan",
        entity_type: "Individual",
        category_name: "",
        category_code: "",
        processing_fee: 0,
        currency: "RWF",
        first_year_fee: 0,
        annual_renewal_fee: 0,
        stamp_fee: 0,
        required_documents: [],
        optional_documents: []
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminCategoryServices.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["public", "categories"] });
      toast.success("Category deleted successfully");
      const remaining = categories.filter((c) => c.id !== activeId);
      if (remaining.length > 0) {
        setActiveId(remaining[0].id);
      } else {
        setActiveId(null);
        setDraft(null);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete category");
    },
  });


  // --- Competencies State ---
  const competencies: any[] = [];
const isLoadingCompetencies = false;
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  const [compDraft, setCompDraft] = useState<Partial<Competency> | null>(null);
  const [isCompCreateOpen, setIsCompCreateOpen] = useState(false);
  const [newCompetency, setNewCompetency] = useState<Omit<Competency, "id">>({
    name: "",
    description: "",
    targetHours: 0
  });

  useEffect(() => {
    if (competencies.length > 0 && !activeCompId) {
      setActiveCompId(competencies[0].id);
      setCompDraft(competencies[0]);
    }
  }, [competencies, activeCompId]);

  useEffect(() => {
    if (activeCompId) {
      const found = competencies.find((c: any) => c.id === activeCompId);
      if (found) setCompDraft(found);
    }
  }, [activeCompId, competencies]);

  const updateCompMutation = { mutate: (arg: any) => {}, isPending: false };
  const createCompMutation = { mutate: (arg: any) => {}, isPending: false };
  const deleteCompMutation = { mutate: (arg: any) => {}, isPending: false };

  const handleCompSave = () => {
    if (compDraft && activeCompId) updateCompMutation.mutate({ id: activeCompId, data: compDraft });
  };
  const handleCompDelete = () => {
    if (activeCompId) deleteCompMutation.mutate(activeCompId);
  };
  const compHasChanges = useMemo(() => {
    if (!compDraft || !activeCompId) return false;
    const original = competencies.find((c: any) => c.id === activeCompId);
    if (!original) return false;
    return JSON.stringify(original) !== JSON.stringify(compDraft);
  }, [compDraft, activeCompId, competencies]);

  if (role !== "Admin") return null;

  const handleSave = () => {
    if (draft && activeId) {
      updateMutation.mutate({ id: activeId, data: draft });
    }
  };

  const handleDelete = () => {
    if (activeId) {
      deleteMutation.mutate(activeId);
    }
  };

  const updateDraftField = (field: keyof Category, value: any) => {
    if (draft) {
      setDraft({ ...draft, [field]: value });
    }
  };

  const hasChanges = useMemo(() => {
    if (!draft || !activeId) return false;
    const original = categories.find((c) => c.id === activeId);
    if (!original) return false;
    return JSON.stringify(original) !== JSON.stringify(draft);
  }, [draft, activeId, categories]);

  // Document Helpers
  const addDocument = () => {
    if (draft) {
      const validTypes = documentTypes.filter((dt: any) => !dt.appliesTo || dt.appliesTo === "Both" || dt.appliesTo === draft.entity_type);
      const currentOpt = [...(draft.optional_documents || [])];
      currentOpt.push({
        name: "",
        typeCode: validTypes.length > 0 ? validTypes[0].code : "other"
      });
      updateDraftField("optional_documents", currentOpt);
      
      setTimeout(() => {
        const input = document.getElementById(`opt-input-${currentOpt.length - 1}`);
        if (input) input.focus();
      }, 50);
    }
  };



  const updateDocumentField = (isOpt: boolean, idx: number, field: "name" | "typeCode", value: string) => {
    if (draft) {
      if (isOpt && draft.optional_documents) {
        const docs = [...draft.optional_documents];
        docs[idx] = { ...docs[idx], [field]: value };
        updateDraftField("optional_documents", docs);
      } else if (!isOpt && draft.required_documents) {
        const docs = [...draft.required_documents];
        docs[idx] = { ...docs[idx], [field]: value };
        updateDraftField("required_documents", docs);
      }
    }
  };

  const toggleOptional = (isOpt: boolean, idx: number) => {
    if (draft) {
      if (isOpt && draft.optional_documents) {
        // Move from optional to required
        const doc = draft.optional_documents[idx];
        const newOpt = draft.optional_documents.filter((_, i) => i !== idx);
        const newReq = [...(draft.required_documents || []), doc];
        setDraft({ ...draft, optional_documents: newOpt, required_documents: newReq });
      } else if (!isOpt && draft.required_documents) {
        // Move from required to optional
        const doc = draft.required_documents[idx];
        const newReq = draft.required_documents.filter((_, i) => i !== idx);
        const newOpt = [...(draft.optional_documents || []), doc];
        setDraft({ ...draft, required_documents: newReq, optional_documents: newOpt });
      }
    }
  };

  const removeDocument = (isOpt: boolean, idx: number) => {
    if (draft) {
      if (isOpt && draft.optional_documents) {
        const docs = draft.optional_documents.filter((_, i) => i !== idx);
        updateDraftField("optional_documents", docs);
      } else if (!isOpt && draft.required_documents) {
        const docs = draft.required_documents.filter((_, i) => i !== idx);
        updateDraftField("required_documents", docs);
      }
    }
  };

  // Group Categories for Sidebar listing
  const rwandanIndividuals = categories.filter(c => c.location === "Rwandan" && c.entity_type === "Individual");
  const rwandanFirms = categories.filter(c => c.location === "Rwandan" && c.entity_type === "Firm");
  const nonRwandanIndividuals = categories.filter(c => c.location === "Non_Rwandan" && c.entity_type === "Individual");
  const nonRwandanFirms = categories.filter(c => c.location === "Non_Rwandan" && c.entity_type === "Firm");



  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-gold" /> System Settings
          </h1>
          <p className="text-sm text-muted-foreground font-sans">
            Configure application categories, dynamic registration fees, and customizable required documents.
          </p>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="categories">Categories & Documents</TabsTrigger>
          <TabsTrigger value="competencies">Logbook Competencies</TabsTrigger>
          <TabsTrigger value="practice">Practice Locations</TabsTrigger>
          <TabsTrigger value="entity">Entity Types</TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: PRACTICE LOCATIONS (STATIC ENUMS) ────────────────────────── */}
        <TabsContent value="practice" className="mt-4">
          <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <Globe className="h-5 w-5 text-gold" /> Practice Locations
              </CardTitle>
              <p className="text-sm text-muted-foreground font-sans">
                Core geopolitical boundaries governing Quantity Surveying registry logic.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Callout */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-950 text-xs flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">System Core Constraint Notice</span>
                  <p className="mt-1 leading-relaxed text-amber-900">
                    Practice locations correspond directly to database schema-level enums (<code className="font-mono bg-amber-100/80 px-1 rounded text-amber-700">PracticeLocation: Rwandan | Non_Rwandan</code>). These define core compliance boundaries and cannot be edited dynamically. Configure pricing tiers and documents under each location pairing inside the **Categories & Documents** tab.
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-zinc-100 dark:border-zinc-800 p-5 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-navy text-base">Rwandan Practitioner</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">Active Enum</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Applicants actively practicing within the Republic of Rwanda. Subject to local regulatory standards, currency fees in RWF, and specific RDB / RRA tax compliance clearances.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-navy font-bold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gold" /> Scope: Rwanda National Territory
                  </div>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 p-5 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-navy text-base">Non-Rwandan Practitioner</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">Active Enum</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Applicants practicing outside Rwanda or representing foreign business networks. Subject to visa/work permits verification, international certification credentials, and USD currency pricing rules.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-navy font-bold flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-gold" /> Scope: Global & International Tiers
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: ENTITY TYPES (STATIC ENUMS) ──────────────────────────────── */}
        <TabsContent value="entity" className="mt-4">
          <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-navy flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gold" /> Legal Entity Scopes
              </CardTitle>
              <p className="text-sm text-muted-foreground font-sans">
                Core legal identity types mapping applicants to individuals or registered firms.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Callout */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded text-amber-950 text-xs flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">System Core Constraint Notice</span>
                  <p className="mt-1 leading-relaxed text-amber-900">
                    Entity classifications correspond to schema level database rules (<code className="font-mono bg-amber-100/80 px-1 rounded text-amber-700">EntityType: Individual | Firm</code>). These govern custom wizard steps (e.g. Shareholder tables, education history) and are read-only.
                  </p>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-zinc-100 dark:border-zinc-800 p-5 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-navy text-base flex items-center gap-1"><User className="h-4 w-4 text-gold" /> Individual Applicant</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">Active Enum</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      Standard person registration paths (e.g., Graduate, Technologist, Professional). Governs education qualifications, personal mentorship, and progression through APC examinations.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-navy font-bold">
                    Primary Flow: Education + Mentor tracking + CV clearance
                  </div>
                </div>

                <div className="border border-zinc-100 dark:border-zinc-800 p-5 rounded-lg bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-navy text-base flex items-center gap-1"><Building2 className="h-4 w-4 text-gold" /> Corporate Firm / Company</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">Active Enum</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      Quantity Surveying practice firms and business corporations. Enforces exact sum 100% shareholder declarations, staff certificates validations, and RSSB / RRA clearance uploads.
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-navy font-bold">
                    Primary Flow: Shareholder percentage + RDB Business certs + Staff credentials
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        {/* ─── TAB 4: LOGBOOK COMPETENCIES ───────────────────────────────────── */}
        <TabsContent value="competencies" className="mt-4">
          <div className="grid gap-6 md:grid-cols-[260px_1fr] items-start">
            
            {/* Sidebar of Competencies */}
            <Card className="lg:sticky lg:top-6 border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 lg:max-h-[calc(100vh-140px)] max-h-[500px] overflow-y-auto flex flex-col">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold text-navy">Practice Areas</CardTitle>
                <p className="text-xs text-muted-foreground">Manage logbook competencies</p>
              </CardHeader>
              <div className="p-2 space-y-4 flex-1">
                {isLoadingCompetencies ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <Loader2 className="h-6 w-6 text-gold animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-0.5 font-sans text-xs">
                    {competencies.map((c: any) => (
                      <button key={c.id} onClick={() => setActiveCompId(c.id)}
                        className={`w-full text-left px-3 py-1.5 rounded transition-colors ${activeCompId === c.id ? "bg-navy text-white font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                
                <Dialog open={isCompCreateOpen} onOpenChange={setIsCompCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold text-xs mt-2 py-1.5">
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add Competency
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Competency</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Practice Area Name</Label>
                        <Input value={newCompetency.name} onChange={(e) => setNewCompetency({...newCompetency, name: e.target.value})} placeholder="e.g. Cost Planning" />
                      </div>
                      <div>
                        <Label>Target Hours</Label>
                        <Input type="number" value={newCompetency.targetHours} onChange={(e) => setNewCompetency({...newCompetency, targetHours: parseInt(e.target.value) || 0})} />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Input value={newCompetency.description} onChange={(e) => setNewCompetency({...newCompetency, description: e.target.value})} placeholder="Details..." />
                      </div>
                      <Button onClick={() => createCompMutation.mutate(newCompetency as any)} className="w-full bg-navy text-white" disabled={createCompMutation.isPending}>
                        {createCompMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Competency
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>

            {/* Editor Panel */}
            {compDraft ? (
              <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-xs bg-gold/10 text-gold font-bold px-2 py-0.5 rounded border border-gold/30 uppercase tracking-wider">Target: {compDraft.targetHours} Hrs</span>
                    <CardTitle className="text-lg font-bold text-navy mt-1.5">{compDraft.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="text-destructive hover:bg-destructive/5 font-semibold text-xs border border-transparent hover:border-destructive/10">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Competency</DialogTitle>
                          <DialogDescription>
                            Are you sure? This cannot be deleted if users have already logged hours against it.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <DialogClose asChild>
                            <Button variant="destructive" onClick={handleCompDelete} disabled={deleteCompMutation.isPending}>
                              {deleteCompMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                              Confirm Delete
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-xs font-bold text-navy">Competency Name</Label>
                      <Input className="mt-1" value={compDraft.name || ""} onChange={(e) => setCompDraft({...compDraft, name: e.target.value})} />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-navy">Target Hours</Label>
                      <Input type="number" className="mt-1" value={compDraft.targetHours ?? 0} onChange={(e) => setCompDraft({...compDraft, targetHours: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs font-bold text-navy">Description</Label>
                      <Input className="mt-1" value={compDraft.description || ""} onChange={(e) => setCompDraft({...compDraft, description: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
                <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-b-xl flex justify-end">
                  <Button onClick={handleCompSave} disabled={updateCompMutation.isPending || !compHasChanges} className="bg-navy text-white hover:bg-navy/90 font-bold text-xs px-6 py-2">
                    {updateCompMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />} Save Changes
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 p-8 text-center text-sm text-muted-foreground">
                Select a competency or create a new one.
              </Card>
            )}
          </div>
        </TabsContent>


        {/* ─── TAB 3: DYNAMIC CATEGORIES AND DOCUMENTS CRUD ───────────────────────── */}
        <TabsContent value="categories" className="mt-4">
          <div className="grid gap-6 md:grid-cols-[260px_1fr] items-start">
            
            {/* Sidebar of Categories */}
            <Card className="lg:sticky lg:top-6 border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 lg:max-h-[calc(100vh-140px)] max-h-[500px] overflow-y-auto flex flex-col">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-sm font-bold text-navy">Registry Categories</CardTitle>
                <p className="text-xs text-muted-foreground">Select a pricing category tier to edit.</p>
              </CardHeader>
              <div className="p-2 space-y-4 flex-1">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <Loader2 className="h-6 w-6 text-gold animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading registry...</span>
                  </div>
                ) : (
                  <div className="space-y-3 font-sans text-xs">
                    {/* Rwandan Individuals */}
                    {rwandanIndividuals.length > 0 && (
                      <div>
                        <div className="px-2 py-1 font-bold text-navy bg-zinc-100/50 rounded dark:bg-zinc-800/30 mb-1">Rwandan Individuals</div>
                        <div className="space-y-0.5">
                          {rwandanIndividuals.map(c => (
                            <button key={c.id} onClick={() => setActiveId(c.id)}
                              className={`w-full text-left px-3 py-1.5 rounded transition-colors ${activeId === c.id ? "bg-navy text-white font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                              {c.category_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rwandan Firms */}
                    {rwandanFirms.length > 0 && (
                      <div className="mt-2">
                        <div className="px-2 py-1 font-bold text-navy bg-zinc-100/50 rounded dark:bg-zinc-800/30 mb-1">Rwandan Firms</div>
                        <div className="space-y-0.5">
                          {rwandanFirms.map(c => (
                            <button key={c.id} onClick={() => setActiveId(c.id)}
                              className={`w-full text-left px-3 py-1.5 rounded transition-colors ${activeId === c.id ? "bg-navy text-white font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                              {c.category_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Rwandan Individuals */}
                    {nonRwandanIndividuals.length > 0 && (
                      <div className="mt-2">
                        <div className="px-2 py-1 font-bold text-navy bg-zinc-100/50 rounded dark:bg-zinc-800/30 mb-1">Non-Rwandan Individuals</div>
                        <div className="space-y-0.5">
                          {nonRwandanIndividuals.map(c => (
                            <button key={c.id} onClick={() => setActiveId(c.id)}
                              className={`w-full text-left px-3 py-1.5 rounded transition-colors ${activeId === c.id ? "bg-navy text-white font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                              {c.category_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Non-Rwandan Firms */}
                    {nonRwandanFirms.length > 0 && (
                      <div className="mt-2">
                        <div className="px-2 py-1 font-bold text-navy bg-zinc-100/50 rounded dark:bg-zinc-800/30 mb-1">Non-Rwandan Firms</div>
                        <div className="space-y-0.5">
                          {nonRwandanFirms.map(c => (
                            <button key={c.id} onClick={() => setActiveId(c.id)}
                              className={`w-full text-left px-3 py-1.5 rounded transition-colors ${activeId === c.id ? "bg-navy text-white font-semibold" : "hover:bg-muted text-muted-foreground"}`}>
                              {c.category_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button onClick={() => setIsCreateOpen(true)} className="w-full bg-gold text-[#1a1a1a] hover:bg-gold/90 border-none font-bold text-xs mt-2 py-1.5">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add Category
                </Button>
              </div>
            </Card>

            {/* Dynamic Editor Panel */}
            {draft ? (
              <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-xs bg-gold/10 text-gold font-bold px-2 py-0.5 rounded border border-gold/30 uppercase tracking-wider">{draft.category_code}</span>
                    <CardTitle className="text-lg font-bold text-navy mt-1.5">{draft.category_name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="text-destructive hover:bg-destructive/5 font-semibold text-xs border border-transparent hover:border-destructive/10">
                          <Trash2 className="h-4 w-4 mr-1" /> Delete Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Category</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this category? This action is permanent and cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                              Confirm Delete
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Category Details Form */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-xs font-bold text-navy">Category Name</Label>
                      <Input className="mt-1" value={draft.category_name || ""} onChange={(e) => updateDraftField("category_name", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-navy">Category Code</Label>
                      <Input className="mt-1" value={draft.category_code || ""} onChange={(e) => updateDraftField("category_code", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-navy">Practice Location</Label>
                      <Input className="mt-1 bg-zinc-50 dark:bg-zinc-800 text-muted-foreground" value={draft.location || ""} disabled />
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">Locked: location bindings are static database parameters.</span>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-navy">Entity Type Scope</Label>
                      <Input className="mt-1 bg-zinc-50 dark:bg-zinc-800 text-muted-foreground" value={draft.entity_type || ""} disabled />
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">Locked: entity schemas are static database parameters.</span>
                    </div>
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-800" />

                  {/* Pricing Matrix */}
                  <div>
                    <h3 className="text-sm font-bold text-navy flex items-center gap-1 mb-3"><BadgeDollarSign className="h-4 w-4 text-gold" /> Pricing & Fee Matrix</h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                      <div>
                        <Label className="text-[11px] font-bold text-navy">Currency</Label>
                        <Select value={draft.currency || "RWF"} onValueChange={(val) => updateDraftField("currency", val)}>
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="RWF">RWF</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-navy">Processing Fee</Label>
                        <Input type="number" className="mt-1" value={draft.processing_fee ?? 0} onChange={(e) => updateDraftField("processing_fee", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-navy">First Year Fee</Label>
                        <Input type="number" className="mt-1" value={draft.first_year_fee ?? 0} onChange={(e) => updateDraftField("first_year_fee", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-navy">Annual Renewal</Label>
                        <Input type="number" className="mt-1" value={draft.annual_renewal_fee ?? 0} onChange={(e) => updateDraftField("annual_renewal_fee", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label className="text-[11px] font-bold text-navy">APC Stamp Fee</Label>
                        <Input type="number" className="mt-1" value={draft.stamp_fee ?? 0} onChange={(e) => updateDraftField("stamp_fee", parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-800" />

                  {/* Required Documents List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-navy">Documents Checklist</h3>
                        <p className="text-xs text-muted-foreground">List of dynamic documentation required in the registration uploader.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addDocument} size="sm" variant="outline" className="border-dashed border-gold text-gold hover:bg-gold/5 font-semibold text-xs py-1">
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add New Document
                        </Button>
                      </div>
                    </div>

                    {((draft.required_documents && draft.required_documents.length > 0) || (draft.optional_documents && draft.optional_documents.length > 0)) ? (
                      <div className="grid gap-2">
                        {draft.required_documents?.map((doc, idx) => (
                          <div key={`req-${idx}`} className="flex gap-2 items-center border p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs font-bold text-navy/70 select-none bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded w-6 text-center">{idx + 1}</span>
                            <Input 
                              id={`req-input-${idx}`}
                              className="flex-1 text-xs h-9" 
                              value={doc?.name || ""} 
                              onChange={(e) => updateDocumentField(false, idx, "name", e.target.value)} 
                              placeholder="Document Display Name" 
                            />
                            <Select 
                              value={doc?.typeCode || ""} 
                              onValueChange={(val) => updateDocumentField(false, idx, "typeCode", val)}
                            >
                              <SelectTrigger className="w-[180px] text-xs h-9">
                                <SelectValue placeholder="System Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {documentTypes
                                  .filter((dt: any) => !dt.appliesTo || dt.appliesTo === "Both" || dt.appliesTo === draft.entity_type)
                                  .map((dt: any) => (
                                  <SelectItem key={dt.id} value={dt.code}>{dt.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="default"
                              size="sm"
                              onClick={() => toggleOptional(false, idx)}
                              className="text-xs px-3 h-9 bg-gold text-navy hover:bg-gold/90 font-bold"
                            >
                              Required
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => removeDocument(false, idx)} className="text-destructive hover:bg-destructive/5 h-9 w-9">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {draft.optional_documents?.map((doc, idx) => (
                          <div key={`opt-${idx}`} className="flex gap-2 items-center border p-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800">
                            <span className="text-xs font-bold text-navy/70 select-none bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded w-6 text-center">{(draft.required_documents?.length || 0) + idx + 1}</span>
                            <Input 
                              id={`opt-input-${idx}`}
                              className="flex-1 text-xs h-9" 
                              value={doc?.name || ""} 
                              onChange={(e) => updateDocumentField(true, idx, "name", e.target.value)} 
                              placeholder="Document Display Name" 
                            />
                            <Select 
                              value={doc?.typeCode || ""} 
                              onValueChange={(val) => updateDocumentField(true, idx, "typeCode", val)}
                            >
                              <SelectTrigger className="w-[180px] text-xs h-9">
                                <SelectValue placeholder="System Type" />
                              </SelectTrigger>
                              <SelectContent>
                                {documentTypes
                                  .filter((dt: any) => !dt.appliesTo || dt.appliesTo === "Both" || dt.appliesTo === draft.entity_type)
                                  .map((dt: any) => (
                                  <SelectItem key={dt.id} value={dt.code}>{dt.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => toggleOptional(true, idx)}
                              className="text-xs px-3 h-9 text-muted-foreground"
                            >
                              Optional
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => removeDocument(true, idx)} className="text-destructive hover:bg-destructive/5 h-9 w-9">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-xs text-muted-foreground bg-zinc-50 dark:bg-zinc-950 p-3 rounded border border-zinc-100 dark:border-zinc-800 flex items-start gap-2">
                           <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                           <p>No documents are configured for this category. Please add the required documents manually using the 'Add New Document' button.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-b-xl flex justify-end">
                  <Button onClick={handleSave} disabled={updateMutation.isPending || !hasChanges} className="bg-navy text-white hover:bg-navy/90 font-bold text-xs px-6 py-2">
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />} Save All Changes
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border border-zinc-100 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900 p-8 text-center text-sm text-muted-foreground">
                Select a category from the sidebar or click "+ Add Category" to start.
              </Card>
            )}
          </div>
        </TabsContent>

      </Tabs>

      {/* CREATE DIALOG MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xl rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy flex items-center gap-1.5"><Plus className="h-5 w-5 text-gold" /> Create Membership Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2 text-xs font-sans">
            <div className="grid gap-3 grid-cols-2">
              <div>
                <Label className="text-[11px] font-bold text-navy">Category Name</Label>
                <Input placeholder="e.g. Graduate Route 1" className="mt-1" value={newCategory.category_name} onChange={(e) => setNewCategory({...newCategory, category_name: e.target.value})} />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-navy">Category Code</Label>
                <Input placeholder="e.g. GQST" className="mt-1" value={newCategory.category_code} onChange={(e) => setNewCategory({...newCategory, category_code: e.target.value})} />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div>
                <Label className="text-[11px] font-bold text-navy">Practice Location</Label>
                <Select value={newCategory.location} onValueChange={(val: 'Rwandan' | 'Non_Rwandan') => setNewCategory({...newCategory, location: val, currency: val === 'Non_Rwandan' ? 'USD' : 'RWF'})}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rwandan">Rwandan (Local)</SelectItem>
                    <SelectItem value="Non_Rwandan">Non-Rwandan (Foreign)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-bold text-navy">Entity Type Scope</Label>
                <Select value={newCategory.entity_type} onValueChange={(val: 'Individual' | 'Firm') => setNewCategory({...newCategory, entity_type: val})}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual Person</SelectItem>
                    <SelectItem value="Firm">Corporate Firm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div>
                <Label className="text-[11px] font-bold text-navy">Currency</Label>
                <Select value={newCategory.currency} onValueChange={(val) => setNewCategory({...newCategory, currency: val})}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] font-bold text-navy">Processing Fee</Label>
                <Input type="number" className="mt-1" value={newCategory.processing_fee} onChange={(e) => setNewCategory({...newCategory, processing_fee: parseFloat(e.target.value) || 0})} />
              </div>
            </div>

            <div className="grid gap-3 grid-cols-3">
              <div>
                <Label className="text-[11px] font-bold text-navy">First Year Fee</Label>
                <Input type="number" className="mt-1" value={newCategory.first_year_fee} onChange={(e) => setNewCategory({...newCategory, first_year_fee: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-navy">Annual Subscription</Label>
                <Input type="number" className="mt-1" value={newCategory.annual_renewal_fee} onChange={(e) => setNewCategory({...newCategory, annual_renewal_fee: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <Label className="text-[11px] font-bold text-navy">APC Stamp Fee</Label>
                <Input type="number" className="mt-1" value={newCategory.stamp_fee} onChange={(e) => setNewCategory({...newCategory, stamp_fee: parseFloat(e.target.value) || 0})} />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 pt-3 border-t">
            <Button onClick={() => setIsCreateOpen(false)} variant="outline" className="text-xs font-semibold">Cancel</Button>
            <Button 
              onClick={() => {
                createMutation.mutate({
                  ...newCategory,
                  required_documents: [],
                  optional_documents: [],
                });
              }} 
              disabled={createMutation.isPending || !newCategory.category_name || !newCategory.category_code} 
              className="bg-navy text-white hover:bg-navy/90 text-xs font-bold"
            >
              {createMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />} Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
