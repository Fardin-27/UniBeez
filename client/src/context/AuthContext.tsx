import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "../types";

const localHostnames = new Set(["localhost", "127.0.0.1", "::1"]);
const API_URL = import.meta.env.DEV || localHostnames.has(window.location.hostname)
  ? "http://localhost:3000"
  : import.meta.env.VITE_API_URL;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  API_URL: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("unisphere_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem("unisphere_user", JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem("unisphere_user");
      }
    } catch {
      setUser(null);
      localStorage.removeItem("unisphere_user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setUser(data.user);
    localStorage.setItem("unisphere_user", JSON.stringify(data.user));
  };

  const register = async (formData: Record<string, string>) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    setUser(data.user);
    localStorage.setItem("unisphere_user", JSON.stringify(data.user));
  };

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    localStorage.removeItem("unisphere_user");
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("unisphere_user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, API_URL }}>
      {children}
    </AuthContext.Provider>
  );
};
