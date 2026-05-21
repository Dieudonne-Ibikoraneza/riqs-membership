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
import { PasswordStrength } from "@/components/ui/PasswordStrength";

export default function ForgotPassword() {
  const { startForgotPassword, verifyOtp, resetPassword, cancelPending } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email address");
    
    // Call our mocked context function
    startForgotPassword(email);
    toast.success(`We sent a 6-digit code to ${email}`);
    setStep("otp");
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Enter the 6-digit code");
    
    // Using mock 123456
    if (!verifyOtp(otp)) return toast.error("Invalid code — try 123456");
    
    toast.success("Code verified");
    setStep("reset");
  };

  const handleResetPassword = (e: React.FormEvent) => {
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

    // Call mocked context function
    const success = resetPassword(newPassword);
    if (!success) return toast.error("An error occurred during reset.");

    toast.success("Password reset successfully! Please sign in.");
    router.push("/login");
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
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                  >
                    Send Verification Code
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
                <div className="mt-3 border border-gold/40 bg-gold/10 p-2 text-xs text-[#8a5c00]">
                  Demo code: <strong>123456</strong>
                </div>
                <form onSubmit={handleVerifyOtp} className="mt-6 space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(val) => setOtp(val)}
                      className="gap-2"
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
                      className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                    >
                      Verify Code
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
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
                <h1 className="text-2xl font-bold text-navy">Create New Password</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Please secure your account with a strong password.
                </p>
                <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="e.g. SecretPass123!"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>

                  <PasswordStrength 
                    password={newPassword} 
                    confirmPassword={confirmPassword} 
                  />

                  <div className="h-4" />
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gold text-[#1a1a1a] hover:bg-gold/90 shadow-gold text-base font-semibold"
                  >
                    Reset Password
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
