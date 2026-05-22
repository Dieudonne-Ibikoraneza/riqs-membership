"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useConfig, type AppConfig, type Option, type CategoryDef, type DocReq } from "@/lib/config-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Save, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { role } = useAuth();
  const { config, setConfig } = useConfig();
  const [draft, setDraft] = useState<AppConfig>(config);
  const router = useRouter();

  useEffect(() => {
    if (role !== "Admin") {
      router.push("/admin");
    }
  }, [role, router]);

  if (role !== "Admin") return null;

  const save = () => { setConfig(draft); toast.success("Settings saved"); };

  const updateOptions = (key: "practiceLocations" | "entityTypes", items: Option[]) =>
    setDraft({ ...draft, [key]: items });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2"><SettingsIcon className="h-6 w-6 text-gold" /> System Settings</h1>
          <p className="text-sm text-muted-foreground">Configure application terminology, categories, and required documents. Changes apply to new applications immediately.</p>
        </div>
        <Button onClick={save} className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold"><Save className="mr-2 h-4 w-4" /> Save changes</Button>
      </div>

      <Tabs defaultValue="practice">
        <TabsList>
          <TabsTrigger value="practice">Practice Locations</TabsTrigger>
          <TabsTrigger value="entity">Entity Types</TabsTrigger>
          <TabsTrigger value="categories">Categories & Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="practice">
          <OptionEditor
            title="Practice Locations"
            description="The options applicants choose from in step 1 of the application."
            items={draft.practiceLocations}
            onChange={items => updateOptions("practiceLocations", items)}
          />
        </TabsContent>

        <TabsContent value="entity">
          <OptionEditor
            title="Entity Types"
            description="Distinguish individual applicants from registered firms."
            items={draft.entityTypes}
            onChange={items => updateOptions("entityTypes", items)}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoryEditor
            categories={draft.categories}
            onChange={cats => setDraft({ ...draft, categories: cats })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OptionEditor({ title, description, items, onChange }: {
  title: string; description: string; items: Option[]; onChange: (i: Option[]) => void;
}) {
  const add = () => onChange([...items, { id: `opt-${Date.now()}`, name: "New option", description: "" }]);
  const upd = (i: number, k: keyof Option, v: string) => {
    const next = [...items]; next[i] = { ...next[i], [k]: v }; onChange(next);
  };
  const del = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-navy">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it, i) => (
          <div key={it.id} className="grid gap-3 border p-4 md:grid-cols-[1fr_2fr_auto]">
            <div><Label>Name</Label><Input value={it.name} onChange={e => upd(i, "name", e.target.value)} /></div>
            <div><Label>Description</Label><Input value={it.description} onChange={e => upd(i, "description", e.target.value)} /></div>
            <div className="flex items-end"><Button variant="ghost" onClick={() => del(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          </div>
        ))}
        <Button variant="outline" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add option</Button>
      </CardContent>
    </Card>
  );
}

function CategoryEditor({ categories, onChange }: { categories: CategoryDef[]; onChange: (c: CategoryDef[]) => void }) {
  const [activeId, setActiveId] = useState(categories[0]?.id);
  const active = categories.find(c => c.id === activeId);

  const updateCat = (patch: Partial<CategoryDef>) => {
    if (!active) return;
    onChange(categories.map(c => c.id === active.id ? { ...c, ...patch } : c));
  };

  const addCat = () => {
    const id = `cat-${Date.now()}`;
    onChange([...categories, { id, name: "New Category", description: "", documents: [] }]);
    setActiveId(id);
  };
  const delCat = () => {
    if (!active) return;
    const next = categories.filter(c => c.id !== active.id);
    onChange(next); setActiveId(next[0]?.id);
  };

  const updateDoc = (i: number, patch: Partial<DocReq>) => {
    if (!active) return;
    const docs = [...active.documents]; docs[i] = { ...docs[i], ...patch };
    updateCat({ documents: docs });
  };
  const addDoc = () => active && updateCat({ documents: [...active.documents, { id: `d-${Date.now()}`, name: "New document", required: true }] });
  const delDoc = (i: number) => active && updateCat({ documents: active.documents.filter((_, idx) => idx !== i) });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-navy">Membership Categories</CardTitle>
        <p className="text-sm text-muted-foreground">Define categories and the documents each one requires from applicants.</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-1 border-r pr-3">
            {categories.map(c => (
              <button key={c.id} onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${activeId === c.id ? "bg-navy text-white" : "hover:bg-muted"}`}>
                {c.name}
              </button>
            ))}
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={addCat}><Plus className="mr-1 h-3 w-3" /> Add category</Button>
          </div>
          {active && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div><Label>Name</Label><Input value={active.name} onChange={e => updateCat({ name: e.target.value })} /></div>
                <div className="flex items-end justify-end"><Button variant="ghost" onClick={delCat}><Trash2 className="mr-1 h-4 w-4 text-destructive" /> Delete category</Button></div>
                <div className="md:col-span-2"><Label>Description</Label><Textarea rows={2} value={active.description} onChange={e => updateCat({ description: e.target.value })} /></div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-navy">Required documents</div>
                <div className="space-y-2">
                  {active.documents.map((d, i) => (
                    <div key={d.id} className="grid gap-3 border p-3 md:grid-cols-[1fr_auto_auto] items-center">
                      <Input value={d.name} onChange={e => updateDoc(i, { name: e.target.value })} />
                      <div className="flex items-center gap-2"><Switch checked={d.required} onCheckedChange={v => updateDoc(i, { required: v })} /><span className="text-xs text-muted-foreground">Required</span></div>
                      <Button variant="ghost" size="icon" onClick={() => delDoc(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addDoc}><Plus className="mr-1 h-3 w-3" /> Add document</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
