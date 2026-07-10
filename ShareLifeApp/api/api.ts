import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";

type LogoutHandler = () => void;
let logoutHandler: LogoutHandler | null = null;

export function setLogoutHandler(fn: LogoutHandler) {
  logoutHandler = fn;
}

const api = axios.create({
  baseURL: "https://api.sharelifeapp.com",
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (logoutHandler) logoutHandler();
      Alert.alert("Session expirée", "Veuillez vous reconnecter");
    }

    return Promise.reject(error);
  }
);
export default api;
