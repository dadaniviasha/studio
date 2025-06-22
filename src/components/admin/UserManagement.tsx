"use client";

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { getAllUsersAction, updateUserBalanceAction } from '@/server/actions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, Edit, DollarSign, ShieldCheck, AlertTriangle } from 'lucide-react';

// Main Component
export function UserManagement() {
  const [state, setState] = useState<{
    users: User[];
    isLoading: boolean;
    error: string | null;
  }>({
    users: [],
    isLoading: true,
    error: null,
  });

  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean;
    user: User | null;
    newBalance: string;
  }>({
    isOpen: false,
    user: null,
    newBalance: '',
  });
  
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const userList = await getAllUsersAction();
      setState(prev => ({ ...prev, users: userList, isLoading: false }));
    } catch (error: any) {
      // The error from the action is specific and helpful, so we pass it directly.
      setState(prev => ({ ...prev, error: error.message, isLoading: false, users: [] }));
      console.error("Failed to fetch users:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditDialog = (user: User) => {
    setEditDialog({
      isOpen: true,
      user: user,
      newBalance: user.walletBalance.toFixed(2),
    });
  };

  const handleUpdateBalance = async () => {
    if (!editDialog.user || !currentUser) {
      toast({ title: "Error", description: "Admin user not found. Please log in again.", variant: "destructive" });
      return;
    }

    const balanceValue = parseFloat(editDialog.newBalance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid, non-negative number for the balance.",
        variant: "destructive",
      });
      return;
    }

    const result = await updateUserBalanceAction(currentUser.id, editDialog.user.id, balanceValue);

    if (result.success) {
      toast({
        title: "Balance Updated",
        description: result.message,
      });
      // Update state locally to reflect change immediately
      setState(prevState => ({
        ...prevState,
        users: prevState.users.map(u => u.id === editDialog.user!.id ? { ...u, walletBalance: balanceValue } : u)
      }));
      setEditDialog({ isOpen: false, user: null, newBalance: '' }); // Close dialog
    } else {
      toast({
        title: "Update Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
              <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-8 w-[100px] mx-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (state.error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={5}>
              <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Permission Error: Could Not Load Users</AlertTitle>
                <AlertDescription>
                    {/* Use the specific error message from the state */}
                    <p className="font-semibold mt-2">{state.error}</p>
                </AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }
    
    if (state.users.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} className="h-24 text-center">
              No users found.
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {state.users.map((user) => (
          <TableRow key={user.id} className={cn(user.isAdmin && "bg-primary/10")}>
            <TableCell className="font-medium">{user.username}</TableCell>
            <TableCell className="text-muted-foreground">{user.email}</TableCell>
            <TableCell>
              {user.isAdmin ? (
                  <Badge variant="default" className="bg-primary/80">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      Admin
                  </Badge>
              ) : (
                  <Badge variant="secondary">User</Badge>
              )}
            </TableCell>
            <TableCell className="text-right font-mono">₹{user.walletBalance.toFixed(2)}</TableCell>
            <TableCell className="text-center">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Balance
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  };
  
  return (
    <>
      <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline text-primary">
            <Users className="mr-2 h-6 w-6" /> User Management
          </CardTitle>
          <CardDescription>View user accounts and manage their wallet balances.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Wallet Balance (₹)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              {renderContent()}
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={editDialog.isOpen} onOpenChange={(isOpen) => setEditDialog(prev => ({ ...prev, isOpen }))}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Wallet Balance</DialogTitle>
            <DialogDescription>
              Change the balance for <span className="font-semibold text-primary">{editDialog.user?.username}</span>. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <div className="relative col-span-3">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="balance"
                  value={editDialog.newBalance}
                  onChange={(e) => setEditDialog(prev => ({...prev, newBalance: e.target.value}))}
                  className="pl-10"
                  type="number"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateBalance}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
