"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Users, Edit, DollarSign } from 'lucide-react';
import type { User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { getAllUsersAction, updateUserBalanceAction } from '@/server/actions';
import { Skeleton } from '@/components/ui/skeleton';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const userList = await getAllUsersAction();
        setUsers(userList);
      } catch (error) {
        toast({
          title: "Error fetching users",
          description: "Could not load the list of users.",
          variant: "destructive",
        });
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [toast]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setNewBalance(user.walletBalance.toFixed(2));
    setIsDialogOpen(true);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) return;

    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue) || balanceValue < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid, non-negative number for the balance.",
        variant: "destructive",
      });
      return;
    }

    const result = await updateUserBalanceAction(selectedUser.id, balanceValue);

    if (result.success) {
      toast({
        title: "Balance Updated",
        description: `${selectedUser.username}'s balance has been set to ₹${balanceValue.toFixed(2)}.`,
      });
      // Update local state to reflect the change immediately
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, walletBalance: balanceValue } : u));
      setIsDialogOpen(false); // Close the dialog on success
    } else {
      toast({
        title: "Update Failed",
        description: result.message,
        variant: "destructive",
      });
    }
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
                  <TableHead className="text-right">Wallet Balance (₹)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-[100px] mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-right font-mono">₹{user.walletBalance.toFixed(2)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Balance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Wallet Balance</DialogTitle>
            <DialogDescription>
              Change the balance for <span className="font-semibold text-primary">{selectedUser?.username}</span>. Click save when you're done.
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
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
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
