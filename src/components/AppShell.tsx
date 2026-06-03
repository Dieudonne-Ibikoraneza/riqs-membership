"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/services/queryKeys";
import { applicantServices } from "@/services/applicant.services";
import {
  Building2,
  LayoutDashboard,
  User2,
  FileText,
  Award,
  Wallet,
  GraduationCap,
  Folder,
  Mail,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Users,
  Send,
  Shield,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function AppShell({
  children,
  kind,
}: {
  children: ReactNode;
  kind: "member" | "admin" | "teacher";
}) {
  const { name, email, role, isMentor, isTeacher, isStudent, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: queryKeys.applicant.profile(),
    queryFn: applicantServices.getProfile,
    enabled: !!role && kind === "member" && role !== "Admin",
  });

  const [isFirm, setIsFirm] = useState(false);

  useEffect(() => {
    let firmStatus = profileData?.application?.entityType === "Firm" || profileData?.profile?.membershipClass?.includes("Firm");
    
    if (!firmStatus && typeof window !== "undefined") {
      try {
        const draft = localStorage.getItem("riqs_app_draft");
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.entityType === "Firm") firmStatus = true;
        }
      } catch (e) {}
    }
    
    setIsFirm(firmStatus || false);
  }, [profileData]);

  // Route protection and workspace boundary enforcement
  useEffect(() => {
    if (!role) return; // Wait until auth is hydrated

    if (kind === "admin" && !["Admin", "Reviewer", "Approver"].includes(role)) {
      router.replace(isTeacher ? "/teacher" : "/dashboard");
    } else if (kind === "teacher" && !isTeacher) {
      router.replace(["Admin", "Reviewer", "Approver"].includes(role) ? "/admin" : "/dashboard");
    } else if (kind === "member" && !isStudent && !isMentor) {
      if (isTeacher) {
        router.replace("/teacher");
      } else if (["Admin", "Reviewer", "Approver"].includes(role)) {
        router.replace("/admin");
      }
    }
  }, [role, kind, isTeacher, isStudent, isMentor, router]);

  const memberLinks = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/profile", label: "My Profile", icon: User2 },
    { href: "/dashboard/application", label: "Application", icon: FileText },
    { href: "/dashboard/certificate", label: "Certificate", icon: Award },
    { href: "/dashboard/payments", label: "Payments", icon: Wallet },
    ...(isFirm ? [] : [{ href: "/dashboard/mentorship", label: isMentor ? "My Mentees" : "Mentorship", icon: GraduationCap }]),
    ...(isTeacher ? [{ href: "/teacher", label: "Teacher Workspace", icon: Users }] : []),
    { href: "/dashboard/documents", label: "Documents", icon: Folder },
  ];

  const adminLinks = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/applications", label: "Applications", icon: ClipboardList },
    ...(role === "Admin" ? [{ href: "/admin/apc", label: "APC Assessments", icon: GraduationCap }] : []),
    ...(role === "Admin" ? [{ href: "/admin/payments", label: "Finance & Payments", icon: Wallet }] : []),
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/email", label: "Email System", icon: Send },
    ...(role === "Admin"
      ? [
          { href: "/admin/staff", label: "Staff Management", icon: Shield },
          { href: "/admin/settings", label: "System Settings", icon: Settings },
          { href: "/admin/templates", label: "Email Templates", icon: FileCode },
        ]
      : []),
    { href: "/admin/export", label: "Export Tool", icon: Folder },
    ...(role === "Admin" ? [{ href: "/admin/audit", label: "Audit Log", icon: ClipboardList }] : []),
  ];

  const activeAppMatch = pathname.match(/^\/teacher\/application\/([^/]+)/);
  const activeAppId = activeAppMatch ? activeAppMatch[1] : null;

  const teacherLinks = [
    { href: "/teacher", label: "My Students", icon: Users, exact: true },
    { 
      href: activeAppId ? `/teacher/application/${activeAppId}` : "#", 
      label: "Application", 
      icon: ClipboardList,
      disabled: !activeAppId
    },
  ];

  const links = kind === "admin" ? adminLinks : kind === "teacher" ? teacherLinks : memberLinks;

  const doLogout = () => {
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    setLogoutOpen(false);
    logout();
    router.push("/login");
  };

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-center"
        >
          <h2 className="text-lg font-bold text-navy">Please sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You need to be logged in to view this area.
          </p>
          <Link href="/login" passHref>
            <Button className="mt-4 bg-gold text-[#1a1a1a] hover:bg-gold/90 transition-transform hover:scale-[1.02] active:scale-[0.98]">
              Sign in
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const initials = (name || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans">
      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar with dynamic collapsibility */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col brand-gradient text-white md:relative",
          "transition-all duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "md:w-[76px] w-64" : "w-64"
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "relative h-20 shrink-0 bg-white flex items-center justify-center overflow-hidden",
            collapsed && "md:hidden",
          )}
        >
          <Link
            href="/"
            className="w-full h-full flex items-center justify-center p-3"
          >
            <motion.img
              whileHover={{ scale: 1.03 }}
              src="/riqs-logo.png"
              alt="RIQS Logo"
              className="w-full h-full object-contain shrink-0"
            />
          </Link>
          <button
            className="absolute right-4 md:hidden text-zinc-500 hover:text-zinc-800"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav (Staggered spring loading & interactive hovers) */}
        <nav
          className={cn(
            "flex-1 px-3 py-4",
            collapsed ? "overflow-visible" : "overflow-y-auto scrollbar-thin",
          )}
        >
          <div className="space-y-1">
            {links.map((l, index) => {
              const aliasMatch =
                (l as any).aliases?.some((a: string) =>
                  pathname.startsWith(a),
                ) ?? false;
              const active = l.exact
                ? pathname === l.href
                : pathname.startsWith(l.href) || aliasMatch;
              return (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 260,
                    damping: 25,
                  }}
                >
                  <Link
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    title={undefined}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-md",
                      "before:absolute before:left-0 before:top-1/2 before:h-0 before:w-[3px] before:-translate-y-1/2 before:bg-gold before:transition-all",
                      active
                        ? "bg-white/10 text-white before:h-6"
                        : "text-white/70 hover:bg-white/5 hover:text-white hover:pl-4",
                      (l as any).disabled && "opacity-50 pointer-events-none",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <l.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110",
                        active && "text-gold",
                      )}
                    />
                    {!collapsed && <span className="truncate">{l.label}</span>}
                    {!collapsed && active && (
                      <motion.span
                        layoutId="activeDot"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-gold animate-pulse-gold"
                      />
                    )}
                    {collapsed && (
                      <span className="absolute left-full ml-4 px-2.5 py-1.5 bg-[#082649]/95 text-white text-xs font-semibold rounded-md border border-white/10 opacity-0 translate-x-[-10px] pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl whitespace-nowrap z-50">
                        {l.label}
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Footer Area with smooth dynamic collapse transitions */}
        <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex w-full items-center justify-center gap-2 bg-white/5 px-2 py-2 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white rounded-md"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" /> Collapse
              </>
            )}
          </button>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 p-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-[#1a1a1a]"
                >
                  {initials}
                </motion.div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white">
                    {name}
                  </div>
                  <div className="truncate text-[11px] text-white/60">
                    {email}
                  </div>
                </div>
              </div>
              <Button
                onClick={doLogout}
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </motion.div>
          ) : (
            <button
              onClick={doLogout}
              className="flex w-full items-center justify-center bg-white/5 py-2 text-white/70 hover:bg-white/10 hover:text-white rounded-md"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <header className="absolute top-0 left-0 right-0 z-30 flex h-20 items-center justify-between bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-sm">
              <div className="font-semibold text-navy text-lg">
                {kind === "admin" ? `${role === "Admin" ? "Administrator" : role} Workspace` : kind === "teacher" ? "Teacher Workspace" : "Member Portal"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{name}</div>
              <div className="text-[11px] text-muted-foreground">
                {kind === "admin"
                  ? role === "Admin" ? "System Administrator" : role || "Staff"
                  : kind === "teacher" ? "Teacher Workspace"
                  : isTeacher ? "Teacher" : isMentor ? "Mentor" : isStudent ? "Student" : "Active Member"}
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-[#d18a00] text-sm font-semibold text-[#1a1a1a] shadow-gold cursor-pointer"
            >
              {initials}
            </motion.div>
          </div>
        </header>

        {/* Content scrolls independently */}
        <main className="flex-1 overflow-y-auto pt-20">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="p-4 md:p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account? You will need to sign in again to access the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLogout} className="bg-red-600 text-white hover:bg-red-700">
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
