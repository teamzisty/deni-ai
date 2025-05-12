// AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@workspace/firebase-config/client';
import { User, sendEmailVerification } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  auth: typeof auth;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  auth,
  sendVerificationEmail: async () => {},
});

const AUTH_TIMEOUT_MS = 15000; // 15 seconds for auth state to resolve

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('auth');

  const sendVerificationEmail = async () => {
    if (!auth || !auth.currentUser) return;
    
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success(t('verificationEmailSent'));
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error(t('verificationEmailFailed'));
    }
  };

  useEffect(() => {
    if (!auth) {
      console.warn("Firebase auth is not initialized. Setting isLoading to false.");
      setIsLoading(false);
      return;
    }

    // Set a timeout for auth state resolution
    const authTimeout = setTimeout(() => {
      if (isLoading) { // Only if still loading
        console.warn(`Authentication state did not resolve within ${AUTH_TIMEOUT_MS / 1000} seconds. Forcing isLoading to false.`);
        setIsLoading(false);
        // Potentially set user to null or handle as an error state if needed
        // setUser(null); 
      }
    }, AUTH_TIMEOUT_MS);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      clearTimeout(authTimeout); // Clear the timeout as auth state has resolved
      setUser(user);
      setIsLoading(false);

      // Check email verification
      if (user && !user.emailVerified) {
        // Exempt getting-started page from verification requirement
        const isGettingStartedPage = pathname?.includes('/getting-started');
        
        if (!isGettingStartedPage) {
          router.push('/getting-started');
        }
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  return (
    <AuthContext.Provider value={{ user, isLoading, auth, sendVerificationEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);