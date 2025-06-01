// AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@workspace/supabase-config/client';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  supabase: typeof supabase;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  supabase,
  sendVerificationEmail: async () => {},
});

const AUTH_TIMEOUT_MS = 15000; // 15 seconds for auth state to resolve

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth');

  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  const sendVerificationEmail = async () => {
    if (!supabase || !user?.email) return;
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      
      if (error) throw error;
      
      toast.success(t('verificationEmailSent'));
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error(t('verificationEmailFailed'));
    }
  };

  useEffect(() => {
    if (!supabase) {
      console.warn("Supabase is not initialized. Setting isLoading to false.");
      setIsLoading(false);
      return;
    }

    // Set a timeout for auth state resolution
    const authTimeout = setTimeout(() => {
      if (isLoading) { // Only if still loading
        console.warn(`Authentication state did not resolve within ${AUTH_TIMEOUT_MS / 1000} seconds. Forcing isLoading to false.`);
        setIsLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      clearTimeout(authTimeout);

      if (supabase) {
        supabase.auth.stopAutoRefresh();
      }

      // Check email verification
      if (session?.user && !session.user.email_confirmed_at) {
        // Exempt getting-started page from verification requirement
        const isGettingStartedPage = pathname?.includes('/getting-started');
        
        if (!isGettingStartedPage) {
          router.push('/getting-started');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      clearTimeout(authTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Check email verification
      if (session?.user && !session.user.email_confirmed_at) {
        // Exempt getting-started page from verification requirement
        const isGettingStartedPage = pathname?.includes('/getting-started');
        
        if (!isGettingStartedPage) {
          router.push('/getting-started');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimeout);
    };
  }, [router, pathname, isLoading, t]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, supabase, sendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);