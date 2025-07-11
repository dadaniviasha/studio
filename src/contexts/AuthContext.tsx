
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
import { auth, db, FBCONFIG_MISSING } from '@/lib/firebase/config';
import { createUserDocument, getUserDocument, updateUserBalanceInDb, ADMIN_EMAIL } from '@/lib/firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';


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

    if (!auth || !db) {
        toast({
            title: "Firebase Initialization Failed",
            description: "The Firebase configuration seems present but is invalid. Please check the values in your .env.local file and restart the server.",
            variant: "destructive",
            duration: 10000,
        });
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // This logic is now simplified. It only READS the document.
          // The responsibility for CREATING the document is solely within the signup function.
          // This prevents a race condition where the listener fires before the signup's
          // database write is complete, which was causing duplicate documents and bonuses.
          const appUserDoc = await getUserDocument(firebaseUser.uid);

          if (appUserDoc) {
            console.log("AuthContext: User state updated.", { email: appUserDoc.email, isAdmin: appUserDoc.isAdmin });
            setCurrentUser(appUserDoc);
          } else {
             // If the user is authenticated with Firebase but has no document,
             // it's an inconsistent state. Treat them as logged out.
             console.warn(`Authenticated user ${firebaseUser.uid} has no Firestore document.`);
             setCurrentUser(null);
          }
        } catch (error: any) {
            console.error("Firestore error during auth state change:", error);
            if (error.code === 'unavailable') {
                 toast({
                    title: "Connection Error",
                    description: "Cannot connect to the database. Please check your internet connection and ensure your Firebase project details (especially Project ID) are correct in .env.local.",
                    variant: "destructive",
                    duration: 10000,
                });
            } else {
                toast({ title: "Database Error", description: "An error occurred while fetching your data.", variant: "destructive" });
            }
            setCurrentUser(null);
        }
      } else {
        console.log("AuthContext: No user is signed in.");
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
      toast({ title: "Login Successful", description: `Welcome back!` });
      const userDoc = await getUserDocument(userCredential.user.uid);
      const isAdmin = !!userDoc?.isAdmin;
      router.push(isAdmin ? '/admin' : '/');

    } catch (error: any) {
      console.error("Firebase login error:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = "Invalid email or password.";
      } else if (error.code === 'auth/api-key-not-valid') {
        description = "The Firebase API key is invalid. Please check your .env.local file and restart the application.";
      } else if (error.code === 'auth/network-request-failed') {
        description = "Cannot connect to Firebase. Please check your internet connection.";
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
      
      // This function creates the document with the bonus.
      await createUserDocument(userCredential.user, username);
      
      // Immediately fetch the newly created document to update the app's state.
      // This makes the process robust and avoids race conditions with onAuthStateChanged.
      const newUserDoc = await getUserDocument(userCredential.user.uid);
      if (newUserDoc) {
        setCurrentUser(newUserDoc);
      }

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
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Cannot connect to Firebase. Please check your internet connection.";
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
      await updateUserBalanceInDb(currentUser.id, newBalance);
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
