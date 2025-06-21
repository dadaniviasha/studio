
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Users, Edit, DollarSign, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { User } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { getAllUsersAction, updateUserBalanceAction } from '@/server/actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/lib/firebase/firestore';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      setFetchError(null);
      try {
        const userList = await getAllUsersAction();
        setUsers(userList);
      } catch (error: any) {
        let description = "An unexpected error occurred. Could not load the list of users.";

        if (error?.message && (error.message.includes('insufficient permissions') || error.message.includes('permission-denied'))) {
            // This is the specific Firestore permissions error. We will create a more detailed message.
            description = "You do not have permission to view the user list. This is a common setup issue caused by Firestore's Security Rules.";
        }
        
        setFetchError(description);
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

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
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, walletBalance: balanceValue } : u));
      setIsDialogOpen(false);
    } else {
      toast({
        title: "Update Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };
  
  const renderTroubleshooting = () => (
    <div className="space-y-4 text-sm">
        <p>This error means your account lacks the necessary permissions in the database. Since you've already confirmed the rules and project ID, the issue is very likely a subtle data error for your user in Firestore.</p>
        <p className="font-semibold">Please perform this final check in the Firebase Console:</p>
        <ol className="list-decimal list-inside space-y-3">
            <li>
                <strong>Go to Firestore Database &rarr; `users` collection.</strong>
            </li>
            <li>
                <strong>Find your user document.</strong> The app sees you as <strong className="text-primary">{currentUser?.email || 'Not Logged In'}</strong> (with Admin status: <strong className="text-primary">{currentUser?.isAdmin ? 'Admin' : 'Not an Admin'}</strong>). The document ID is your User UID from the Authentication tab.
            </li>
            <li>
                <strong>Check the `isAdmin` field VERY carefully:</strong>
                <ul className="list-disc list-inside pl-4 mt-2 space-y-1 bg-background/50 p-3 rounded-md">
                    <li>
                      <strong>Case-Sensitivity:</strong> The field name must be exactly `isAdmin` (lowercase 'i', uppercase 'A'). Not `isadmin` or `IsAdmin`.
                    </li>
                    <li>
                      <strong>Data Type:</strong> The value must be a <strong className="text-primary">boolean</strong>, not a string. It should say `true` (boolean), not `"true"` (string).
                    </li>
                </ul>
            </li>
             <li>
                <strong>Confirm the Rules:</strong> As a last resort, please re-copy the rules from <code className="text-xs bg-muted p-1 rounded">PROPOSED_FIRESTORE_RULES.md</code> and publish them again, just in case a previous attempt didn't save correctly.
            </li>
        </ol>
    </div>
  );

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
          {fetchError && (
             <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Access Error: Final Check</AlertTitle>
              <AlertDescription>
                {renderTroubleshooting()}
              </AlertDescription>
            </Alert>
          )}
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
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableCell>
                      <TableCell className="text-center"><Skeleton className="h-8 w-[100px] mx-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => (
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
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Balance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : !fetchError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : null}
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
