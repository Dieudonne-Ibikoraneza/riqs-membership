"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "member" | "reviewer" | "admin" | null;

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
  startLogin: (email: string, password: string) => string; // returns mock OTP for dev hint
  startSignup: (name: string, email: string, password: string) => string;
  verifyOtp: (code: string) => boolean;
  startForgotPassword: (email: string) => string;
  resetPassword: (password: string) => boolean;
  cancelPending: () => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);
const KEY = "riqs.auth";

function deriveRole(em: string): { role: Exclude<Role, null>; name: string; isMentor: boolean; isTeacher: boolean; isStudent: boolean } {
  const e = em.toLowerCase();
  if (e.includes("admin")) return { role: "admin", name: "System Administrator", isMentor: false, isTeacher: false, isStudent: false };
  if (e.includes("reviewer") || e.includes("approver"))
    return { role: "reviewer", name: "Eng. Reviewer", isMentor: false, isTeacher: false, isStudent: false };
  if (e.includes("teacher"))
    return { role: "member", name: "Prof. Teacher QS", isMentor: true, isTeacher: true, isStudent: false };
  if (e.includes("mentor"))
    return { role: "member", name: "QS. Mentor Pro", isMentor: true, isTeacher: false, isStudent: false };
  if (e.includes("student"))
    return { role: "member", name: "Student Member", isMentor: false, isTeacher: false, isStudent: true };
  return { role: "member", name: "Demo Member", isMentor: false, isTeacher: false, isStudent: false };
}

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

  const startLogin = (em: string, _pw: string) => {
    const d = deriveRole(em);
    setPending({ email: em, name: d.name, role: d.role, isMentor: d.isMentor, isTeacher: d.isTeacher, isStudent: d.isStudent, mode: "login" });
    return "123456"; // mock OTP
  };

  const startSignup = (nm: string, em: string, _pw: string) => {
    const d = deriveRole(em);
    setPending({ email: em, name: nm || d.name, role: d.role, isMentor: d.isMentor, isTeacher: d.isTeacher, isStudent: d.isStudent, mode: "signup" });
    return "123456";
  };

  const verifyOtp = (code: string) => {
    if (!pending) return false;
    
    if (pending.mode === "forgot_password") {
      if (code !== "123456") return false;
      return true; // Just verify, don't login yet
    }

    if (code !== "123456") return false;
    setRole(pending.role); setName(pending.name); setEmail(pending.email);
    setIsMentor(pending.isMentor); setIsTeacher(pending.isTeacher); setIsStudent(pending.isStudent);
    localStorage.setItem(KEY, JSON.stringify({
      role: pending.role, name: pending.name, email: pending.email,
      isMentor: pending.isMentor, isTeacher: pending.isTeacher, isStudent: pending.isStudent,
    }));
    setPending(null);
    return true;
  };

  const startForgotPassword = (em: string) => {
    const d = deriveRole(em);
    setPending({ email: em, name: d.name, role: d.role, isMentor: d.isMentor, isTeacher: d.isTeacher, isStudent: d.isStudent, mode: "forgot_password" });
    return "123456";
  };

  const resetPassword = (pw: string) => {
    if (!pending || pending.mode !== "forgot_password") return false;
    // Mock password reset successful
    setPending(null);
    return true;
  };

  const cancelPending = () => setPending(null);

  const logout = () => {
    setRole(null); setName(null); setEmail(null);
    setIsMentor(false); setIsTeacher(false); setIsStudent(false);
    localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider value={{
      role, name, email, isMentor, isTeacher, isStudent, pending,
      startLogin, startSignup, verifyOtp, startForgotPassword, resetPassword, cancelPending, logout
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
