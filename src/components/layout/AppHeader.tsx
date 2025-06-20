"use client";

import Link from 'next/link';
import { Zap, Wallet, BarChart3, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// Dummy balance, replace with actual state management
const useWalletBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    // Simulate fetching balance
    setBalance(1000); 
  }, []);
  return balance;
};

export function AppHeader() {
  const pathname = usePathname();
  const balance = useWalletBalance();

  const navItems = [
    { href: '/', label: 'Game', icon: Zap },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/admin', label: 'Admin Panel', icon: UserCog, admin: true }, // Simple link for now
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <Zap className="h-8 w-8" />
          <span className="font-headline text-2xl font-bold">Crotos</span>
        </Link>
        
        <nav className="flex items-center space-x-4 lg:space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-foreground/60"
              )}
            >
              <Button variant="ghost" className="space-x-2 px-3">
                <item.icon className="h-5 w-5" /> 
                <span>{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
            {balance !== null ? (
              <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                <Wallet className="mr-2 h-5 w-5" />
                ₹{balance.toFixed(2)}
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <Wallet className="mr-2 h-5 w-5" />
                Loading...
              </Button>
            )}
        </div>
      </div>
    </header>
  );
}
