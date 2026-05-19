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

export default function Register() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", pw: "", pw2: "" });
  const upd = (k: string, v: string) => setForm(s => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.pw) return toast.error("Please complete all fields");
    if (form.pw !== form.pw2) return toast.error("Passwords do not match");
    login(form.email, form.pw);
    toast.success("Account created — start your application");
    router.push("/dashboard/application");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2 bg-background">
      <div className="flex items-center justify-center p-6 order-2 md:order-1">
        <Card className="w-full max-w-md border-zinc-150 dark:border-zinc-800 shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-navy">Create account</h1>
            <p className="mt-1 text-xs text-muted-foreground font-sans">
              After registration you'll start your membership application.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="reg-name">Full name</Label>
                <Input id="reg-name" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="As on national ID" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-em">Email</Label>
                <Input id="reg-em" type="email" value={form.email} onChange={e => upd("email", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="reg-pw">Password</Label>
                  <Input id="reg-pw" type="password" value={form.pw} onChange={e => upd("pw", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-pw2">Confirm</Label>
                  <Input id="reg-pw2" type="password" value={form.pw2} onChange={e => upd("pw2", e.target.value)} />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold border-none mt-2">
                Create account
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-muted-foreground font-sans">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-navy hover:underline dark:text-gold">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="hidden brand-gradient md:flex md:flex-col md:justify-between md:p-12 text-white order-1 md:order-2 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-fade" />
        
        <Link href="/" className="flex items-center gap-2 self-end relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gold text-[#1a1a1a]">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold">RIQS</div>
            <div className="text-xs text-white/70">Membership Portal</div>
          </div>
        </Link>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight">Join Rwanda's QS register.</h2>
          <ul className="mt-4 space-y-2 text-white/80 text-sm font-sans">
            <li>• Recognized professional credentials</li>
            <li>• Digitally verifiable membership certificate</li>
            <li>• Access to CPD, mentorship and tenders</li>
          </ul>
        </div>
        <div className="text-xs text-white/60 relative z-10">
          © {new Date().getFullYear()} RIQS
        </div>
      </div>
    </div>
  );
}
