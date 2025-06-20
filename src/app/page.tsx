"use client";

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { BettingArea } from '@/components/game/BettingArea';
import { ResultsDisplay } from '@/components/game/ResultsDisplay';
import { GameCountdown } from '@/components/game/GameCountdown';
import type { GameResult, ColorOption, NumberOption, Bet as BetType, GameRound } from '@/lib/types';
import { NUMBER_COLORS, PAYOUT_MULTIPLIERS, RESULT_PROCESSING_DURATION_SECONDS, GAME_ROUND_DURATION_SECONDS, MIN_BET_AMOUNT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Info } from 'lucide-react';

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
    endTime: Date.now() + GAME_ROUND_DURATION_SECONDS * 1000, 
    status: 'betting'
  });
  const { toast } = useToast();

  const processRoundEnd = useCallback(() => {
    setIsBettingPhase(false);
    setRound(prev => ({ ...prev, status: 'processing' }));

    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 10) as NumberOption;
      const colorInfo = NUMBER_COLORS[winningNumber];
      
      const newResult: GameResult = {
        roundId: round.id,
        winningNumber,
        winningColor: colorInfo.primary, // Primary color of the winning number
        winningVioletColor: colorInfo.violet, // Violet if applicable to the winning number
        timestamp: Date.now(),
        finalizedBy: 'random', 
      };

      setCurrentResult(newResult);
      setResultHistory(prev => [newResult, ...prev.slice(0, 9)]); 

      let totalWinningsThisRound = 0;
      const updatedBets = activeBets.map(bet => {
        let isWin = false;
        let payoutAmount = 0;
        const processedBet = { ...bet, isWin: false, payout: 0, isProcessed: true };
        const winningNumberColorInfo = NUMBER_COLORS[newResult.winningNumber];

        if (bet.selectedNumber !== null && bet.selectedColor !== null) { // Combined Number and Color bet
          // Wins if the selected number is the winning number AND that number inherently has the selected color.
          if (
            newResult.winningNumber === bet.selectedNumber &&
            (winningNumberColorInfo.primary === bet.selectedColor || (bet.selectedColor === 'VIOLET' && winningNumberColorInfo.violet))
          ) {
            isWin = true;
            payoutAmount = bet.amount * PAYOUT_MULTIPLIERS.NUMBER_AND_COLOR;
          }
        } else if (bet.selectedNumber !== null) { // Number-only bet
          if (bet.selectedNumber === newResult.winningNumber) {
            isWin = true;
            payoutAmount = bet.amount * PAYOUT_MULTIPLIERS.NUMBER;
          }
        } else if (bet.selectedColor !== null) { // Color-only bet
          // Wins if selected color matches the winning number's primary color OR if selected color is Violet and winning number has Violet.
          if (newResult.winningColor === bet.selectedColor || (bet.selectedColor === 'VIOLET' && newResult.winningVioletColor)) {
            isWin = true;
            // Ensure PAYOUT_MULTIPLIERS has keys for 'RED', 'GREEN', 'VIOLET'
            payoutAmount = bet.amount * PAYOUT_MULTIPLIERS[bet.selectedColor as Exclude<ColorOption, null>];
          }
        }

        if (isWin) {
          totalWinningsThisRound += payoutAmount;
          processedBet.isWin = true;
          processedBet.payout = payoutAmount;
        }
        return processedBet;
      });
      
      setActiveBets(updatedBets); 
      const newBalance = currentBalance + totalWinningsThisRound;
      setCurrentBalance(newBalance);
      userBalance = newBalance; 
      
      if (totalWinningsThisRound > 0) {
        toast({ title: "You Won!", description: `Congratulations! You won ₹${totalWinningsThisRound.toFixed(2)} this round.`});
      } else if (activeBets.filter(b => !b.isProcessed && (b.selectedColor || b.selectedNumber !== null)).length > 0) {
        toast({ title: "Round Over", description: "Better luck next time!", variant: "default"});
      }

      setTimeout(() => {
        currentRoundId = Date.now();
        setRound({
          id: currentRoundId.toString(),
          startTime: Date.now(),
          endTime: Date.now() + GAME_ROUND_DURATION_SECONDS * 1000,
          status: 'betting'
        });
        setActiveBets([]); 
        setIsBettingPhase(true);
      }, RESULT_PROCESSING_DURATION_SECONDS * 1000);

    }, 2000); 
  }, [round.id, activeBets, currentBalance, toast]);

  const handleBetPlaced = (betDetails: { color: ColorOption | null, number: NumberOption | null, amount: number }) => {
    if (currentBalance < betDetails.amount) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds to place this bet.", variant: "destructive" });
      return;
    }
    
    const newBet: BetType = {
      id: `bet-${Date.now()}-${Math.random()}`,
      userId: 'currentUser', 
      roundId: round.id,
      selectedColor: betDetails.color,
      selectedNumber: betDetails.number,
      amount: betDetails.amount,
      timestamp: Date.now(),
    };
    setActiveBets(prev => [...prev, newBet]);
    const newBalance = currentBalance - betDetails.amount;
    setCurrentBalance(newBalance);
    userBalance = newBalance; 
  };
  
  useEffect(() => {
    // This effect is primarily for the AppHeader balance update, which is a temporary solution.
    // A proper global state (Context/Jotai/etc.) should be used for balance management.
  }, [currentBalance]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <GameCountdown onTimerEnd={processRoundEnd} isProcessing={!isBettingPhase} roundId={round.id} />
            <BettingArea onBetPlaced={handleBetPlaced} disabled={!isBettingPhase} />
            
            <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-headline text-primary flex items-center">
                        <Info className="mr-2 h-6 w-6" /> Game Rules & Payouts
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>How to Play</AccordionTrigger>
                            <AccordionContent className="space-y-2 text-muted-foreground">
                                <p>1. Predict the outcome of the next round.</p>
                                <p>2. You can bet on a specific Color (Red, Green, Violet), a specific Number (0-9), or both a Number AND its associated Color.</p>
                                <p>3. Enter your bet amount.</p>
                                <p>4. Place your bet before the countdown timer ends.</p>
                                <p>5. If your prediction is correct, you win according to the payout multipliers!</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Bet Types & Payouts</AccordionTrigger>
                            <AccordionContent className="space-y-3 text-muted-foreground">
                                <div>
                                    <strong className="text-foreground">Color Bet:</strong>
                                    <ul className="list-disc list-inside ml-4">
                                        <li>Red / Green: Win x{PAYOUT_MULTIPLIERS.RED} of bet amount.</li>
                                        <li>Violet: Win x{PAYOUT_MULTIPLIERS.VIOLET} of bet amount.</li>
                                    </ul>
                                    <p className="text-xs mt-1">Wins if your chosen color is the primary color of the winning number, or if you chose Violet and the winning number includes Violet.</p>
                                </div>
                                <div>
                                    <strong className="text-foreground">Number Bet:</strong>
                                    <p>Win x{PAYOUT_MULTIPLIERS.NUMBER} of bet amount.</p>
                                    <p className="text-xs mt-1">Wins if your chosen number matches the winning number.</p>
                                </div>
                                <div>
                                    <strong className="text-foreground">Number AND Color Bet:</strong>
                                    <p>Win x{PAYOUT_MULTIPLIERS.NUMBER_AND_COLOR} of bet amount.</p>
                                    <p className="text-xs mt-1">Wins if your chosen number matches the winning number AND that number inherently possesses the color you selected (e.g., betting on Number '2' and 'RED').</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Numbers & Their Colors</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <ul className="list-disc list-inside space-y-1">
                                    <li><span className="text-red-500 font-semibold">0: Red</span> + <span className="text-purple-500 font-semibold">Violet</span></li>
                                    <li><span className="text-green-500 font-semibold">1: Green</span></li>
                                    <li><span className="text-red-500 font-semibold">2: Red</span></li>
                                    <li><span className="text-green-500 font-semibold">3: Green</span></li>
                                    <li><span className="text-red-500 font-semibold">4: Red</span></li>
                                    <li><span className="text-green-500 font-semibold">5: Green</span> + <span className="text-purple-500 font-semibold">Violet</span></li>
                                    <li><span className="text-red-500 font-semibold">6: Red</span></li>
                                    <li><span className="text-green-500 font-semibold">7: Green</span></li>
                                    <li><span className="text-red-500 font-semibold">8: Red</span></li>
                                    <li><span className="text-green-500 font-semibold">9: Green</span></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4">
                            <AccordionTrigger className="text-destructive/80 hover:text-destructive">
                                <AlertCircle className="mr-2 h-5 w-5 text-destructive/80" /> Important Notes
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 text-muted-foreground">
                               <p>Minimum bet amount: ₹{MIN_BET_AMOUNT}.</p>
                               <p>Bets are final once placed.</p>
                               <p>Play responsibly. This is a game of chance.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

          </div>
          <div className="lg:col-span-1 space-y-6 lg:space-y-8">
            <ResultsDisplay currentResult={currentResult} history={resultHistory} />
            <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-headline text-primary">My Active Bets</CardTitle>
                    <CardDescription>Bets placed in the current round.</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeBets.filter(b => !b.isProcessed && (b.selectedColor || b.selectedNumber !== null)).length > 0 ? (
                        <ScrollArea className="h-[150px]">
                        <ul className="space-y-2">
                            {activeBets.filter(b => !b.isProcessed && (b.selectedColor || b.selectedNumber !== null)).map(bet => {
                                let selectionText = "";
                                if (bet.selectedNumber !== null && bet.selectedColor !== null) {
                                    selectionText = `No. ${bet.selectedNumber} & ${bet.selectedColor}`;
                                } else if (bet.selectedNumber !== null) {
                                    selectionText = `No. ${bet.selectedNumber}`;
                                } else if (bet.selectedColor !== null) {
                                    selectionText = `${bet.selectedColor}`;
                                }
                                return (
                                <li key={bet.id} className="text-sm p-2 bg-background/50 rounded-md flex justify-between">
                                    <span>{selectionText}</span>
                                    <span className="font-semibold">₹{bet.amount}</span>
                                </li>
                                );
                            })}
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
