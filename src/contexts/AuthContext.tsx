
"use client";

import type { User } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

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
    // Simulate loading user from localStorage on initial load
    setLoading(true);
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedPassword = localStorage.getItem('currentUserPassword'); // Highly insecure, for prototype only
      if (storedUser && storedPassword) {
        const parsedUser = JSON.parse(storedUser) as User;
        // In a real app, you'd verify a token here, not just load from localStorage
        setCurrentUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserPassword');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, passwordAttempt: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    const storedUser = localStorage.getItem('currentUser');
    const storedPassword = localStorage.getItem('currentUserPassword'); // Highly insecure

    if (storedUser && storedPassword) {
      const parsedUser = JSON.parse(storedUser) as User;
      if (parsedUser.email === email && storedPassword === passwordAttempt) {
        setCurrentUser(parsedUser);
        toast({ title: "Login Successful", description: `Welcome back, ${parsedUser.username}!` });
        router.push('/');
      } else {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      }
    } else {
      toast({ title: "Login Failed", description: "No user found. Please sign up.", variant: "destructive" });
    }
    setLoading(false);
  }, [toast, router]);

  const signup = useCallback(async (username: string, email: string, passwordRaw: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists (by email, for simulation)
    const existingUser = localStorage.getItem('currentUser');
    if (existingUser) {
        try {
            const parsedExistingUser = JSON.parse(existingUser) as User;
            if (parsedExistingUser.email === email) {
                toast({ title: "Signup Failed", description: "An account with this email already exists.", variant: "destructive" });
                setLoading(false);
                return;
            }
        } catch (e) {
            // If parsing fails, proceed to create new user (overwrite)
            console.warn("Error parsing existing user, proceeding with signup.");
        }
    }


    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      email,
      walletBalance: SIGNUP_BONUS, // Start with signup bonus
    };
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    localStorage.setItem('currentUserPassword', passwordRaw); // Highly insecure
    setCurrentUser(newUser);
    toast({ title: "Signup Successful", description: `Welcome, ${username}! You've received a ₹${SIGNUP_BONUS} bonus.` });
    router.push('/');
    setLoading(false);
  }, [toast, router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserPassword');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
    router.push('/login');
  }, [toast, router]);

  const updateBalance = useCallback((newBalance: number) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, walletBalance: newBalance };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
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
