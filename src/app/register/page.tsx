"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const { startSignup, verifyOtp, pending, cancelPending, resendOtp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", pw: "", pw2: "" });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    // Ensure draft state is cleared when visiting auth pages
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("riqs_app_draft") || k.startsWith("riqs_app_step") || k.startsWith("riqs_app_last_correction"))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {}

    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    const success = await resendOtp();
    if (success) {
      setResendTimer(60);
    }
  };

  const upd = (k: string, v: string) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.pw)
      return toast.error("Please complete all fields");

    // Check password rules
    const passedRules = [
      form.pw.length >= 8,
      /[A-Z]/.test(form.pw),
      /[a-z]/.test(form.pw),
      /[0-9]/.test(form.pw),
      /[^A-Za-z0-9]/.test(form.pw)
    ].filter(Boolean).length;

    if (passedRules < 5) {
      return toast.error("Please meet all password strength requirements");
    }

    if (form.pw !== form.pw2) return toast.error("Passwords do not match");
    
    setIsLoading(true);
    const success = await startSignup(form.name, form.email, form.pw);
    setIsLoading(false);
    
    if (success) {
      toast.success(`We sent a 6-digit code to ${form.email}`);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    
    setIsLoading(true);
    const success = await verifyOtp(otp);
    setIsLoading(false);
    
    if (!success) return;
    
    toast.success("Account created — start your application");
    router.push("/dashboard/application");
  };

  return (
    <div className="grid min-h-screen md:h-screen md:overflow-hidden md:grid-cols-2">
      <div className="flex items-center justify-center p-6 h-full overflow-y-auto py-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Card className="w-full max-w-md border-zinc-150 shadow-lg my-auto">
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
                      placeholder="As on national ID/Passport"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Password</Label>
                        <div className="relative">
                          <Input
                            type={showPw ? "text" : "password"}
                            value={form.pw}
                            onChange={(e) => upd("pw", e.target.value)}
                            placeholder="Create a password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            tabIndex={-1}
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label>Confirm</Label>
                        <div className="relative">
                          <Input
                            type={showPw2 ? "text" : "password"}
                            value={form.pw2}
                            onChange={(e) => upd("pw2", e.target.value)}
                            placeholder="Confirm password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw2(!showPw2)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            tabIndex={-1}
                          >
                            {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  
                  <div className="mt-2">
                    <PasswordStrength password={form.pw} confirmPassword={form.pw2} />
                  </div>

                  <div className="h-2" />
                  <Button
                    type="submit"
                    disabled={
                      isLoading ||
                      form.pw.length < 8 ||
                      !/[A-Z]/.test(form.pw) ||
                      !/[a-z]/.test(form.pw) ||
                      !/[0-9]/.test(form.pw) ||
                      !/[^A-Za-z0-9]/.test(form.pw) ||
                      form.pw !== form.pw2
                    }
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Sending verification..." : "Send verification code"}
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
                  Enter the 6-digit code we sent to{" "}
                  <strong>{pending.email}</strong>.
                </p>
                {/* Dev Code Hint Removed */}
                <div className="mt-6 flex justify-center">
                  <InputOTP 
                    autoFocus
                    maxLength={6} 
                    value={otp} 
                    onChange={setOtp}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                        verify();
                      }
                    }}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-12 w-10 sm:h-14 sm:w-14 text-lg sm:text-xl" />
                      <InputOTPSlot index={1} className="h-12 w-10 sm:h-14 sm:w-14 text-lg sm:text-xl" />
                      <InputOTPSlot index={2} className="h-12 w-10 sm:h-14 sm:w-14 text-lg sm:text-xl" />
                      <InputOTPSlot index={3} className="h-12 w-10 sm:h-14 sm:w-14 text-lg sm:text-xl" />
                      <InputOTPSlot index={4} className="h-12 w-10 sm:h-14 sm:w-14 text-lg sm:text-xl" />
                      <InputOTPSlot index={5} className="h-12 w-10 sm:h-14 sm:w-14 text-lg sm:text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  onClick={verify}
                  disabled={isLoading}
                  className="mt-6 w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold font-semibold"
                >
                  {isLoading ? "Verifying..." : "Verify & complete setup"}
                </Button>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </div>
                  <Button
                    variant="link"
                    onClick={handleResend}
                    disabled={resendTimer > 0}
                    className="h-auto p-0 text-navy font-semibold"
                  >
                    {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : "Resend Code"}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={cancelPending}
                  className="mt-4 w-full"
                >
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="hidden brand-gradient md:flex md:flex-col md:justify-between md:p-12 text-white">
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
