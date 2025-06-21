
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
import { createUserDocument, getUserDocument, updateUserBalanceInDb } from '@/lib/firebase/firestore';

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
        description: "Your Firebase keys are missing. If you've just added them, please restart the development server.",
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, fetch their document from Firestore.
        let appUserDoc = await getUserDocument(firebaseUser.uid);
        
        // This is a fallback for robustness: if a user exists in Auth but not Firestore, create their doc.
        if (!appUserDoc) {
          // This call is now more robust and prevents race conditions.
          await createUserDocument(firebaseUser); 
          appUserDoc = await getUserDocument(firebaseUser.uid);
        }

        if (appUserDoc) {
          setCurrentUser(appUserDoc);
        } else {
           setCurrentUser(null);
           toast({ title: "Login Error", description: "Could not retrieve your user data. Please try again.", variant: "destructive" });
        }
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
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "Invalid email or password.";
      } else if (error.code === 'auth/api-key-not-valid') {
        description = "The Firebase API key is invalid. Please check your .env.local file and restart the application.";
      }
      toast({ title: "Login Failed", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  const signup = useCallback(async (username: string, email: string, passwordRaw: string) => {
    if (FBCONFIG_MISSING || !auth) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, passwordRaw);
      await updateProfile(userCredential.user, { displayName: username });
      // Create user document in Firestore, passing the explicit username.
      await createUserDocument(userCredential.user, username);

      toast({ title: "Signup Successful", description: `Welcome, ${username}!` });
      router.push('/');
    } catch (error: any) {
      console.error("Firebase signup error:", error);
      let errorMessage = "Failed to sign up. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "The email address is not valid.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "The password is too weak. It must be at least 6 characters long.";
      } else if (error.code === 'auth/api-key-not-valid') {
        errorMessage = "The Firebase API key is invalid. Please check your .env.local file and restart the application.";
      }
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

  const updateBalance = useCallback(async (newBalance: number) => {
    if (currentUser) {
      setCurrentUser(prevUser => prevUser ? { ...prevUser, walletBalance: newBalance } : null);
      console.log("Client-side balance updated for UI. A secure backend function would be needed to persist this change.");
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
