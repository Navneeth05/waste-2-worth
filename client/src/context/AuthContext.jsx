import { createContext, useContext, useState, useCallback } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("pb_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (role, email, password) => {
    try {
      const response = await API.post("/auth/login", { role, email, password });
      const { user: loggedInUser, token } = response.data;
      
      setUser(loggedInUser);
      sessionStorage.setItem("pb_user", JSON.stringify(loggedInUser));
      sessionStorage.setItem("pb_token", token);
      
      return loggedInUser;
    } catch (error) {
      throw new Error(error.response?.data?.detail || error.response?.data?.error || "Login failed");
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem("pb_user", JSON.stringify(updatedUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem("pb_user");
    sessionStorage.removeItem("pb_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
