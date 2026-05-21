"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "member" | "reviewer" | "admin" | null;

interface Pending {
  email: string;
  name: string | null;
  role: Exclude<Role, null>;
  isMentor: boolean;
  mode: "login" | "signup";
}

interface AuthState {
  role: Role;
  name: string | null;
  email: string | null;
  isMentor: boolean;
  pending: Pending | null;
  startLogin: (email: string, password: string) => string; // returns mock OTP for dev hint
  startSignup: (name: string, email: string, password: string) => string;
  verifyOtp: (code: string) => boolean;
  cancelPending: () => void;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);
const KEY = "riqs.auth";

function deriveRole(em: string): { role: Exclude<Role, null>; name: string; isMentor: boolean } {
  const e = em.toLowerCase();
  if (e.includes("admin")) return { role: "admin", name: "System Administrator", isMentor: false };
  if (e.includes("reviewer") || e.includes("approver"))
    return { role: "reviewer", name: "Eng. Reviewer", isMentor: false };
  if (e.includes("mentor"))
    return { role: "member", name: "QS. Mentor Pro", isMentor: true };
  return { role: "member", name: "Demo Member", isMentor: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isMentor, setIsMentor] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        setRole(v.role); setName(v.name); setEmail(v.email); setIsMentor(!!v.isMentor);
      }
    } catch {}
  }, []);

  const startLogin = (em: string, _pw: string) => {
    const d = deriveRole(em);
    setPending({ email: em, name: d.name, role: d.role, isMentor: d.isMentor, mode: "login" });
    return "1234"; // mock OTP
  };

  const startSignup = (nm: string, em: string, _pw: string) => {
    const d = deriveRole(em);
    setPending({ email: em, name: nm || d.name, role: d.role, isMentor: d.isMentor, mode: "signup" });
    return "1234";
  };

  const verifyOtp = (code: string) => {
    if (!pending) return false;
    if (code !== "1234") return false;
    setRole(pending.role); setName(pending.name); setEmail(pending.email); setIsMentor(pending.isMentor);
    localStorage.setItem(KEY, JSON.stringify({
      role: pending.role, name: pending.name, email: pending.email, isMentor: pending.isMentor,
    }));
    setPending(null);
    return true;
  };

  const cancelPending = () => setPending(null);

  const logout = () => {
    setRole(null); setName(null); setEmail(null); setIsMentor(false);
    localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider value={{ role, name, email, isMentor, pending, startLogin, startSignup, verifyOtp, cancelPending, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
}
