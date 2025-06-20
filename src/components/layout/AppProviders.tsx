
"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

// This component can be used to wrap any client-side context providers
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
