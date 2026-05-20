"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("demo@riqs.rw");
  const [pw, setPw] = useState("password");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return toast.error("Enter your email and password");
    login(email, email.includes("admin") ? "admin" : "member");
    toast.success("Welcome back");
    router.push(email.includes("admin") ? "/admin" : "/dashboard");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2 bg-background">
      <div className="hidden brand-gradient md:flex md:flex-col md:justify-between md:p-12 text-white relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-fade" />
        
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold text-[#1a1a1a]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">RIQS</div>
            <div className="text-xs text-white/70">Membership Portal</div>
          </div>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight">Welcome back.</h2>
          <p className="mt-3 max-w-md text-white/80 leading-relaxed font-sans">
            Sign in to manage your professional profile, certificate, payments and CPD records.
          </p>
        </div>
        <div className="text-xs text-white/60 relative z-10">
          © {new Date().getFullYear()} Rwanda Institute of Quantity Surveyors
        </div>
      </div>
      
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-zinc-150 dark:border-zinc-800 shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-navy">Sign in</h1>
            <p className="mt-1 text-xs text-muted-foreground font-sans">
              Tip: use any email. Include the word <strong>admin</strong> to sign in as administrator.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="em">Email address</Label>
                <Input id="em" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pw">Password</Label>
                  <Link href="/login" className="text-xs text-navy hover:underline dark:text-gold">
                    Forgot password?
                  </Link>
                </div>
                <Input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} />
              </div>
              <Button type="submit" className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold border-none">
                Sign in
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground font-sans">
              No account?{" "}
              <Link href="/register" className="font-semibold text-navy hover:underline dark:text-gold">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
