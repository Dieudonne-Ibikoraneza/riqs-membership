"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTemplates, updateTemplate, deleteTemplate, EmailTemplate } from "@/services/template.services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileCode, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TemplateSidebar, CATEGORY_COLORS } from "@/components/TemplateSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TemplatesPage() {
  const { role } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role && !["Admin", "Reviewer", "Approver"].includes(role)) {
      router.push("/admin");
    }
  }, [role, router]);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: getTemplates,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [localDraft, setLocalDraft] = useState<EmailTemplate | null>(null);

  // When templates load, set an active one if not set
  useEffect(() => {
    if (templates.length > 0 && !activeId) {
      setActiveId(templates[0].id);
    }
  }, [templates, activeId]);

  // When activeId changes, populate local draft
  useEffect(() => {
    const found = templates.find((t) => t.id === activeId);
    if (found) {
      setLocalDraft(found);
    } else {
      setLocalDraft(null);
    }
  }, [activeId, templates]);

  const updateMutation = useMutation({
    mutationFn: (data: EmailTemplate) => updateTemplate(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template saved successfully");
    },
    onError: () => {
      toast.error("Failed to save template");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("Template deleted successfully");
      setActiveId(null);
      setLocalDraft(null);
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });

  if (role && !["Admin", "Reviewer", "Approver"].includes(role)) return null;

  const updateDraft = (patch: Partial<EmailTemplate>) => {
    if (!localDraft) return;
    setLocalDraft({ ...localDraft, ...patch });
  };

  const handleSave = () => {
    if (localDraft) {
      updateMutation.mutate(localDraft);
    }
  };

  const handleDelete = () => {
    if (localDraft && confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate(localDraft.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <FileCode className="h-6 w-6 text-gold" /> Email Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Templates used by the system when communicating with applicants. Use{" "}
          <code>{"{{name}}"}</code>, <code>{"{{category}}"}</code>,{" "}
          <code>{"{{membershipId}}"}</code>, <code>{"{{notes}}"}</code>,{" "}
          <code>{"{{otpCode}}"}</code> as placeholders.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
          <Card className="lg:sticky lg:top-3 self-start z-10 w-full overflow-hidden shadow-sm lg:h-[calc(100vh-110px)] flex flex-col">
            <TemplateSidebar
              templates={templates}
              activeId={activeId}
              onSelect={(tpl) => setActiveId(tpl.id)}
            />
          </Card>

          {localDraft ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-navy">{role === "Admin" ? "Edit template" : "View template"}</CardTitle>
                {role === "Admin" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gold text-[#1a1a1a] hover:bg-gold/90"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      <Save className="mr-1 h-4 w-4" /> Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Template name</Label>
                  <Input
                    value={localDraft.name}
                    onChange={(e) => updateDraft({ name: e.target.value })}
                    disabled={role !== "Admin"}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={localDraft.category || "Uncategorized"}
                      onValueChange={(val) =>
                        updateDraft({ category: val === "Uncategorized" ? "" : val })
                      }
                      disabled={role !== "Admin"}
                    >
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                        {Object.keys(CATEGORY_COLORS).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description..."
                      value={localDraft.description || ""}
                      onChange={(e) => updateDraft({ description: e.target.value })}
                      disabled={role !== "Admin"}
                    />
                  </div>
                </div>
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={localDraft.subject}
                    onChange={(e) => updateDraft({ subject: e.target.value })}
                    disabled={role !== "Admin"}
                  />
                </div>
                <div>
                  <Label>Body</Label>
                  <div className={role !== "Admin" ? "pointer-events-none opacity-80" : ""}>
                    <RichTextEditor
                      value={localDraft.body}
                      onChange={(html) => updateDraft({ body: html })}
                    />
                  </div>
                </div>
                <div className="border border-gold/30 bg-gold/5 p-3 text-xs">
                  <div className="font-semibold text-navy">Preview</div>
                  <div className="mt-1">
                    <strong>Subject:</strong> {localDraft.subject}
                  </div>
                  <div
                    className="mt-2 text-sm max-w-none prose prose-sm prose-zinc dark:prose-invert [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-2 [&_h1]:mb-4 [&_h2]:mb-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-navy [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: localDraft.body }}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Select a template to edit.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
