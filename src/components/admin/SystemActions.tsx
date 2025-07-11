"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const KEYS_TO_CLEAR = [
    'CROTOS_ADMIN_RESULT_OVERRIDE',
    'CROTOS_CURRENT_ROUND_ID',
    'CROTOS_ACTIVE_BETS',
    'CROTOS_CURRENT_ROUND',
    'CROTOS_ROUND_COUNTER',
    'CROTOS_WITHDRAWAL_REQUESTS',
    'CROTOS_DEPOSIT_REQUESTS'
];

export function SystemActions() {
    const { toast } = useToast();

    const handleReset = async () => {
        try {
            // Clear localStorage
            KEYS_TO_CLEAR.forEach(key => {
                localStorage.removeItem(key);
            });
            
            // Clear sessionStorage
            sessionStorage.clear();

            // Clear cache storage if available
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
            }
            
            toast({
                title: "System State Reset",
                description: "All application data in browser storage has been cleared. The page will now reload.",
            });

            // Delay reload slightly to allow toast to show
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("Failed to reset game state:", error);
            toast({
                title: "Reset Failed",
                description: "Could not clear all browser storage.",
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="shadow-xl bg-card/80 backdrop-blur-sm border-destructive/50">
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline text-destructive">
                    <AlertTriangle className="mr-2 h-6 w-6" /> System Actions
                </CardTitle>
                <CardDescription>
                    Perform high-impact system operations. Use with caution.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/10">
                    <div>
                        <h4 className="font-semibold">Reset All Browser Data</h4>
                        <p className="text-sm text-muted-foreground">
                            This clears all active bets, round history, and pending requests from browser storage (local, session, and cache). It simulates a full application restart.
                        </p>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Reset Now
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete all current round data, active bets, and pending requests stored in the browser's storage. It does not affect user data in the database.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                                Yes, reset everything
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
