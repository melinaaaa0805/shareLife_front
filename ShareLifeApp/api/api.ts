import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "../services/storage";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl;
const api = axios.create({
  baseURL: API_URL, // change selon ton backend
});

// Ajouter le token à chaque requête
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log("JWT expiré ou invalide → déconnexion");

      // Option simple (au début)
      Alert.alert("Session expirée", "Veuillez vous reconnecter");
    }

    return Promise.reject(error);
  }
);
export default api;
