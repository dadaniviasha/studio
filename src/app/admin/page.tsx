
"use client";

import { AppHeader } from '@/components/layout/AppHeader'; 
import { AppFooter } from '@/components/layout/AppFooter';
import { ResultController } from '@/components/admin/ResultController';
import { PendingWithdrawals } from '@/components/admin/PendingWithdrawals';
import { CurrentBetsOverview } from '@/components/admin/CurrentBetsOverview';
import type { GameResult } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ADMIN_RESULT_STORAGE_KEY = 'CROTOS_ADMIN_RESULT_OVERRIDE';

export default function AdminPage() {
  const { toast } = useToast();
  const { currentUser, loading: authLoading } = useAuth();
  
  const handleSetNextResult = (result: Partial<GameResult>) => {
    if (result.winningNumber === undefined || result.winningColor === undefined) {
      console.error("Admin attempted to set an incomplete result:", result);
      toast({
        title: "Error: Incomplete Result Data",
        description: "Both winning number and color must be specified.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const resultToStore = {
        winningNumber: result.winningNumber,
        winningColor: result.winningColor,
      };
      localStorage.setItem(ADMIN_RESULT_STORAGE_KEY, JSON.stringify(resultToStore));
      // Toast notification is now handled within the ResultController component itself.
    } catch (error) {
      console.error("Error saving admin result to localStorage:", error);
      toast({
        title: "Storage Error",
        description: "Could not save the admin-defined result.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
     return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-xl text-muted-foreground">Loading admin panel...</p>
        </main>
        <AppFooter />
      </div>
    );
  }

  // Use the new isAdmin flag from the AuthContext for secure, role-based access.
  if (!currentUser || !currentUser.isAdmin) { 
     return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
            <p className="text-lg text-muted-foreground mb-6">You do not have permission to view this page.</p>
            <Link href="/">
                <Button size="lg">Go to Homepage</Button>
            </Link>
        </main>
        <AppFooter />
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader /> 
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
            <ShieldCheck className="mx-auto h-16 w-16 text-primary mb-3" />
            <h1 className="text-4xl font-headline font-bold text-primary">Admin Control Panel</h1>
            <p className="text-lg text-muted-foreground mt-2">Oversee game operations and manage user requests.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          <ResultController onSetResult={handleSetNextResult} />
          <PendingWithdrawals />
        </div>
        
        <div className="mt-8">
            <CurrentBetsOverview />
        </div>

        <div className="mt-8 p-6 border rounded-lg bg-card/50 backdrop-blur-sm">
            <h2 className="text-2xl font-headline text-primary mb-4">More Admin Tools</h2>
            <p className="text-muted-foreground">Additional administrative features (e.g., user management, site statistics) would be available here.</p>
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
