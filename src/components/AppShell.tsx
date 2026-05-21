"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, User2, FileText, Award, Wallet, GraduationCap,
  Folder, Mail, LogOut, Menu, X, ClipboardList, Users, Send, Shield,
  ChevronsLeft, ChevronsRight, Settings, FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children, kind }: { children: ReactNode; kind: "member" | "admin" }) {
  const { name, email, role, isMentor, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const memberLinks = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/dashboard/profile", label: "My Profile", icon: User2 },
    { to: "/dashboard/application", label: "Application", icon: FileText },
    { to: "/dashboard/certificate", label: "Certificate", icon: Award },
    { to: "/dashboard/payments", label: "Payments", icon: Wallet },
    { to: "/dashboard/mentorship", label: isMentor ? "My Mentees" : "Mentorship", icon: GraduationCap },
    { to: "/dashboard/documents", label: "Documents", icon: Folder },
    { to: "/dashboard/communications", label: "Messages", icon: Mail },
  ];

  const adminLinks = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { to: "/admin/applications", label: "Applications", icon: ClipboardList },
    { to: "/admin/members", label: "Members", icon: Users },
    { to: "/admin/email", label: "Email System", icon: Send },
    ...(role === "admin" ? [
      { to: "/admin/settings", label: "System Settings", icon: Settings },
      { to: "/admin/templates", label: "Email Templates", icon: FileCode },
    ] : []),
    { to: "/admin/export", label: "Export Tool", icon: Folder },
    { to: "/admin/audit", label: "Audit Log", icon: Shield },
  ];

  const links = kind === "admin" ? adminLinks : memberLinks;

  const doLogout = () => { logout(); router.push("/"); };

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Please sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">You need to be logged in to view this area.</p>
          <Link href="/login"><Button className="mt-4 bg-gold text-[#1a1a1a] hover:bg-gold/90">Sign in</Button></Link>
        </div>
      </div>
    );
  }

  const initials = (name || "U").split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      {/* mobile overlay */}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 md:hidden animate-fade-in" />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col brand-gradient text-white shadow-navy transition-[width,transform] duration-300 ease-out md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-white p-1 shadow-gold">
              <img src="/riqs-logo.png" alt="RIQS" className="h-full w-full object-contain" />
            </div>
            {!collapsed && (
              <div className="leading-tight animate-fade-in-left">
                <div className="text-sm font-bold tracking-wide">RIQS</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/60">
                  {role === "admin" ? "Super Admin" : role === "reviewer" ? "Reviewer" : isMentor ? "Mentor" : "Member"}
                </div>
              </div>
            )}
          </Link>
          <button className="md:hidden text-white/80 hover:text-white" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav (independently scrollable) */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
          <div className="space-y-1 stagger">
            {links.map(l => {
              const active = l.exact ? pathname === l.to : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  href={l.to}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? l.label : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    "before:absolute before:left-0 before:top-1/2 before:h-0 before:w-[3px] before:-translate-y-1/2 before:bg-gold before:transition-all",
                    active
                      ? "bg-white/10 text-white before:h-6"
                      : "text-white/70 hover:bg-white/5 hover:text-white hover:pl-4",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <l.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110", active && "text-gold")} />
                  {!collapsed && <span className="truncate">{l.label}</span>}
                  {!collapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold animate-pulse-gold" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden md:flex w-full items-center justify-center gap-2 bg-white/5 px-2 py-2 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
          {!collapsed ? (
            <div className="bg-white/5 p-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-[#1a1a1a]">{initials}</div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{name}</div>
                  <div className="truncate text-[11px] text-white/60">{email}</div>
                </div>
              </div>
              <Button onClick={doLogout} variant="ghost" size="sm" className="mt-2 w-full justify-start text-white hover:bg-white/10">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          ) : (
            <button onClick={doLogout} className="flex w-full items-center justify-center bg-white/5 py-2 text-white/70 hover:bg-white/10 hover:text-white">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-white/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden" aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-sm">
              <div className="font-semibold text-navy">
                {kind === "admin" ? "Administrator Workspace" : "Member Portal"}
              </div>
              <div className="text-[11px] text-muted-foreground">{pathname}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-[11px] text-muted-foreground">
                {role === "admin" ? "System Administrator" : role === "reviewer" ? "Reviewer / Approver" : isMentor ? "Mentor · Active Member" : "Active Member"}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-[#d18a00] text-sm font-semibold text-[#1a1a1a] shadow-gold">
              {initials}
            </div>
          </div>
        </header>
        {/* Content scrolls independently */}
        <main className="flex-1 overflow-y-auto">
          <div key={pathname} className="animate-fade-in p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
