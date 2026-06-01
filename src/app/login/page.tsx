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
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { startLogin, verifyOtp, pending, cancelPending, resendOtp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw) return toast.error("Enter your email and password");
    setIsLoading(true);
    const success = await startLogin(email, pw);
    setIsLoading(false);
    
    if (success === "requirePasswordChange") {
      toast.info("Please change your temporary password to continue.");
      router.push("/forgot-password?reason=first-login");
    } else if (success) {
      toast.success(`We sent a 6-digit code to ${email}`);
    }
  };

  const verify = async () => {
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    setIsLoading(true);
    const success = await verifyOtp(otp);
    setIsLoading(false);
    
    if (!success) return;
    
    toast.success("Welcome back");
    // Redirect based on role or simple default dashboard
    const authDataRaw = localStorage.getItem("riqs.auth");
    let storedRole = null;
    let storedIsTeacher = false;
    
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        storedRole = parsed.role;
        storedIsTeacher = parsed.isTeacher;
      } catch (e) {}
    }

    if (storedRole && ["Admin", "Reviewer", "Approver"].includes(storedRole)) {
      router.push("/admin");
    } else if (storedIsTeacher) {
      router.push("/teacher");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
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
          <h2 className="text-3xl font-bold">Welcome back.</h2>
          <p className="mt-3 max-w-md text-white/80">
            Sign in to manage your professional profile, certificate, payments
            and CPD records.
          </p>
        </div>
        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} Rwanda Institute of Quantity Surveyors
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-zinc-150 dark:border-zinc-800 shadow-lg">
          <CardContent className="p-8">
            {!pending ? (
              <>
                <h1 className="text-2xl font-bold text-navy">Sign in</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with your registered email and password.
                </p>
                <form onSubmit={submit} className="mt-6 space-y-4">
                  <div>
                    <Label htmlFor="em">Email address</Label>
                    <Input
                      id="em"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pw">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-navy hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="pw"
                        type={showPw ? "text" : "password"}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder="Enter your password"
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
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                  >
                    {isLoading ? "Signing in..." : "Continue"}
                  </Button>
                </form>
                <div className="mt-6 text-center text-sm text-muted-foreground">
                  No account?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-navy hover:underline"
                  >
                    Register
                  </Link>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <h1 className="text-2xl font-bold text-navy">
                  Verify your email
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 6-digit code sent to{" "}
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
                      className="mt-6 w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                    >
                      {isLoading ? "Verifying..." : "Verify"}
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
                  Use a different email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
