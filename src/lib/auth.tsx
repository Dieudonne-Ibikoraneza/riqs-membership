"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  name: string | null;
  email: string | null;
  role: "member" | "admin" | null;
  logout: () => void;
  login: (email: string, role: "member" | "admin") => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // We initialize with mock details for easy workspace testing and preview
  const [name, setName] = useState<string | null>("Dieudonne Ibikoraneza");
  const [email, setEmail] = useState<string | null>("dieudonne@gmail.com");
  const [role, setRole] = useState<"member" | "admin" | null>("member");

  // Allow dynamic switching or loading from localStorage
  useEffect(() => {
    const savedRole = localStorage.getItem("riqs_role");
    if (savedRole === "admin" || savedRole === "member") {
      setRole(savedRole);
    }
  }, []);

  const login = (newEmail: string, newRole: "member" | "admin") => {
    setEmail(newEmail);
    setRole(newRole);
    setName(newRole === "admin" ? "Admin Registrar" : "Dieudonne Ibikoraneza");
    localStorage.setItem("riqs_role", newRole);
  };

  const logout = () => {
    setName(null);
    setEmail(null);
    setRole(null);
    localStorage.removeItem("riqs_role");
  };

  return (
    <AuthContext.Provider value={{ name, email, role, logout, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
