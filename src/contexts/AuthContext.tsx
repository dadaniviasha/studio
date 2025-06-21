
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
        setLoading(false);
        return;
    }
    
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          let appUserDoc = await getUserDocument(firebaseUser.uid);
          
          if (!appUserDoc) {
            // If user doc doesn't exist, create it. This will set the isAdmin flag correctly.
            await createUserDocument(firebaseUser); 
            appUserDoc = await getUserDocument(firebaseUser.uid);
          } else {
            const userRef = doc(db, 'users', firebaseUser.uid);
            // Self-healing logic: ensure isAdmin flag is always correct based on email.
            // Case 1: User IS the admin, but flag is false. Set it to true.
            if (firebaseUser.email === ADMIN_EMAIL && !appUserDoc.isAdmin) {
                console.log(`Correcting admin status for ${firebaseUser.email} (granting).`);
                await updateDoc(userRef, { isAdmin: true });
                appUserDoc.isAdmin = true; // Update local copy
            } 
            // Case 2: User is NOT the admin, but flag is true. Set it to false.
            else if (firebaseUser.email !== ADMIN_EMAIL && appUserDoc.isAdmin) {
                console.log(`Correcting admin status for ${firebaseUser.email} (revoking).`);
                await updateDoc(userRef, { isAdmin: false });
                appUserDoc.isAdmin = false; // Update local copy
            }
          }

          if (appUserDoc) {
            console.log("AuthContext: User state updated.", { email: appUserDoc.email, isAdmin: appUserDoc.isAdmin });
            setCurrentUser(appUserDoc);
          } else {
             setCurrentUser(null);
             toast({ title: "Login Error", description: "Could not retrieve your user data after creation. Please try again.", variant: "destructive" });
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
      // The onAuthStateChanged listener will handle fetching the user doc and redirecting.
      // We can add a simple toast here.
      toast({ title: "Login Successful", description: `Welcome back!` });
       // The redirect logic is now implicitly handled by the onAuthStateChanged listener setting the user state,
       // causing a re-render that can then redirect based on role. We can add a direct redirect for faster UX.
      const userDoc = await getUserDocument(userCredential.user.uid);
      const isAdmin = userDoc?.isAdmin || (userCredential.user.email === ADMIN_EMAIL); 
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
      // This function now correctly sets the `isAdmin` flag upon creation.
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
      // WARNING: This is a client-side update and is insecure for a real-money application.
      // In a production environment, this logic MUST be moved to a secure backend,
      // like a Firebase Cloud Function, to prevent users from modifying their own balance.
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
