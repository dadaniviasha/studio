
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { BettingArea } from '@/components/game/BettingArea';
import { ResultsDisplay } from '@/components/game/ResultsDisplay';
import { GameCountdown } from '@/components/game/GameCountdown';
import type { GameResult, Bet as BetType, GameRound, BetSubmission, ColorOption, NumberOption } from '@/lib/types';
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

// Placeholder sound data URIs (silent WAV)
const SILENT_SOUND_PLACEHOLDER = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVAAAAHYAAABACAA';


const playSound = (soundSrc: string) => {
  if (typeof window !== 'undefined') {
    const audio = new Audio(soundSrc);
    audio.play().catch(error => console.warn("Audio play failed:", error)); // Warn instead of error for placeholders
  }
};


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

  const betPlacedSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio elements client-side
    if (typeof window !== 'undefined') {
        betPlacedSoundRef.current = new Audio(SILENT_SOUND_PLACEHOLDER /* Replace with '/sounds/bet-placed.mp3' */);
        winSoundRef.current = new Audio(SILENT_SOUND_PLACEHOLDER /* Replace with '/sounds/win.mp3' */);
        loseSoundRef.current = new Audio(SILENT_SOUND_PLACEHOLDER /* Replace with '/sounds/lose.mp3' */);
        
        // Preload audio
        betPlacedSoundRef.current.preload = "auto";
        winSoundRef.current.preload = "auto";
        loseSoundRef.current.preload = "auto";
    }
  }, []);

  const playLocalSound = (soundRef: React.RefObject<HTMLAudioElement>) => {
    soundRef.current?.play().catch(error => console.warn("Audio play failed:", error));
  };


  const processRoundEnd = useCallback(() => {
    setIsBettingPhase(false);
    setRound(prev => ({ ...prev, status: 'processing' }));

    setTimeout(() => {
      const winningNumber = Math.floor(Math.random() * 10) as NumberOption;
      const colorInfo = NUMBER_COLORS[winningNumber];
      
      const newResult: GameResult = {
        roundId: round.id,
        winningNumber,
        winningColor: colorInfo.primary, 
        winningVioletColor: colorInfo.violet, 
        timestamp: Date.now(),
        finalizedBy: 'random', 
      };

      setCurrentResult(newResult);
      setResultHistory(prev => [newResult, ...prev.slice(0, 9)]); 

      let totalWinningsThisRound = 0;
      let anyBetWon = false;
      const betsPlacedThisRound = activeBets.filter(bet => bet.roundId === round.id && !bet.isProcessed);

      const updatedBets = activeBets.map(bet => {
        if (bet.roundId !== round.id || bet.isProcessed) return bet; // Process only current round's unprocessed bets

        let isWin = false;
        let payoutAmount = 0;
        const processedBet = { ...bet, isWin: false, payout: 0, isProcessed: true };
        
        // Number-only bet processing
        if (bet.selectedNumber !== null) { 
          if (bet.selectedNumber === newResult.winningNumber) {
            isWin = true;
            payoutAmount = bet.amount * PAYOUT_MULTIPLIERS.NUMBER;
          }
        } 
        // Color-only bet processing
        else if (bet.selectedColor !== null) { 
          if (newResult.winningColor === bet.selectedColor || (bet.selectedColor === 'VIOLET' && newResult.winningVioletColor)) {
            isWin = true;
            payoutAmount = bet.amount * PAYOUT_MULTIPLIERS[bet.selectedColor as Exclude<ColorOption, null>];
          }
        }

        if (isWin) {
          totalWinningsThisRound += payoutAmount;
          processedBet.isWin = true;
          processedBet.payout = payoutAmount;
          anyBetWon = true;
        }
        return processedBet;
      });
      
      setActiveBets(updatedBets); 
      const newBalance = currentBalance + totalWinningsThisRound;
      setCurrentBalance(newBalance);
      userBalance = newBalance; 
      
      if (anyBetWon) {
        toast({ 
            title: "🎉 You Won! 🎉", 
            description: `Congratulations! You won a total of ₹${totalWinningsThisRound.toFixed(2)} this round.`,
            variant: "default", // Using default, could be styled more uniquely
        });
        playLocalSound(winSoundRef);
      } else if (betsPlacedThisRound.length > 0) { // Only show "lose" if bets were actually placed
        toast({ 
            title: "Round Over", 
            description: "No wins this time. Better luck next round!", 
            variant: "default" // Using default, could be styled more uniquely
        });
        playLocalSound(loseSoundRef);
      }

      setTimeout(() => {
        currentRoundId = Date.now();
        setRound({
          id: currentRoundId.toString(),
          startTime: Date.now(),
          endTime: Date.now() + GAME_ROUND_DURATION_SECONDS * 1000,
          status: 'betting'
        });
        // Clear only processed bets related to the completed round or all active bets if desired
        setActiveBets(prev => prev.filter(bet => !bet.isProcessed || bet.roundId !== newResult.roundId)); 
        setIsBettingPhase(true);
      }, RESULT_PROCESSING_DURATION_SECONDS * 1000);

    }, 2000); 
  }, [round.id, activeBets, currentBalance, toast]);

  const handleBetPlaced = (submission: BetSubmission) => {
    let totalAmountToBet = 0;
    if (submission.colorBet) totalAmountToBet += submission.colorBet.amount;
    if (submission.numberBet) totalAmountToBet += submission.numberBet.amount;

    if (currentBalance < totalAmountToBet) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds to place these bets.", variant: "destructive" });
      return;
    }
    
    const newActiveBets: BetType[] = [];
    let betDescriptions: string[] = [];

    if (submission.colorBet) {
      const colorBetAmount = submission.colorBet.amount;
      if (colorBetAmount >= MIN_BET_AMOUNT) {
        newActiveBets.push({
          id: `bet-color-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: 'currentUser',
          roundId: round.id,
          selectedColor: submission.colorBet.color,
          selectedNumber: null,
          amount: colorBetAmount,
          timestamp: Date.now(),
        });
        betDescriptions.push(`₹${colorBetAmount} on ${submission.colorBet.color}`);
      }
    }

    if (submission.numberBet) {
      const numberBetAmount = submission.numberBet.amount;
      if (numberBetAmount >= MIN_BET_AMOUNT) {
        newActiveBets.push({
          id: `bet-number-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: 'currentUser',
          roundId: round.id,
          selectedColor: null,
          selectedNumber: submission.numberBet.number,
          amount: numberBetAmount,
          timestamp: Date.now(),
        });
        betDescriptions.push(`₹${numberBetAmount} on Number ${submission.numberBet.number}`);
      }
    }

    if (newActiveBets.length === 0) {
      // This case should ideally be caught by BettingArea's validation, but good to have a fallback.
      toast({ title: "No Valid Bets Placed", description: `Ensure valid selections and amounts (min ₹${MIN_BET_AMOUNT}).`, variant: "destructive" });
      return;
    }

    setActiveBets(prev => [...prev, ...newActiveBets]);
    const newBal = currentBalance - totalAmountToBet;
    setCurrentBalance(newBal);
    userBalance = newBal;

    toast({ title: "Bets Placed!", description: betDescriptions.join(' & ') + '.' });
    playLocalSound(betPlacedSoundRef);
  };
  
  useEffect(() => {
    // This effect is primarily for the AppHeader balance update, which is a temporary solution.
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
                                <p>2. You can bet on a specific Color (Red, Green, Violet) and/or a specific Number (0-9). Bets on color and number are independent and can have different amounts.</p>
                                <p>3. Enter your bet amount(s) for your selection(s).</p>
                                <p>4. Place your bet(s) before the countdown timer ends.</p>
                                <p>5. If your prediction is correct, you win according to the payout multipliers for each winning bet!</p>
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
                                 <p className="italic">Note: Bets on color and number are independent. You can win one, both, or neither.</p>
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
                               <p>Minimum bet amount for each bet (color or number): ₹{MIN_BET_AMOUNT}.</p>
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
                    {activeBets.filter(b => !b.isProcessed && b.roundId === round.id).length > 0 ? (
                        <ScrollArea className="h-[150px]">
                        <ul className="space-y-2">
                            {activeBets.filter(b => !b.isProcessed && b.roundId === round.id).map(bet => {
                                let selectionText = "";
                                if (bet.selectedNumber !== null) {
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
