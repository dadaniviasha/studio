"use client";

import React from 'react';

// This component can be used to wrap any client-side context providers
// For now, it's a simple pass-through, but can be extended for Jotai, React Query, etc.
export function AppProviders({ children }: { children: React.ReactNode }) {
  // useEffect(() => {
  //   // Example: Set theme, useful if not using next-themes
  //   // document.documentElement.classList.add('dark');
  // }, []);

  return <>{children}</>;
}
