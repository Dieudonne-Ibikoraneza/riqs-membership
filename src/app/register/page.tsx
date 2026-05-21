"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function Register() {
  const { startSignup, verifyOtp, pending, cancelPending } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", pw: "", pw2: "" });
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const upd = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.pw)
      return toast.error("Please complete all fields");
    if (form.pw !== form.pw2) return toast.error("Passwords do not match");
    const code = startSignup(form.name, form.email, form.pw);
    setDevCode(code);
    toast.success(`We sent a 4-digit code to ${form.email}`);
  };

  const verify = () => {
    if (otp.length !== 4) return toast.error("Enter the 4-digit code");
    if (!verifyOtp(otp)) return toast.error("Invalid code — try 1234");
    toast.success("Account created — start your application");
    router.push("/dashboard/application");
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex items-center justify-center p-6 order-2 md:order-1">
        <Card className="w-full max-w-md border-zinc-150 shadow-lg">
          <CardContent className="p-8">
            {!pending ? (
              <>
                <h1 className="text-2xl font-bold text-navy">Create account</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  After verifying your email you&apos;ll start your membership
                  application.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label>Full name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => upd("name", e.target.value)}
                      placeholder="As on national ID"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => upd("email", e.target.value)}
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={form.pw}
                        onChange={(e) => upd("pw", e.target.value)}
                        placeholder="Create a password"
                      />
                    </div>
                    <div>
                      <Label>Confirm</Label>
                      <Input
                        type="password"
                        value={form.pw2}
                        onChange={(e) => upd("pw2", e.target.value)}
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold font-semibold"
                  >
                    Send verification code
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-navy hover:underline"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-navy">
                  Verify your email
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 4-digit code we sent to{" "}
                  <strong>{pending.email}</strong>.
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
                <Button
                  onClick={verify}
                  className="mt-6 w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold font-semibold"
                >
                  Verify & create account
                </Button>
                <Button
                  variant="ghost"
                  onClick={cancelPending}
                  className="mt-2 w-full"
                >
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="hidden brand-gradient md:flex md:flex-col md:justify-between md:p-12 text-white order-1 md:order-2">
        <Link href="/" className="flex flex-col items-start gap-4">
          <div className="flex h-30 w-full items-center justify-center">
            <img
              src="/riqs-logo.png"
              alt="RIQS"
              className="h-full items-end object-contain"
            />
          </div>
        </Link>
        <div>
          <h2 className="text-3xl font-bold">
            Join Rwanda&apos;s QS register.
          </h2>
          <ul className="mt-4 space-y-2 text-white/80 text-sm">
            <li>• Recognized professional credentials</li>
            <li>• Digitally verifiable membership certificate</li>
            <li>• Access to CPD, mentorship and tenders</li>
          </ul>
        </div>
        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} RIQS
        </div>
      </div>
    </div>
  );
}
