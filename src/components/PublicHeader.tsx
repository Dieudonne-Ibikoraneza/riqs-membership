"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { role, isTeacher } = useAuth();
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const links = [
    { href: "/", label: "Home" },
    { href: "/members", label: "Members Directory" },
    { href: "/about", label: "About RIQS" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex h-20 md:h-24 max-w-7xl items-center justify-between px-6 md:px-12 xl:px-6">
        <Link href="/" className="flex items-center py-1">
          <img 
            src="/riqs-logo.png" 
            alt="RIQS Logo" 
            className="h-16 md:h-20 w-auto object-contain transition-transform duration-200 hover:scale-[1.03]" 
          />
        </Link>
        
        {/* Navigation links with active path highlighter and gliding hover backdrop */}
        <nav 
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {links.map((l, index) => {
            const active = pathname === l.href;
            return (
              <Link 
                key={l.href} 
                href={l.href} 
                onMouseEnter={() => setHoveredIndex(index)}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md",
                  active 
                    ? "text-navy font-semibold dark:text-gold" 
                    : "text-foreground/80 hover:text-navy dark:hover:text-gold"
                )}
              >
                {hoveredIndex === index && (
                  <motion.span
                    layoutId="headerHoverBackdrop"
                    className="absolute inset-0 rounded-md bg-zinc-100/70 dark:bg-zinc-800/40 backdrop-blur-sm -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{l.label}</span>
                {active && (
                  <motion.span
                    layoutId="publicActiveNav"
                    className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-gold rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {role ? (
            <Link href={role === "Admin" || role === "Reviewer" || role === "Head_Reviewer" || role === "Approver" ? "/admin" : isTeacher ? "/teacher" : "/dashboard"}>
              <Button className="bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-0">
                Go to dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-navy dark:text-white">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gold text-[#1a1a1a] hover:bg-gold/90 border-0">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile navigation panel */}
      {open && (
        <div className="border-t bg-white dark:bg-zinc-950 md:hidden animate-fade-in">
          <div className="space-y-1 px-4 py-3">
            {links.map(l => {
              const active = pathname === l.href;
              return (
                <Link 
                  key={l.href} 
                  href={l.href} 
                  onClick={() => setOpen(false)} 
                  className={cn(
                    "relative block rounded-md px-3 py-2 text-sm font-medium transition-colors overflow-hidden",
                    active 
                      ? "text-navy font-semibold dark:text-gold" 
                      : "hover:bg-accent text-foreground/80"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="publicActiveNavMobile"
                      className="absolute inset-0 bg-navy/5 dark:bg-gold/10 -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              );
            })}
            <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
              {role ? (
                <Link href={role === "Admin" || role === "Reviewer" || role === "Head_Reviewer" || role === "Approver" ? "/admin" : isTeacher ? "/teacher" : "/dashboard"} className="flex-1">
                  <Button className="w-full bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold border-0">
                    Go to dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full bg-gold text-[#1a1a1a] hover:bg-gold/90 border-0">
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-zinc-100 bg-navy text-white dark:border-zinc-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:px-12 xl:px-6 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center">
            <img 
              src="/riqs-logo.svg" 
              alt="RIQS Logo" 
              className="h-12 w-auto object-contain transition-transform duration-200 hover:scale-[1.03]" 
            />
          </div>
          <p className="mt-3 text-sm text-white/70 leading-relaxed">
            Rwanda Institute of Quantity Surveyors — the professional regulatory body for QS practice in Rwanda.
          </p>
        </div>
        
        <div>
          <h4 className="mb-3 text-sm font-semibold gold-text">Quick Links</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>
              <Link href="/members" className="hover:text-gold transition-colors">
                Members Directory
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-gold transition-colors">
                Become a Member
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-gold transition-colors">
                Member Login
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="mb-3 text-sm font-semibold gold-text">Contact</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>Kigali, Rwanda</li>
            <li>info@riqs.rw</li>
            <li>+250 788 000 000</li>
          </ul>
        </div>
        
        <div>
          <h4 className="mb-3 text-sm font-semibold gold-text">Legal</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Code of Conduct</li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 md:px-12 xl:px-6 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Rwanda Institute of Quantity Surveyors. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
