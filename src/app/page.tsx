"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { BettingArea } from '@/components/game/BettingArea';
import { ResultsDisplay } from '@/components/game/ResultsDisplay';
import { GameCountdown } from '@/components/game/GameCountdown';
import type { GameResult, ColorOption, NumberOption, Bet as BetType, GameRound } from '@/lib/types';
import { NUMBER_COLORS, PAYOUT_MULTIPLIERS, RESULT_PROCESSING_DURATION_SECONDS } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Dummy data and simulation logic
let currentRoundId = Date.now();
let userBalance = 1000; // Simulating user balance
const initialBets: BetType[] = [];

export default function HomePage() {
  const [currentResult, setCurrentResult] = useState<GameResult | null>(null);
  const [resultHistory, setResultHistory] = useState<GameResult[]>([]);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [activeBets, setActiveBets] = useState<BetType[]>(initialBets);
  const [currentBalance, setCurrentBalance] = useState(userBalance);
  const [round, setRound] = useState<GameRound>({
    id: currentRoundId.toString(),
    startTime: Date.now(),
    endTime: Date.now() + 60000, // Placeholder
    status: 'betting'
  });
  const { toast } = useToast();

  const processRoundEnd = useCallback(() => {
    setIsBettingPhase(false);
    setRound(prev => ({ ...prev, status: 'processing' }));

    // Simulate result generation
    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 10) as NumberOption;
      const colorInfo = NUMBER_COLORS[winningNumber];
      
      const newResult: GameResult = {
        roundId: round.id,
        winningNumber,
        winningColor: colorInfo.primary,
        winningVioletColor: colorInfo.violet,
        timestamp: Date.now(),
        finalizedBy: 'random', // or 'admin' if controlled
      };

      setCurrentResult(newResult);
      setResultHistory(prev => [newResult, ...prev.slice(0, 9)]); // Keep last 10 results

      // Process bets (simplified)
      let winnings = 0;
      const updatedBets = activeBets.map(bet => {
        let isWin = false;
        let payout = 0;
        if (bet.type === 'color') {
          if (bet.selection === newResult.winningColor || (bet.selection === 'VIOLET' && newResult.winningVioletColor)) {
            isWin = true;
            payout = bet.amount * PAYOUT_MULTIPLIERS[bet.selection as ColorOption];
          }
        } else if (bet.type === 'number') {
          if (bet.selection === newResult.winningNumber) {
            isWin = true;
            payout = bet.amount * PAYOUT_MULTIPLIERS.NUMBER;
          }
        }
        if (isWin) {
          winnings += payout;
        }
        return { ...bet, isWin, payout, isProcessed: true };
      });
      
      setActiveBets(updatedBets); // Or clear them for the new round
      const newBalance = currentBalance + winnings;
      setCurrentBalance(newBalance);
      userBalance = newBalance; // Update global simulation
      
      if (winnings > 0) {
        toast({ title: "You Won!", description: `Congratulations! You won ₹${winnings.toFixed(2)} this round.`});
      } else if (activeBets.filter(b => !b.isProcessed).length > 0) { // Check if there were bets placed this round
        toast({ title: "Round Over", description: "Better luck next time!", variant: "default"});
      }

      // Start new round after a delay
      setTimeout(() => {
        currentRoundId = Date.now();
        setRound({
          id: currentRoundId.toString(),
          startTime: Date.now(),
          endTime: Date.now() + 60000,
          status: 'betting'
        });
        setActiveBets([]); // Clear bets for new round
        setIsBettingPhase(true);
      }, RESULT_PROCESSING_DURATION_SECONDS * 1000);

    }, 2000); // Simulate processing time
  }, [round.id, activeBets, currentBalance, toast]);

  const handleBetPlaced = (type: 'color' | 'number', selection: ColorOption | NumberOption, amount: number) => {
    if (currentBalance < amount) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds to place this bet.", variant: "destructive" });
      return;
    }
    
    const newBet: BetType = {
      id: `bet-${Date.now()}-${Math.random()}`,
      userId: 'currentUser', // Placeholder
      roundId: round.id,
      type,
      selection,
      amount,
      timestamp: Date.now(),
    };
    setActiveBets(prev => [...prev, newBet]);
    const newBalance = currentBalance - amount;
    setCurrentBalance(newBalance);
    userBalance = newBalance; // Update global simulation
  };
  
  // Update wallet balance in header (this is a hack, ideally context/global state)
  useEffect(() => {
    const headerBalanceElement = document.querySelector('.flex.items-center.space-x-3 button span:last-child');
    if (headerBalanceElement) {
        // This is not a good practice for production, just for UI update in scaffold
        // headerBalanceElement.textContent = `₹${currentBalance.toFixed(2)}`;
    }
  }, [currentBalance]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <GameCountdown onTimerEnd={processRoundEnd} isProcessing={!isBettingPhase} roundId={round.id} />
            <BettingArea onBetPlaced={handleBetPlaced} disabled={!isBettingPhase} />
          </div>
          <div className="lg:col-span-1 space-y-6 lg:space-y-8">
            <ResultsDisplay currentResult={currentResult} history={resultHistory} />
            {/* Can add another component here, e.g., My Bets for the current round */}
            <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-headline text-primary">My Active Bets</CardTitle>
                    <CardDescription>Bets placed in the current round.</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeBets.filter(b => !b.isProcessed).length > 0 ? (
                        <ScrollArea className="h-[150px]">
                        <ul className="space-y-2">
                            {activeBets.filter(b => !b.isProcessed).map(bet => (
                                <li key={bet.id} className="text-sm p-2 bg-background/50 rounded-md flex justify-between">
                                    <span>{bet.type === 'color' ? bet.selection : `No. ${bet.selection}`}</span>
                                    <span className="font-semibold">₹{bet.amount}</span>
                                </li>
                            ))}
                        </ul>
                        </ScrollArea>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No active bets for this round.</p>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
