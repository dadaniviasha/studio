
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
      await updateProfile(userCredential.user, { displayName: username });
      // Create user document in Firestore. The onAuthStateChanged listener will then pick it up.
      await createUserDocument(userCredential.user);

      toast({ title: "Signup Successful", description: `Welcome, ${username}!` });
      router.push('/');
    } catch (error: any)
     {
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

  const updateBalance = useCallback(async (newBalance: number) => {
    if (currentUser) {
      // Optimistic UI update for a responsive feel.
      // The user's balance will appear to change, but it won't be saved to the database from here.
      setCurrentUser(prevUser => prevUser ? { ...prevUser, walletBalance: newBalance } : null);

      // IMPORTANT: In a production app, the client should NEVER set its own balance.
      // Instead of calling updateUserBalanceInDb, you would call a secure Firebase Cloud Function
      // that validates the transaction (e.g., a bet or a win) and updates the balance on the server.
      // The direct database call from the client has been removed to enforce security.
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
