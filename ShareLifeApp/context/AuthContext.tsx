import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import api from "../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  id: string;
  email: string;
  firstName: string;
  role: "ADMIN" | "MEMBER";
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser: (updatedFields: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔁 Vérification au démarrage
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

  const register = async (
    email: string,
    password: string,
    firstName: string
  ) => {
    const res = await api.post("/auth/register", {
      email,
      password,
      firstName,
    });
    await SecureStore.setItemAsync("token", res.data.access_token);
    await AsyncStorage.setItem("email", email);
    setUser(res.data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    await AsyncStorage.removeItem("email");
    setUser(null);
  };
  const updateUser = async (updatedFields: Partial<User>) => {
    try {
      const currentUser = user; // user du context
      if (!currentUser) return;

      const updatedUser = { ...currentUser, ...updatedFields };
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));

      // Optionnel : appeler ton API pour mettre à jour côté backend
      // await api.put(`/users/${currentUser.id}`, updatedFields);
    } catch (err) {
      console.error("Erreur updateUser", err);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
