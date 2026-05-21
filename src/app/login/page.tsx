"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import Image from "next/image";

export default function Login() {
  const { startLogin, verifyOtp, pending, cancelPending } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("demo@riqs.rw");
  const [pw, setPw] = useState("password");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return toast.error("Enter your email and password");
    const code = startLogin(email, pw);
    setDevCode(code);
    toast.success(`We sent a 4-digit code to ${email}`);
  };

  const verify = () => {
    if (otp.length !== 4) return toast.error("Enter the 4-digit code");
    if (!verifyOtp(otp)) return toast.error("Invalid code — try 1234");
    toast.success("Welcome back");
    router.push(email.toLowerCase().includes("admin") || email.toLowerCase().includes("reviewer") ? "/admin" : "/dashboard");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden brand-gradient md:flex md:flex-col md:justify-between md:p-12 text-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center bg-white p-1">
            <img src="/riqs-logo.png" alt="RIQS" className="h-full w-full object-contain" />
          </div>
          <div><div className="font-bold">RIQS</div><div className="text-xs text-white/70">Membership Portal</div></div>
        </Link>
        <div>
          <h2 className="text-3xl font-bold">Welcome back.</h2>
          <p className="mt-3 max-w-md text-white/80">Sign in to manage your professional profile, certificate, payments and CPD records.</p>
        </div>
        <div className="text-xs text-white/60">© {new Date().getFullYear()} Rwanda Institute of Quantity Surveyors</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-zinc-150 dark:border-zinc-800 shadow-lg">
          <CardContent className="p-8">
            {!pending ? (
              <>
                <h1 className="text-2xl font-bold text-navy">Sign in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tip: use <strong>admin@</strong>, <strong>reviewer@</strong>, or <strong>mentor@</strong> in your email to test different roles.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="em">Email address</Label>
                    <Input id="em" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. name@example.com" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw">Password</Label>
                      <Link href="/login" className="text-xs text-navy hover:underline">Forgot password?</Link>
                    </div>
                    <Input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Enter your password" />
                  </div>
                  <Button type="submit" className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold">Continue</Button>
                </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  No account? <Link href="/register" className="font-semibold text-navy hover:underline">Register</Link>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-navy">Verify your email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 4-digit code sent to <strong>{pending.email}</strong>.
                </p>
                {devCode && (
                  <div className="mt-3 border border-gold/40 bg-gold/10 p-2 text-xs text-[#8a5c00]">
                    Demo code: <strong>{devCode}</strong>
                  </div>
                )}
                <div className="mt-6 flex justify-center">
                  <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={1} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={2} className="h-14 w-14 text-xl" />
                      <InputOTPSlot index={3} className="h-14 w-14 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={verify} className="mt-6 w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold">Verify & sign in</Button>
                <Button variant="ghost" onClick={cancelPending} className="mt-2 w-full">Use a different email</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
