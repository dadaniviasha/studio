
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, WalletCards, AlertTriangle, History, ArrowDown, ArrowUp, Trophy, Gift, ArrowRightLeft, Wallet, Upload, FileCheck2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { MIN_WITHDRAWAL_AMOUNT, MIN_DEPOSIT_AMOUNT } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { WalletTransaction, WithdrawalRequest, DepositRequest } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const WITHDRAWAL_REQUESTS_STORAGE_KEY = 'CROTOS_WITHDRAWAL_REQUESTS';
const DEPOSIT_REQUESTS_STORAGE_KEY = 'CROTOS_DEPOSIT_REQUESTS';

const getTransactionIcon = (type: WalletTransaction['type']) => {
  const iconClasses = "h-5 w-5";
  switch (type) {
    case 'deposit': return <ArrowDown className={cn(iconClasses, "text-green-500")} />;
    case 'withdrawal': return <ArrowUp className={cn(iconClasses, "text-red-500")} />;
    case 'bet_placed': return <ArrowRightLeft className={cn(iconClasses, "text-gray-400")} />;
    case 'bet_won': return <Trophy className={cn(iconClasses, "text-yellow-500")} />;
    case 'signup_bonus': return <Gift className={cn(iconClasses, "text-primary")} />;
    default: return <DollarSign className={cn(iconClasses, "text-muted-foreground")} />;
  }
};

const getStatusBadgeVariant = (status: WalletTransaction['status']): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'completed': return 'default';
    case 'pending': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'secondary';
  }
};

