"use client";

import { Sparkles, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailTemplate } from "@/lib/config-store";

export const CATEGORY_COLORS: Record<string, string> = {
  Onboarding: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  Billing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  Events: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  Mentorship: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  Applications: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  Compliance: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  Membership: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
};

export function TemplateSidebar({
  templates,
  activeId,
  onSelect,
  onAdd,
}: {
  templates: EmailTemplate[];
  activeId: string | null;
  onSelect: (tpl: EmailTemplate) => void;
  onAdd?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <Sparkles className="h-4 w-4 text-gold" />
        <span className="text-sm font-bold text-navy dark:text-gold">
          Templates
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium">
          {templates.length} available
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {templates.map((tpl) => (
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
                {tpl.name?.trim() || "Not provided yet"}
              </span>
            </div>
            {tpl.description ? (
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2 leading-snug pl-5">
                {tpl.description}
              </p>
            ) : null}
            <div className="mt-1.5 pl-5 flex items-center gap-1 flex-wrap">
              <span
                className={cn(
                  "inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  tpl.category && CATEGORY_COLORS[tpl.category] 
                    ? CATEGORY_COLORS[tpl.category] 
                    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
                )}
              >
                {tpl.category?.trim() || "Uncategorized"}
              </span>
            </div>
          </button>
        ))}
      </div>
      {onAdd && (
        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs font-medium text-navy dark:text-gold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New template
          </button>
        </div>
      )}
    </div>
  );
}
