
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/lib/mock-data';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, pass: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hangout_user');
    if (stored) {
        try {
            setUser(JSON.parse(stored));
        } catch (e) {
            console.error("Error parsing stored user from localStorage:", e);
            localStorage.removeItem('hangout_user');
        }
    }
    setIsLoading(false);
  }, []);

  const login = async (userId: string, pass: string) => {
    const found = mockUsers.find(u => u.id === userId);
    if (found) {
      setUser(found);
      localStorage.setItem('hangout_user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hangout_user');
  };

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
