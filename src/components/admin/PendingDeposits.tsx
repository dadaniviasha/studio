"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Download, Eye } from 'lucide-react';
import type { DepositRequest } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { approveDepositAction } from '@/server/actions';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const DEPOSIT_REQUESTS_STORAGE_KEY = 'CROTOS_DEPOSIT_REQUESTS';

export function PendingDeposits() {
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentUser } = useAuth(); // Get current user from AuthContext

  useEffect(() => {
    const updateStateFromStorage = () => {
      try {
        const storedRequests = localStorage.getItem(DEPOSIT_REQUESTS_STORAGE_KEY);
        setRequests(storedRequests ? JSON.parse(storedRequests) : []);
      } catch (error) {
        console.error("Error reading deposit requests from localStorage:", error);
        setRequests([]);
      }
    };

    updateStateFromStorage();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === DEPOSIT_REQUESTS_STORAGE_KEY) {
        updateStateFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleProcessRequest = async (request: DepositRequest, newStatus: 'approved' | 'rejected') => {
    
    if (newStatus === 'approved') {
      if (!currentUser) { // Add a check for the admin user
        toast({
          title: "Authentication Error",
          description: "Cannot verify your admin identity. Please refresh and log in again.",
          variant: "destructive",
        });
        return;
      }
      
      const result = await approveDepositAction(currentUser.id, request.userId, request.amount);
      
      if (!result.success) {
        toast({ title: "Approval Failed", description: result.message, variant: "destructive" });
        return;
      }
      
      const updatedRequests = requests.map(req =>
        req.id === request.id 
        ? { ...req, status: newStatus, processedAt: Date.now(), screenshotDataUrl: '' } 
        : req
      );

      try {
        localStorage.setItem(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
        setRequests(updatedRequests);
        toast({
            title: `Request Approved & Balance Updated!`,
            description: result.message,
        });
      } catch (error) {
         console.error("Failed to update deposit requests in localStorage:", error);
         toast({ title: "Storage Update Failed", description: "DB was updated, but couldn't clear screenshot from local storage. It may be full.", variant: "destructive" });
      }

    } else { 
      const updatedRequests = requests.map(req =>
        req.id === request.id 
        ? { ...req, status: newStatus, processedAt: Date.now(), screenshotDataUrl: '' } 
        : req
      );
      
      try {
          localStorage.setItem(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
          setRequests(updatedRequests);
          toast({ title: `Request Rejected`, description: `Deposit request for ${request.username} has been rejected.` });
      } catch (error) {
          console.error("Failed to update deposit requests in localStorage:", error);
          toast({ title: "Update Failed", description: "Could not process the rejection, possibly due to storage limits.", variant: "destructive" });
      }
    }
  };
  
  const pending = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <>
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline text-green-500">
            <Download className="mr-2 h-6 w-6" /> Deposit Requests
          </CardTitle>
          <CardDescription>Review and approve user deposit requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold mb-2 text-foreground/80">Pending Approval ({pending.length})</h3>
          {pending.length > 0 ? (
            <ScrollArea className="h-[300px] w-full border rounded-md mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.username}</div>
                        <div className="text-xs text-muted-foreground">{req.email}</div>
                      </TableCell>
                      <TableCell>₹{req.amount.toFixed(2)}</TableCell>
                       <TableCell className="text-xs text-muted-foreground">
                        {new Date(req.requestedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setViewingImage(req.screenshotDataUrl)}
                          title={req.screenshotDataUrl ? `View proof: ${req.screenshotFilename}` : "No screenshot was uploaded for this request."}
                          disabled={!req.screenshotDataUrl}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          {req.screenshotDataUrl ? 'View Proof' : 'No Proof'}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-500 hover:bg-green-500/10" onClick={() => handleProcessRequest(req, 'approved')} title="Mark as Approved">
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
            <p className="text-sm text-muted-foreground text-center py-4">No pending deposit requests.</p>
          )}
          
          <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground/80">Processed Requests ({processed.length})</h3>
           {processed.length > 0 ? (
            <ScrollArea className="h-[200px] w-full border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Screenshot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processed.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-medium">{req.username}</div>
                      </TableCell>
                      <TableCell>₹{req.amount.toFixed(2)}</TableCell>
                      <TableCell>
                          <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} 
                                 className={req.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}>
                              {req.status}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" title={req.screenshotFilename}><span className="truncate max-w-[120px]">{req.screenshotFilename}</span></Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No processed deposit requests yet.</p>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!viewingImage} onOpenChange={(isOpen) => !isOpen && setViewingImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Deposit Screenshot</DialogTitle>
            <DialogDescription>
              Review the payment proof submitted by the user.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center bg-muted/50 rounded-lg p-4">
            {viewingImage && (
              <img 
                src={viewingImage} 
                alt="Deposit screenshot proof" 
                className="max-w-full max-h-[70vh] object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
