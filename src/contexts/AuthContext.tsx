
"use client";

import type { User } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { auth, FBCONFIG_MISSING } from '@/lib/firebase/config';

const SIGNUP_BONUS = 50;

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, passwordAttempt: string) => Promise<void>;
  signup: (username: string, email: string, passwordRaw: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (FBCONFIG_MISSING) {
      toast({
        title: "Firebase Not Configured",
        description: "Please provide Firebase config in .env.local to enable authentication.",
        variant: "destructive",
        duration: 10000,
      });
      setLoading(false);
      return;
    }

    if (!auth) {
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in.
        // This is a good place to fetch more user data from Firestore if you have it.
        // For now, we'll use localStorage for the wallet balance as a bridge.
        const walletBalanceStr = localStorage.getItem(`wallet-${firebaseUser.uid}`);
        const walletBalance = walletBalanceStr ? parseFloat(walletBalanceStr) : SIGNUP_BONUS;

        const appUser: User = {
          id: firebaseUser.uid,
          username: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          walletBalance,
        };
        setCurrentUser(appUser);
      } else {
        // User is signed out.
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const login = useCallback(async (email: string, passwordAttempt: string) => {
    if (FBCONFIG_MISSING || !auth) return;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, passwordAttempt);
      toast({ title: "Login Successful", description: `Welcome back, ${userCredential.user.displayName || 'user'}!` });
      router.push('/');
    } catch (error: any) {
      console.error("Firebase login error:", error);
      toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const signup = useCallback(async (username: string, email: string, passwordRaw: string) => {
    if (FBCONFIG_MISSING || !auth) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, passwordRaw);
      // After creating the user, update their profile with the username
      await updateProfile(userCredential.user, { displayName: username });

      // Initialize wallet balance in localStorage (as a temporary measure)
      localStorage.setItem(`wallet-${userCredential.user.uid}`, SIGNUP_BONUS.toString());
      
      const appUser: User = {
        id: userCredential.user.uid,
        username: username,
        email: email,
        walletBalance: SIGNUP_BONUS,
      };
      setCurrentUser(appUser); // Manually set user for immediate UI update

      toast({ title: "Signup Successful", description: `Welcome, ${username}! You've received a ₹${SIGNUP_BONUS} bonus.` });
      router.push('/');
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? "An account with this email already exists." 
        : "Failed to sign up. Please try again.";
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const logout = useCallback(async () => {
    if (FBCONFIG_MISSING || !auth) return;
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      console.error("Firebase logout error:", error);
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  }, [toast, router]);

  const updateBalance = useCallback((newBalance: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, walletBalance: newBalance };
      setCurrentUser(updatedUser);
      // Persist the new balance in localStorage (temporary)
      localStorage.setItem(`wallet-${currentUser.id}`, newBalance.toString());
    }
  }, [currentUser]);


  return (
    <AuthContext.Provider value={{ currentUser, login, signup, logout, loading, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