export default function WalletPage() {
  const { currentUser, updateBalance, loading: authLoading } = useAuth();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const currentBalance = currentUser ? currentUser.walletBalance : 0;
  
  useEffect(() => {
    // In a real app, you would fetch this from your backend/database
    if (currentUser) {
        const dummyTransactions: WalletTransaction[] = [
            { id: 'txn5', userId: currentUser.id, type: 'signup_bonus', amount: 50, timestamp: Date.now() - 86400000 * 3, description: 'Welcome bonus', status: 'completed' },
            { id: 'txn1', userId: currentUser.id, type: 'deposit', amount: 500, timestamp: Date.now() - 86400000 * 2, description: 'Deposit via UPI', status: 'completed' },
            { id: 'txn2', userId: currentUser.id, type: 'bet_placed', amount: -50, timestamp: Date.now() - 86400000, description: 'Bet on RED', status: 'completed' },
            { id: 'txn3', userId: currentUser.id, type: 'bet_won', amount: 100, timestamp: Date.now() - 86400000, description: 'Win on RED', status: 'completed' },
            { id: 'txn4', userId: currentUser.id, type: 'withdrawal', amount: -200, timestamp: Date.now() - 3600000, description: 'Withdrawal request', status: 'pending' },
             { id: 'txn6', userId: currentUser.id, type: 'bet_placed', amount: -10, timestamp: Date.now() - 7200000, description: 'Bet on Number 7', status: 'completed' },
              { id: 'txn7', userId: currentUser.id, type: 'deposit', amount: 100, timestamp: Date.now() - 86400000 * 4, description: 'Failed Deposit', status: 'failed' },
        ].sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first

        setTransactions(dummyTransactions);
    }
}, [currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setSelectedFile(e.target.files[0]);
    } else {
        setSelectedFile(null);
    }
  };
  
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to deposit funds.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < MIN_DEPOSIT_AMOUNT) {
      toast({ title: "Invalid Amount", description: `Minimum deposit amount is ₹${MIN_DEPOSIT_AMOUNT}.`, variant: "destructive" });
      return;
    }
    
    if (!selectedFile) {
      toast({ title: "Screenshot Required", description: "Please upload a payment screenshot to confirm your deposit.", variant: "destructive" });
      return;
    }
    
    try {
      const existingRequestsString = localStorage.getItem(DEPOSIT_REQUESTS_STORAGE_KEY);
      const existingRequests: DepositRequest[] = existingRequestsString ? JSON.parse(existingRequestsString) : [];
      
      const newRequest: DepositRequest = {
        id: `dp-${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        amount: amount,
        screenshotFilename: selectedFile.name,
        requestedAt: Date.now(),
        status: 'pending',
      };

      const updatedRequests = [...existingRequests, newRequest];
      localStorage.setItem(DEPOSIT_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));
      
      setDepositAmount('');
      setSelectedFile(null); // Reset file input
      toast({ 
        title: "Deposit Awaiting Confirmation", 
        description: `Your deposit of ₹${amount.toFixed(2)} with screenshot '${selectedFile.name}' is being processed. An admin will update your balance shortly after confirming payment.`,
        duration: 8000
      });

    } catch (error) {
       console.error("Failed to save deposit request:", error);
       toast({ title: "Request Failed", description: "Could not save your deposit request. Please try again.", variant: "destructive" });
    }
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
     if (!currentUser) {
      toast({ title: "Login Required", description: "Please log in to request a withdrawal.", variant: "destructive" });
      return;
    }
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) {
      toast({ title: "Invalid Amount", description: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.`, variant: "destructive" });
      return;
    }
    if (amount > currentBalance) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds to withdraw this amount.", variant: "destructive" });
      return;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
        toast({ title: "Invalid UPI ID", description: "Please enter a valid UPI ID (e.g., yourname@bank).", variant: "destructive" });
        return;
    }

    try {
      const existingRequestsString = localStorage.getItem(WITHDRAWAL_REQUESTS_STORAGE_KEY);
      const existingRequests: WithdrawalRequest[] = existingRequestsString ? JSON.parse(existingRequestsString) : [];
      
      const newRequest: WithdrawalRequest = {
        id: `wd-${Date.now()}`,
        userId: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        upiId: upiId.trim(),
        amount: amount,
        requestedAt: Date.now(),
        status: 'pending',
      };

      const updatedRequests = [...existingRequests, newRequest];
      localStorage.setItem(WITHDRAWAL_REQUESTS_STORAGE_KEY, JSON.stringify(updatedRequests));

      setWithdrawalAmount('');
      setUpiId('');
      toast({ title: "Withdrawal Requested", description: `Your request to withdraw ₹${amount.toFixed(2)} is pending approval.` });
    } catch (error) {
       console.error("Failed to save withdrawal request:", error);
       toast({ title: "Request Failed", description: "Could not save your withdrawal request. Please try again.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-xl text-muted-foreground">Loading wallet...</p>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
            <p className="text-lg text-muted-foreground mb-6">You need to be logged in to access your wallet.</p>
            <Link href="/login">
                <Button size="lg">Login to Wallet</Button>
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
        <Card className="max-w-2xl mx-auto mb-8 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <WalletCards className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-3xl font-headline">{currentUser.username}&apos;s Wallet</CardTitle>
            <CardDescription className="text-lg">Manage your funds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 border-b border-t border-border/40 my-6">
              <p className="text-sm text-muted-foreground">CURRENT BALANCE</p>
              <p className="text-5xl font-bold text-primary mt-1">₹{currentBalance.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-headline text-green-500">
                <ArrowDownCircle className="mr-2 h-6 w-6" /> Deposit Funds
              </CardTitle>
              <CardDescription>Enter amount, scan QR, then upload screenshot.</CardDescription>
            </CardHeader>
            <form onSubmit={handleDeposit}>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="depositAmount">1. Amount to Deposit (₹)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="depositAmount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder={`Min ₹${MIN_DEPOSIT_AMOUNT}`}
                      className="pl-10 h-12"
                      min={MIN_DEPOSIT_AMOUNT.toString()} 
                    />
                  </div>
                </div>
                 <div className="space-y-2">
                    <Label>2. Scan QR to Pay</Label>
                    <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-background/50 border">
                        <div className="bg-white p-2 rounded-lg w-[266px] h-[266px] flex items-center justify-center shadow-md">
                           <Image
                                src="/scanner.png"
                                alt="UPI Payment QR Code"
                                width={250}
                                height={250}
                                className="rounded-sm"
                            />
                        </div>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>3. Upload Payment Screenshot</Label>
                    <div className="mt-1">
                        <Input
                            id="screenshot"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Label
                            htmlFor="screenshot"
                            className={cn(
                                "flex h-12 w-full items-center justify-center rounded-md border-2 border-dashed border-input cursor-pointer bg-transparent px-3 py-2 text-sm text-muted-foreground hover:bg-accent/10 hover:border-accent",
                                selectedFile && "border-green-500"
                            )}
                        >
                            {selectedFile ? (
                                <span className="flex items-center gap-2 text-green-500 font-medium">
                                    <FileCheck2 className="h-5 w-5" />
                                    {selectedFile.name}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Upload className="h-5 w-5" />
                                    Select Screenshot
                                </span>
                            )}
                        </Label>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                    type="submit" 
                    className="w-full h-12 bg-green-500 hover:bg-green-600 text-white"
                    disabled={!selectedFile || !depositAmount || parseFloat(depositAmount) < MIN_DEPOSIT_AMOUNT}
                >
                  Confirm Deposit
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-headline text-red-500">
                <ArrowUpCircle className="mr-2 h-6 w-6" /> Withdraw Funds
              </CardTitle>
              <CardDescription>Request a withdrawal to your UPI ID.</CardDescription>
            </CardHeader>
            <form onSubmit={handleWithdrawal}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="withdrawalAmount">Amount (₹)</Label>
                   <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="withdrawalAmount"
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder={`Min ₹${MIN_WITHDRAWAL_AMOUNT}`}
                      className="pl-10 h-12"
                      min={MIN_WITHDRAWAL_AMOUNT.toString()}
                    />
                  </div>
                </div>
                 <div>
                  <Label htmlFor="upiId">Your UPI ID</Label>
                   <div className="relative mt-1">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="upiId"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@bank"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Minimum withdrawal: ₹{MIN_WITHDRAWAL_AMOUNT}. Withdrawals are subject to admin approval.</p>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full h-12 bg-red-500 hover:bg-red-600 text-white">
                  Request Withdrawal
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
        <Card className="max-w-4xl mx-auto mt-8 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-headline flex items-center">
                    <History className="mr-2 h-6 w-6" /> Transaction History
                </CardTitle>
                <CardDescription>Your recent wallet activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>
                                <div className="flex items-center gap-2 font-medium">
                                    {getTransactionIcon(tx.type)}
                                    <span className="capitalize hidden sm:inline">{tx.type.replace('_', ' ')}</span>
                                </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                                <TableCell className="text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(tx.status)} className="capitalize">{tx.status}</Badge>
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right font-semibold font-mono",
                                    tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                                )}>
                                    {tx.amount > 0 ? `+₹${tx.amount.toFixed(2)}` : `-₹${Math.abs(tx.amount).toFixed(2)}`}
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                            <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                                No transactions yet.
                            </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
