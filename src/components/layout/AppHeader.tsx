
"use client";

import Link from 'next/link';
import { Zap, Wallet, UserCog, LogIn, UserPlus, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


export function AppHeader() {
  const pathname = usePathname();
  const { currentUser, logout, loading } = useAuth();

  const navItems = [
    { href: '/', label: 'Game', icon: Zap, requiresAuth: false },
    { href: '/wallet', label: 'Wallet', icon: Wallet, requiresAuth: true },
    // Admin link visibility could be tied to user roles in a real app
    { href: '/admin', label: 'Admin Panel', icon: UserCog, requiresAuth: false, adminRoute: true }, 
  ];

  const getInitials = (name: string = "") => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'U';
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-primary hover:opacity-80 transition-opacity">
          <Zap className="h-8 w-8" />
          <span className="font-headline text-2xl font-bold">Crotos</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navItems.map((item) => {
            if (item.requiresAuth && !currentUser) return null;
            // A simple way to hide admin link if not a specific user, or just show it
            // if (item.adminRoute && (!currentUser || currentUser.email !== "admin@example.com")) return null;

            return (
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
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
            {loading ? (
                <Button variant="outline" disabled>Loading...</Button>
            ) : currentUser ? (
              <>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary/10 cursor-default">
                  <Wallet className="mr-2 h-5 w-5" />
                  ₹{currentUser.walletBalance.toFixed(2)}
                </Button>
                <Avatar className="h-9 w-9">
                  {/* Placeholder for user avatar image */}
                  {/* <AvatarImage src="https://placehold.co/40x40.png" alt={currentUser.username} /> */}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {getInitials(currentUser.username)}
                  </AvatarFallback>
                </Avatar>
                {/* <span className="text-sm font-medium text-foreground/80 hidden sm:inline">{currentUser.username}</span> */}
                <Button variant="ghost" size="icon" onClick={logout} title="Logout">
                  <LogOut className="h-5 w-5 text-red-500" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="space-x-2">
                    <LogIn className="h-5 w-5" />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="default" className="space-x-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                     <UserPlus className="h-5 w-5" />
                     <span>Sign Up</span>
                  </Button>
                </Link>
              </>
            )}
        </div>
      </div>
    </header>
  );
}
