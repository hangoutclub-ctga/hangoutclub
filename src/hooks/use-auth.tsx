"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { toUser } from '@/lib/supabase/mappers';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, keepLoggedIn?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const keepLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('hangout_keep_logged_in') !== 'false' : true;
        const sessionActive = typeof window !== 'undefined' && sessionStorage.getItem('hangout_session_active') === 'true';

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          // If the user previously chose NOT to keep logged in, and this is a new browser session (sessionStorage cleared)
          if (!keepLoggedIn && !sessionActive) {
            await supabase.auth.signOut();
            if (isMounted) {
              setUser(null);
              setIsLoading(false);
            }
            return;
          }

          if (typeof window !== 'undefined') {
            sessionStorage.setItem('hangout_session_active', 'true');
          }

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && isMounted) {
            setUser(toUser(profile));
          }
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const keepLoggedIn = typeof window !== 'undefined' ? localStorage.getItem('hangout_keep_logged_in') !== 'false' : true;
        const sessionActive = typeof window !== 'undefined' && sessionStorage.getItem('hangout_session_active') === 'true';

        if (!keepLoggedIn && !sessionActive && event !== 'SIGNED_IN') {
          if (isMounted) setUser(null);
          if (isMounted) setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile && isMounted) {
          setUser(toUser(profile));
        }
      } else {
        if (isMounted) setUser(null);
      }
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string, keepLoggedIn: boolean = true): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        if (keepLoggedIn) {
          localStorage.setItem('hangout_keep_logged_in', 'true');
          localStorage.setItem('hangout_remembered_email', email.trim());
        } else {
          localStorage.setItem('hangout_keep_logged_in', 'false');
          localStorage.removeItem('hangout_remembered_email');
        }
        sessionStorage.setItem('hangout_session_active', 'true');
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });

      if (error) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('hangout_session_active');
        }
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setUser(toUser(profile));
        } else if (pErr) {
          console.warn("Could not fetch profile right after login:", pErr.message);
        }
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('hangout_session_active');
      }
      setIsLoading(false);
      return { success: false, error: err.message || 'Erro inesperado ao realizar login.' };
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('low_stock_alert_seen');
        sessionStorage.removeItem('hangout_session_active');
        localStorage.removeItem('hangout_keep_logged_in');
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setUser(null);
    }
  };

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUser(toUser(profile));
        }
      }
    } catch (err) {
      console.error("Error refreshing user:", err);
    }
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, hasPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
