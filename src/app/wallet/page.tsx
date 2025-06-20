"use client";

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, WalletCards } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { MIN_WITHDRAWAL_AMOUNT } from '@/lib/constants';

// Dummy balance, replace with actual state management
let userWalletBalance = 1000; 

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Simulate fetching balance
    setBalance(userWalletBalance);
  }, []);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount to deposit.", variant: "destructive" });
      return;
    }
    // Simulate deposit
    userWalletBalance += amount;
    setBalance(userWalletBalance);
    setDepositAmount('');
    toast({ title: "Deposit Successful", description: `₹${amount.toFixed(2)} has been added to your wallet.` });
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) {
      toast({ title: "Invalid Amount", description: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.`, variant: "destructive" });
      return;
    }
    if (amount > balance) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds to withdraw this amount.", variant: "destructive" });
      return;
    }
    // Simulate withdrawal request
    // In a real app, this would create a WithdrawalRequest record for admin approval
    userWalletBalance -= amount; // For immediate UI feedback, though real deduction is after approval
    setBalance(userWalletBalance);
    setWithdrawalAmount('');
    toast({ title: "Withdrawal Requested", description: `Your request to withdraw ₹${amount.toFixed(2)} is pending approval.` });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto mb-8 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <WalletCards className="mx-auto h-16 w-16 text-primary mb-4" />
            <CardTitle className="text-3xl font-headline">Your Wallet</CardTitle>
            <CardDescription className="text-lg">Manage your funds and transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 border-b border-t border-border/40 my-6">
              <p className="text-sm text-muted-foreground">CURRENT BALANCE</p>
              <p className="text-5xl font-bold text-primary mt-1">₹{balance.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-headline text-green-500">
                <ArrowDownCircle className="mr-2 h-6 w-6" /> Deposit Funds
              </CardTitle>
              <CardDescription>Add money to your wallet to start playing.</CardDescription>
            </CardHeader>
            <form onSubmit={handleDeposit}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="depositAmount">Amount (₹)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="depositAmount"
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="pl-10 h-12"
                      min="1" // Minimum deposit, can be a constant
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full h-12 bg-green-500 hover:bg-green-600 text-white">
                  Deposit
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl font-headline text-red-500">
                <ArrowUpCircle className="mr-2 h-6 w-6" /> Withdraw Funds
              </CardTitle>
              <CardDescription>Request a withdrawal of your winnings.</CardDescription>
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
        {/* Placeholder for transaction history */}
        <Card className="max-w-4xl mx-auto mt-8 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-xl font-headline">Transaction History</CardTitle>
                <CardDescription>Your recent wallet activity.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-center text-muted-foreground py-8">Transaction history feature coming soon.</p>
            </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
