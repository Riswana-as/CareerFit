import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("careerfit_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      if (token) {
        const res = await apiClient.getProfile();
        setUser({
          id: res.data.user.id,
          email: res.data.user.email,
          fullName: res.data.user.full_name,
          headline: res.data.user.headline,
          phone: res.data.user.phone,
          location: res.data.user.location,
          linkedinUrl: res.data.user.linkedin_url,
          githubUrl: res.data.user.github_url,
          defaultTemplate: res.data.user.default_template,
          scoringWeights: res.data.user.scoring_weights
        });
      }
    } catch {
      setUser(null);
      setToken(null);
      localStorage.removeItem("careerfit_token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, userData: any) => {
    localStorage.setItem("careerfit_token", newToken);
    setToken(newToken);
    setUser({
      id: userData.id,
      email: userData.email,
      fullName: userData.fullName || userData.full_name
    });
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem("careerfit_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
