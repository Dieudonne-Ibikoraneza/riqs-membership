"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const { role } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/members", label: "Members Directory" },
    { href: "/about", label: "About RIQS" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-navy">RIQS</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Rwanda Institute of QS</div>
          </div>
        </Link>
        
        {/* Navigation links with active path highlighter */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map(l => {
            const active = pathname === l.href;
            return (
              <Link 
                key={l.href} 
                href={l.href} 
                className={cn(
                  "text-sm font-medium transition-colors duration-200",
                  active 
                    ? "text-navy font-semibold dark:text-gold" 
                    : "text-foreground/80 hover:text-navy dark:hover:text-gold"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {role ? (
            <Link href={role === "admin" ? "/admin" : "/dashboard"}>
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
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active 
                      ? "bg-navy/5 text-navy dark:bg-gold/10 dark:text-gold" 
                      : "hover:bg-accent text-foreground/80"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
            <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
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
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gold text-[#1a1a1a]">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">RIQS</span>
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
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Rwanda Institute of Quantity Surveyors. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
