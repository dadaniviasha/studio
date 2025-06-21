
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye, BarChart3, ArrowUp, ArrowDown, Hash } from 'lucide-react';
import type { Bet } from '@/lib/types';

const ROUND_ID_STORAGE_KEY = 'CROTOS_CURRENT_ROUND_ID';
const ACTIVE_BETS_STORAGE_KEY = 'CROTOS_ACTIVE_BETS';

export function CurrentBetsOverview() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [roundId, setRoundId] = useState<string | null>(null);

  useEffect(() => {
    // This function reads the current state from localStorage
    const updateStateFromStorage = () => {
        try {
            const currentRoundId = localStorage.getItem(ROUND_ID_STORAGE_KEY);
            setRoundId(currentRoundId);

            const storedBets = localStorage.getItem(ACTIVE_BETS_STORAGE_KEY);
            if (storedBets) {
                const allBets: Bet[] = JSON.parse(storedBets);
                // We only care about active (unprocessed) bets for the current round
                const currentRoundBets = currentRoundId 
                    ? allBets.filter(bet => bet.roundId === currentRoundId && !bet.isProcessed) 
                    : [];
                setBets(currentRoundBets);
            } else {
                setBets([]);
            }
        } catch (error) {
            console.error("Error reading state from localStorage in Admin Panel:", error);
            setBets([]);
        }
    };

    updateStateFromStorage(); // Initial load

    // Set up an event listener to update the component when localStorage changes in another tab
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === ACTIVE_BETS_STORAGE_KEY || event.key === ROUND_ID_STORAGE_KEY) {
            updateStateFromStorage();
        }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup the event listener when the component unmounts
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const getBetDescription = (bet: Bet): string => {
    if (bet.selectedColor) return `Color: ${bet.selectedColor}`;
    if (bet.selectedNumber !== null) return `Number: ${bet.selectedNumber}`;
    return "Unknown Bet";
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
  const totalOnRed = bets
    .filter((bet) => bet.selectedColor === 'RED')
    .reduce((sum, bet) => sum + bet.amount, 0);
  const totalOnGreen = bets
    .filter((bet) => bet.selectedColor === 'GREEN')
    .reduce((sum, bet) => sum + bet.amount, 0);
  const totalOnViolet = bets
    .filter((bet) => bet.selectedColor === 'VIOLET')
    .reduce((sum, bet) => sum + bet.amount, 0);
  const totalOnNumbers = bets
    .filter((bet) => bet.selectedNumber !== null)
    .reduce((sum, bet) => sum + bet.amount, 0);

  const betAmounts = bets.map(b => b.amount);
  const biggestBet = betAmounts.length > 0 ? Math.max(...betAmounts) : 0;
  const smallestBet = betAmounts.length > 0 ? Math.min(...betAmounts) : 0;

  // Calculate totals for each number
  const totalsByNumber: Record<number, number> = {};
  for (let i = 0; i < 10; i++) {
    totalsByNumber[i] = 0;
  }
  bets.forEach(bet => {
    if (bet.selectedNumber !== null) {
      totalsByNumber[bet.selectedNumber] = (totalsByNumber[bet.selectedNumber] || 0) + bet.amount;
    }
  });


  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <Eye className="mr-2 h-6 w-6" /> Live Bets for Round #{roundId || '...'}
        </CardTitle>
        <CardDescription>
          Overview of bets placed in the current round. This data is updated live from the game page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border rounded-lg bg-background/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center"><BarChart3 className="mr-2 h-5 w-5" />Betting Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col p-3 bg-background/50 rounded-md">
                    <span className="text-muted-foreground">Total Bet Amount</span>
                    <span className="font-bold text-lg text-primary">₹{totalBetAmount.toFixed(2)}</span>
                </div>
                <div className="flex flex-col p-3 bg-red-900/20 rounded-md">
                    <span className="text-red-400">On Red</span>
                    <span className="font-bold text-lg text-red-300">₹{totalOnRed.toFixed(2)}</span>
                </div>
                <div className="flex flex-col p-3 bg-green-900/20 rounded-md">
                    <span className="text-green-400">On Green</span>
                    <span className="font-bold text-lg text-green-300">₹{totalOnGreen.toFixed(2)}</span>
                </div>
                 <div className="flex flex-col p-3 bg-purple-900/20 rounded-md">
                    <span className="text-purple-400">On Violet</span>
                    <span className="font-bold text-lg text-purple-300">₹{totalOnViolet.toFixed(2)}</span>
                </div>
                 <div className="flex flex-col p-3 bg-gray-700/20 rounded-md">
                    <span className="text-gray-400">On Numbers (Total)</span>
                    <span className="font-bold text-lg text-gray-300">₹{totalOnNumbers.toFixed(2)}</span>
                </div>
                 <div className="flex flex-col p-3 bg-background/50 rounded-md">
                     <span className="text-muted-foreground">Bet Range</span>
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <ArrowDown className="h-5 w-5 text-red-500" />
                        <span>₹{smallestBet.toFixed(2)}</span>
                        <ArrowUp className="h-5 w-5 text-green-500" />
                         <span>₹{biggestBet.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mb-6 p-4 border rounded-lg bg-background/30">
            <h3 className="text-lg font-semibold mb-4 flex items-center"><Hash className="mr-2 h-5 w-5" />Bets on Each Number</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-sm">
                {Object.entries(totalsByNumber).map(([number, total]) => (
                    <div key={number} className="flex flex-col items-center justify-center p-3 bg-background/50 rounded-md">
                        <span className="font-bold text-2xl">{number}</span>
                        <span className="font-semibold text-primary">₹{total.toFixed(2)}</span>
                    </div>
                ))}
            </div>
        </div>

        {bets.length > 0 ? (
          <ScrollArea className="h-[300px] w-full border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bet ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Selection</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-mono text-xs">{bet.id.slice(-6)}</TableCell>
                    <TableCell>{bet.userId}</TableCell>
                    <TableCell>
                      <Badge variant={bet.selectedColor ? "default" : "secondary"} 
                             className={
                                bet.selectedColor === 'RED' ? 'bg-red-500' :
                                bet.selectedColor === 'GREEN' ? 'bg-green-500' :
                                bet.selectedColor === 'VIOLET' ? 'bg-purple-500' :
                                bet.selectedNumber !== null ? 'bg-gray-500' : '' // For number type, or default
                             }>
                        {getBetDescription(bet)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{bet.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No active bets placed for this round yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
