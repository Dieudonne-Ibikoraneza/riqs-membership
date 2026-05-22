"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useConfig, type EmailTemplate } from "@/lib/config-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, FileCode } from "lucide-react";
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
  const { config, setConfig } = useConfig();
  const [activeId, setActiveId] = useState(config.emailTemplates[0]?.id);
  const router = useRouter();

  useEffect(() => {
    if (role !== "Admin") {
      router.push("/admin");
    }
  }, [role, router]);

  if (role !== "Admin") return null;

  const templates = config.emailTemplates;
  const active = templates.find((t) => t.id === activeId);

  const update = (patch: Partial<EmailTemplate>) => {
    if (!active) return;
    setConfig({
      ...config,
      emailTemplates: templates.map((t) =>
        t.id === active.id ? { ...t, ...patch } : t,
      ),
    });
  };

  const add = () => {
    const t: EmailTemplate = {
      id: `tpl-${Date.now()}`,
      name: "New template",
      category: "",
      subject: "",
      body: "",
      description: "",
    };
    setConfig({ ...config, emailTemplates: [...templates, t] });
    setActiveId(t.id);
  };
  const del = () => {
    if (!active) return;
    const next = templates.filter((t) => t.id !== active.id);
    setConfig({ ...config, emailTemplates: next });
    setActiveId(next[0]?.id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <FileCode className="h-6 w-6 text-gold" /> Email Templates
        </h1>
        <p className="text-sm text-muted-foreground">
          Templates used by reviewers when communicating with applicants. Use{" "}
          <code>{"{{name}}"}</code>, <code>{"{{category}}"}</code>,{" "}
          <code>{"{{membershipId}}"}</code>, <code>{"{{notes}}"}</code>,{" "}
          <code>{"{{expiresAt}}"}</code> as placeholders.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr] items-start">
        <Card className="lg:sticky lg:top-3 self-start z-10 w-full overflow-hidden shadow-sm lg:h-[calc(100vh-110px)] flex flex-col">
          <TemplateSidebar
            templates={templates}
            activeId={activeId || null}
            onSelect={(tpl) => setActiveId(tpl.id)}
            onAdd={add}
          />
        </Card>

        {active ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-navy">Edit template</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={del}>
                  <Trash2 className="mr-1 h-4 w-4 text-destructive" /> Delete
                </Button>
                <Button
                  size="sm"
                  className="bg-gold text-[#1a1a1a] hover:bg-gold/90"
                  onClick={() => toast.success("Template saved")}
                >
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Template name</Label>
                <Input
                  value={active.name}
                  onChange={(e) => update({ name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={active.category || "Uncategorized"}
                    onValueChange={(val) =>
                      update({ category: val === "Uncategorized" ? "" : val })
                    }
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
                    value={active.description || ""}
                    onChange={(e) => update({ description: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={active.subject}
                  onChange={(e) => update({ subject: e.target.value })}
                />
              </div>
              <div>
                <Label>Body</Label>
                <RichTextEditor
                  value={active.body}
                  onChange={(html) => update({ body: html })}
                />
              </div>
              <div className="border border-gold/30 bg-gold/5 p-3 text-xs">
                <div className="font-semibold text-navy">Preview</div>
                <div className="mt-1">
                  <strong>Subject:</strong> {active.subject}
                </div>
                <div
                  className="mt-2 text-sm max-w-none prose prose-sm prose-zinc dark:prose-invert [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-2 [&_h1]:mb-4 [&_h2]:mb-4 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-navy [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: active.body }}
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
    </div>
  );
}
