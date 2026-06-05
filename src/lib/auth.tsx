"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authServices } from "@/services/auth.services";
import { toast } from "sonner";

export type Role = "Admin" | "Reviewer" | "Approver" | "Teacher" | "Mentor" | "Standard" | "Student" | null;

interface Pending {
  email: string;
  name: string | null;
  role: Exclude<Role, null>;
  isMentor: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  mode: "login" | "signup" | "forgot_password";
}

interface AuthState {
  role: Role;
  name: string | null;
  email: string | null;
  isMentor: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  pending: Pending | null;
  startLogin: (email: string, password: string) => Promise<boolean | "requirePasswordChange">;
  startSignup: (name: string, email: string, password: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  startForgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  resendOtp: () => Promise<boolean>;
  cancelPending: () => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);
const KEY = "riqs.auth";

const TOKEN_KEY = "riqs.auth.token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setRole(v.role); setName(v.name); setEmail(v.email);
        setIsMentor(!!v.isMentor); setIsTeacher(!!v.isTeacher); setIsStudent(!!v.isStudent);
      }
    } catch {}
  }, []);

  const clearAuth = () => {
    setRole(null); setName(null); setEmail(null);
    setIsMentor(false); setIsTeacher(false); setIsStudent(false);
    
    // Preserve UI theme preferences but wipe absolutely everything else (auth, tokens, drafts, etc.)
    const config = localStorage.getItem("riqs-config");
    // Remove all user-scoped draft keys (riqs_app_draft_<email>, riqs_app_step_<email>, etc.)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("riqs_app_draft") || k.startsWith("riqs_app_step") || k.startsWith("riqs_app_last_correction"))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    localStorage.clear();
    if (config) localStorage.setItem("riqs-config", config);
  };

  const startLogin = async (em: string, pw: string): Promise<boolean | "requirePasswordChange"> => {
    try {
      clearAuth();
      const res = await authServices.login({ email: em, password: pw });
      
      if (res.requirePasswordChange) {
        setPending({ email: em, name: "CHANGE", role: "Standard", isMentor: false, isTeacher: false, isStudent: false, mode: "forgot_password" });
        return "requirePasswordChange";
      }

      setPending({ email: em, name: null, role: "Standard", isMentor: false, isTeacher: false, isStudent: false, mode: "login" });
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Login failed");
      return false;
    }
  };

  const startSignup = async (nm: string, em: string, pw: string) => {
    try {
      clearAuth();
      await authServices.register({ fullName: nm, email: em, password: pw });
      setPending({ email: em, name: nm, role: "Standard", isMentor: false, isTeacher: false, isStudent: false, mode: "signup" });
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Registration failed");
      return false;
    }
  };

  const verifyOtp = async (code: string) => {
    if (!pending) return false;
    
    if (pending.mode === "forgot_password") {
      // Just temporarily store the OTP for the reset step later
      setPending({ ...pending, name: code }); // hijacking name to store the otp code for the next step
      return true;
    }

    try {
      const res = await authServices.verifyOtp({ email: pending.email, otp: code });
      
      const member = res.member;
      const tkn = res.token;
      
      if (tkn) localStorage.setItem(TOKEN_KEY, tkn);
      
      setRole(member.systemRole);
      setName(member.fullName);
      setEmail(member.email);
      
      // Determine capabilities from systemRole and membershipClass
      const isMentor = member.systemRole === "Mentor" || 
        member.membershipClass?.includes("Technologist") || 
        member.membershipClass?.includes("Professional") || 
        member.membershipClass?.includes("PQS");
      const isTeacher = member.systemRole === "Teacher";
      const isStudent = member.membershipClass === "Student" || member.systemRole === "Student";
      
      setIsMentor(isMentor);
      setIsTeacher(isTeacher);
      setIsStudent(isStudent);

      localStorage.setItem(KEY, JSON.stringify({
        role: member.systemRole, name: member.fullName, email: member.email,
        isMentor, isTeacher, isStudent,
      }));
      setPending(null);
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Invalid OTP");
      return false;
    }
  };

  const startForgotPassword = async (em: string) => {
    try {
      await authServices.forgotPassword({ email: em });
      setPending({ email: em, name: null, role: "Standard", isMentor: false, isTeacher: false, isStudent: false, mode: "forgot_password" });
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to process request");
      return false;
    }
  };

  const resetPassword = async (pw: string) => {
    if (!pending || pending.mode !== "forgot_password") return false;
    try {
      await authServices.resetPassword({ email: pending.email, otp: pending.name, newPassword: pw });
      setPending(null);
      toast.success("Password has been successfully reset. You can now log in.");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to reset password");
      return false;
    }
  };

  const resendOtp = async () => {
    if (!pending) return false;
    try {
      const type = pending.mode === "forgot_password" ? "reset" : "verification";
      await authServices.resendOtp({ email: pending.email, type });
      toast.success("A new OTP has been sent to your email.");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend OTP");
      return false;
    }
  };

  const cancelPending = () => setPending(null);
  
  const logout = () => {
    clearAuth();
  };

  return (
    <Ctx.Provider value={{
      role, name, email, isMentor, isTeacher, isStudent, pending,
      startLogin, startSignup, verifyOtp, startForgotPassword, resetPassword, resendOtp, cancelPending, logout
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
