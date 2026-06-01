"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
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

function ForgotPasswordContent() {
  const { startForgotPassword, verifyOtp, resetPassword, cancelPending, resendOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFirstLogin = searchParams.get("reason") === "first-login";
  
  const [step, setStep] = useState<"email" | "otp" | "reset">(isFirstLogin ? "reset" : "email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email address");
    
    setIsLoading(true);
    const success = await startForgotPassword(email);
    setIsLoading(false);
    
    if (success) {
      toast.success(`We sent a 6-digit code to ${email}`);
      setStep("otp");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    
    setIsLoading(true);
    const success = await verifyOtp(otp);
    setIsLoading(false);
    
    if (!success) return;
    
    toast.success("Code verified");
    setStep("reset");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if the 5 password rules pass (basic check since component does visual)
    const passedRules = [
      newPassword.length >= 8,
      /[A-Z]/.test(newPassword),
      /[a-z]/.test(newPassword),
      /[0-9]/.test(newPassword),
      /[^A-Za-z0-9]/.test(newPassword)
    ].filter(Boolean).length;

    if (passedRules < 5) {
      return toast.error("Please meet all password strength requirements");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setIsLoading(true);
    const success = await resetPassword(newPassword);
    setIsLoading(false);
    
    if (success) {
      router.push("/login");
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand Side */}
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
          <h2 className="text-3xl font-bold">Secure Account Recovery</h2>
          <p className="mt-3 max-w-md text-white/80">
            Reset your password securely to regain access to your professional RIQS profile.
          </p>
        </div>
        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} Rwanda Institute of Quantity Surveyors
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-zinc-150 dark:border-zinc-800 shadow-lg">
          <CardContent className="p-8">
            
            {/* STEP 1: EMAIL */}
            {step === "email" && (
              <>
                <h1 className="text-2xl font-bold text-navy">Forgot Password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your email address and we'll send you a 6-digit verification code.
                </p>
                <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. member@riqs.rw"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                  >
                    {isLoading ? "Sending code..." : "Send Verification Code"}
                  </Button>
                  <div className="text-center text-sm">
                    Remember your password?{" "}
                    <Link href="/login" className="text-navy hover:underline">
                      Sign in
                    </Link>
                  </div>
                </form>
              </>
            )}

            {/* STEP 2: OTP */}
            {step === "otp" && (
              <>
                <h1 className="text-2xl font-bold text-navy">Verify Email</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  We've sent a 6-digit code to <strong>{email}</strong>.
                </p>
                {/* Dev Code Hint Removed */}
                <form onSubmit={handleVerifyOtp} className="mt-6 space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      autoFocus
                      maxLength={6}
                      value={otp}
                      onChange={(val) => setOtp(val)}
                      className="gap-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                          handleVerifyOtp({ preventDefault: () => {} } as React.FormEvent);
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
                  <div className="space-y-2">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                    >
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        Didn't receive the code?
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResend}
                        disabled={resendTimer > 0}
                        className="h-auto p-0 text-navy font-semibold"
                      >
                        {resendTimer > 0 ? `Resend Code (${resendTimer}s)` : "Resend Code"}
                      </Button>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full mt-4"
                      onClick={() => {
                        cancelPending();
                        setStep("email");
                        setOtp("");
                      }}
                    >
                      Cancel & Go Back
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === "reset" && (
              <>
                <h1 className="text-2xl font-bold text-navy">
                  {isFirstLogin ? "Change Default Password" : "Create New Password"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isFirstLogin 
                    ? "Please change your temporary password to a secure one before proceeding." 
                    : "Please secure your account with a strong password."}
                </p>
                <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPw ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="e.g. SecretPass123!"
                        className="pr-10"
                        required
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPw2 ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="pr-10"
                        required
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

                  <PasswordStrength 
                    password={newPassword} 
                    confirmPassword={confirmPassword} 
                  />

                  <div className="h-4" />
                  <Button 
                    type="submit" 
                    disabled={
                      isLoading ||
                      newPassword.length < 8 ||
                      !/[A-Z]/.test(newPassword) ||
                      !/[a-z]/.test(newPassword) ||
                      !/[0-9]/.test(newPassword) ||
                      !/[^A-Za-z0-9]/.test(newPassword) ||
                      newPassword !== confirmPassword
                    }
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent"></div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
