import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  role: "ADMIN" | "MEMBER";
  avatarColor?: string | null;
};

export interface UpdateProfilePayload {
  firstName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  avatarColor?: string;
}

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser: (payload: UpdateProfilePayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data);
        } catch {
          await logout();
        }
      }
      setLoading(false);
    };
    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync("token", res.data.access_token);
    await AsyncStorage.setItem("email", email);
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, firstName: string) => {
    const res = await api.post("/auth/register", { email, password, firstName });
    await SecureStore.setItemAsync("token", res.data.access_token);
    await AsyncStorage.setItem("email", email);
    setUser(res.data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await AsyncStorage.removeItem("email");
    setUser(null);
  };

  const updateUser = async (payload: UpdateProfilePayload) => {
    const res = await api.patch("/users/me", payload);
    setUser((prev) => (prev ? { ...prev, ...res.data } : prev));
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout, loading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
