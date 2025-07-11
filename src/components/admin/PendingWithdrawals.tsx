"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ListChecks } from 'lucide-react';
import type { WithdrawalRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { processWithdrawalAction } from '@/server/actions';

const WITHDRAWAL_REQUESTS_STORAGE_KEY = 'CROTOS_WITHDRAWAL_REQUESTS';

export function PendingWithdrawals() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    const updateStateFromStorage = () => {
      try {
        const storedRequests = localStorage.getItem(WITHDRAWAL_REQUESTS_STORAGE_KEY);
        setRequests(storedRequests ? JSON.parse(storedRequests) : []);
      } catch (error) {
        console.error("Error reading withdrawal requests from localStorage:", error);
        setRequests([]);
      }
    };

    updateStateFromStorage();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === WITHDRAWAL_REQUESTS_STORAGE_KEY) {
        updateStateFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleProcessRequest = async (request: WithdrawalRequest, newStatus: 'approved' | 'rejected') => {
    if (newStatus === 'approved') {
      if (!currentUser) {
        toast({ title: "Authentication Error", description: "Cannot verify your admin identity. Please log in again.", variant: "destructive" });
        return;
      }

      // Call the server action to check permissions and update the balance in the database.
      const result = await processWithdrawalAction({
        adminId: currentUser.id,
        userId: request.userId,
        amount: request.amount,
        requestId: request.id
      });

      if (!result.success) {
        toast({ title: "Approval Failed", description: result.message, variant: "destructive" });
        return; // Stop if the balance update failed.
      }
      
      toast({ title: "Withdrawal Approved", description: result.message });
    } else { // 'rejected'
      toast({ title: "Request Rejected", description: `Withdrawal for ${request.username} has been rejected.` });
    }
    
    // This part runs for both 'rejected' and successfully 'approved' requests.
    // It updates the request's status in local storage.
    const updatedRequests = requests.map(req =>
      req.id === request.id ? { ...req, status: newStatus, processedAt: Date.now() } : req
    );
    
    try {
        localStorage.setItem(WITHDRAWAL_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
        setRequests(updatedRequests);
    } catch (error) {
        console.error("Failed to update withdrawal requests in localStorage:", error);
        toast({ title: "Storage Update Failed", description: "DB was updated, but could not update the request status locally.", variant: "destructive" });
    }
  };
  
  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');


  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <ListChecks className="mr-2 h-6 w-6" /> Withdrawal Requests
        </CardTitle>
        <CardDescription>Manage user withdrawal requests.</CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2 text-foreground/80">Pending Approval ({pending.length})</h3>
        {pending.length > 0 ? (
          <ScrollArea className="h-[300px] w-full border rounded-md mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User & UPI</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.username}</div>
                      <div className="text-xs text-muted-foreground">{req.email}</div>
                      <div className="text-xs font-mono text-primary">{req.upiId}</div>
                    </TableCell>
                    <TableCell>₹{req.amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(req.requestedAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" className="text-green-500 hover:bg-green-500/10" onClick={() => handleProcessRequest(req, 'approved')}>
                        <CheckCircle className="mr-1 h-4 w-4" /> Approve
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-500/10" onClick={() => handleProcessRequest(req, 'rejected')}>
                        <XCircle className="mr-1 h-4 w-4" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No pending withdrawal requests.</p>
        )}
        
        <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground/80">Processed Requests ({processed.length})</h3>
         {processed.length > 0 ? (
          <ScrollArea className="h-[200px] w-full border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User & UPI</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.username}</div>
                      <div className="text-xs font-mono text-primary">{req.upiId}</div>
                    </TableCell>
                    <TableCell>₹{req.amount.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} 
                               className={req.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}>
                            {req.status}
                        </Badge>
                    </TableCell>
                    <TableCell>{req.processedAt ? new Date(req.processedAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No processed withdrawal requests yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
