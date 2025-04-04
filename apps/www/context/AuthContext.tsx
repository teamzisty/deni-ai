// AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@repo/firebase-config/client';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  auth: typeof auth;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true, auth });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, auth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);