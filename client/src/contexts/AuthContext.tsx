import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/index.js';
import { ApiClient } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHR: boolean;
  isCandidate: boolean;
  login: (email: string, role?: Role) => Promise<User>;
  loginWithPassword: (identifier: string, password: string) => Promise<User>;
  registerCandidate: (data: {
    email: string;
    password: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<{ success: boolean; email: string; message: string; devCode?: string }>;
  verifyCode: (email: string, code: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const HR_ROLES: Role[] = [
  'SUPER_ADMIN',
  'HR_ADMIN',
  'HR_MANAGER',
  'OPERATIONAL_MANAGER',
  'RECRUITER',
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('smartrecruit_token'));
  const [isLoading, setIsLoading] = useState(true);

  const isHR = user ? HR_ROLES.includes(user.role) : false;
  const isCandidate = user ? user.role === 'CANDIDATE' : false;

  const refreshUser = async () => {
    try {
      if (token) {
        const res = await ApiClient.getMe();
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Session refresh error:', err);
      ApiClient.clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const loginWithPassword = async (identifier: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.login(identifier, password);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const registerCandidate = async (data: {
    email: string;
    password: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
  }) => {
    return await ApiClient.registerCandidate(data);
  };

  const verifyCode = async (email: string, code: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.verifyEmail(email, code);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, role?: Role): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await ApiClient.devLogin(email, role);
      setTokenState(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const logout = () => {
    ApiClient.clearToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isHR,
        isCandidate,
        login,
        loginWithPassword,
        registerCandidate,
        verifyCode,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
