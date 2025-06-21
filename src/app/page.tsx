
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { BettingArea } from '@/components/game/BettingArea';
import { ResultsDisplay } from '@/components/game/ResultsDisplay';
import { GameCountdown } from '@/components/game/GameCountdown';
import type { GameResult, Bet as BetType, GameRound, BetSubmission, ColorOption, NumberOption } from '@/lib/types';
import { NUMBER_COLORS, ADMIN_COMMISSION_RATE, RESULT_PROCESSING_DURATION_SECONDS, GAME_ROUND_DURATION_SECONDS, MIN_BET_AMOUNT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Info, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Dummy data and simulation logic
let currentRoundId = Date.now();
const initialBets: BetType[] = [];

// Placeholder sound data URIs (silent WAV)
const SILENT_SOUND_PLACEHOLDER = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVAAAAHYAAABACAA';

const GUEST_USER_ID = "guest_user";
const GUEST_INITIAL_BALANCE = 200; // Give guests some play money
const ADMIN_RESULT_STORAGE_KEY = 'CROTOS_ADMIN_RESULT_OVERRIDE';


export default function HomePage() {
  const { currentUser, updateBalance: updateAuthBalance, loading: authLoading } = useAuth();
  const [currentResult, setCurrentResult] = useState<GameResult | null>(null);
  const [resultHistory, setResultHistory] = useState<GameResult[]>([]);
  const [isBettingPhase, setIsBettingPhase] = useState(true);
  const [activeBets, setActiveBets] = useState<BetType[]>(initialBets);
  
  const [currentDisplayedBalance, setCurrentDisplayedBalance] = useState<number>(GUEST_INITIAL_BALANCE);
  
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
    if (!authLoading) {
      if (currentUser) {
        setCurrentDisplayedBalance(currentUser.walletBalance);
      } else {
        setCurrentDisplayedBalance(GUEST_INITIAL_BALANCE);
      }
    }
  }, [currentUser, authLoading]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        betPlacedSoundRef.current = new Audio(SILENT_SOUND_PLACEHOLDER /* Replace with '/sounds/bet-placed.mp3' in public/sounds/ */);
        winSoundRef.current = new Audio(SILENT_SOUND_PLACEHOLDER /* Replace with '/sounds/win.mp3' in public/sounds/ */);
        loseSoundRef.current = new Audio(SILENT_SOUND_PLACEHOLDER /* Replace with '/sounds/lose.mp3' in public/sounds/ */);
        
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
      let newResult: GameResult | null = null;
      
      // --- REVISED RESULT DETERMINATION LOGIC ---
      const adminDefinedResultString = localStorage.getItem(ADMIN_RESULT_STORAGE_KEY);
      
      if (adminDefinedResultString) {
        try {
          const adminResult = JSON.parse(adminDefinedResultString);
          if (adminResult.winningNumber !== undefined && adminResult.winningColor) {
            newResult = {
              roundId: round.id,
              winningNumber: adminResult.winningNumber,
              winningColor: adminResult.winningColor,
              timestamp: Date.now(),
              finalizedBy: 'admin',
            };
            // IMPORTANT: Remove item only after successfully using it.
            localStorage.removeItem(ADMIN_RESULT_STORAGE_KEY); 
          }
        } catch (error) {
          console.error("Error parsing admin result. Falling back to random:", error);
          // Clean up invalid data from storage
          localStorage.removeItem(ADMIN_RESULT_STORAGE_KEY);
        }
      }

      if (!newResult) {
        // Default to random generation if no admin result was found or if it was invalid
        const winningNumber = Math.floor(Math.random() * 10) as NumberOption;
        let determinedWinningColor: ColorOption;
  
        if (winningNumber === 0 || winningNumber === 5) {
          determinedWinningColor = 'VIOLET';
        } else {
          const availableColors: ColorOption[] = ['RED', 'GREEN', 'VIOLET'];
          determinedWinningColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        }
        
        newResult = {
          roundId: round.id,
          winningNumber,
          winningColor: determinedWinningColor,
          timestamp: Date.now(),
          finalizedBy: 'random', 
        };
      }
      // --- END OF REVISED LOGIC ---

      setCurrentResult(newResult);
      setResultHistory(prev => [newResult!, ...prev.slice(0, 9)]); 

      // --- NEW PARIMUTUEL PAYOUT LOGIC ---
      const betsPlacedThisRound = activeBets.filter(bet => bet.roundId === round.id && !bet.isProcessed);
      const totalBetAmountThisRound = betsPlacedThisRound.reduce((sum, bet) => sum + bet.amount, 0);
      const prizePool = totalBetAmountThisRound * (1 - ADMIN_COMMISSION_RATE);

      const winningBets = betsPlacedThisRound.filter(bet => {
          if (bet.selectedNumber !== null && bet.selectedNumber === newResult!.winningNumber) return true;
          if (bet.selectedColor !== null && bet.selectedColor === newResult!.winningColor) return true;
          return false;
      });

      const totalWinningBetAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
      let totalPayoutsThisRound = 0;
      let anyBetWon = winningBets.length > 0;
      
      const updatedBets = activeBets.map(bet => {
        if (bet.roundId !== round.id || bet.isProcessed) return bet; 

        const isWinner = winningBets.some(winningBet => winningBet.id === bet.id);
        const processedBet = { ...bet, isWin: false, payout: 0, isProcessed: true };
        
        if (isWinner) {
            let payoutAmount = 0;
            // Distribute the prize pool proportionally among winners.
            if (totalWinningBetAmount > 0) {
                payoutAmount = (bet.amount / totalWinningBetAmount) * prizePool;
            }
            
            totalPayoutsThisRound += payoutAmount;
            processedBet.isWin = true;
            processedBet.payout = payoutAmount;
        }
        return processedBet;
      });

      setActiveBets(updatedBets); 
      
      const newBalance = currentDisplayedBalance + totalPayoutsThisRound;
      if (currentUser) {
        updateAuthBalance(newBalance); 
      }
      setCurrentDisplayedBalance(newBalance); 
      
      if (anyBetWon) {
        toast({ 
            title: "🎉 Congratulations! 🎉", 
            description: `A total of ₹${totalPayoutsThisRound.toFixed(2)} was paid out to winners this round.`,
            variant: "default", 
            duration: 5000,
        });
        playLocalSound(winSoundRef);
      } else if (betsPlacedThisRound.length > 0) { 
        toast({ 
            title: "💔 Round Over - No Wins 💔", 
            description: "No wins this time. Better luck next round!", 
            variant: "default",
            duration: 5000,
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
        setActiveBets(prev => prev.filter(bet => !bet.isProcessed || bet.roundId !== newResult!.roundId)); 
        setIsBettingPhase(true);
      }, RESULT_PROCESSING_DURATION_SECONDS * 1000);

    }, 2000); 
  }, [round.id, activeBets, currentDisplayedBalance, toast, currentUser, updateAuthBalance]);

  const handleBetPlaced = (submission: BetSubmission) => {
    if (!currentUser && (!submission.colorBet && !submission.numberBet)) {
      toast({ title: "Please Login", description: "You need to login or sign up to place bets.", variant: "destructive" });
      return;
    }

    let totalAmountToBet = 0;
    if (submission.colorBet) totalAmountToBet += submission.colorBet.amount;
    if (submission.numberBet) totalAmountToBet += submission.numberBet.amount;

    if (currentDisplayedBalance < totalAmountToBet) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds to place these bets.", variant: "destructive" });
      return;
    }
    
    const newActiveBets: BetType[] = [];
    let betDescriptions: string[] = [];
    const userIdToUse = currentUser ? currentUser.id : GUEST_USER_ID;

    if (submission.colorBet) {
      const colorBetAmount = submission.colorBet.amount;
      if (colorBetAmount >= MIN_BET_AMOUNT) {
        newActiveBets.push({
          id: `bet-color-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          userId: userIdToUse,
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
          userId: userIdToUse,
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
      toast({ title: "No Valid Bets Placed", description: `Ensure valid selections and amounts (min ₹${MIN_BET_AMOUNT}).`, variant: "destructive" });
      return;
    }

    setActiveBets(prev => [...prev, ...newActiveBets]);
    const newBal = currentDisplayedBalance - totalAmountToBet;
    
    if (currentUser) {
      updateAuthBalance(newBal); 
    }
    setCurrentDisplayedBalance(newBal); 


    toast({ title: "Bets Placed!", description: betDescriptions.join(' & ') + '.' });
    playLocalSound(betPlacedSoundRef);
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            <GameCountdown onTimerEnd={processRoundEnd} isProcessing={!isBettingPhase} roundId={round.id} />
            <BettingArea 
              onBetPlaced={handleBetPlaced} 
              disabled={!isBettingPhase || (authLoading)} 
              isLoggedIn={!!currentUser}
            />
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
                                <p>5. If your prediction is correct, you win a share of the prize pool!</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Payout System</AccordionTrigger>
                            <AccordionContent className="space-y-3 text-muted-foreground">
                                <p>This game uses a <strong>parimutuel betting system</strong>. An admin commission of 30% is taken from the total betting pool each round. The remaining 70% forms the prize pool which is distributed among all winning bets.</p>
                                <p className="font-semibold mt-2">Your payout depends on how much you bet and how much others bet on the winning option. It is not a fixed multiplier.</p>
                                <p className="text-xs mt-2 italic">
                                  <strong>Example:</strong> The total bets in a round are ₹1000. The prize pool is ₹700 (70%). Total bets on the winning option (e.g., RED) are ₹500. If you bet ₹100 on RED, your payout is (100/500) * 700 = ₹140.
                                </p>
                                <div className="mt-4">
                                    <strong className="text-foreground">Special Condition for Numbers 0 & 5:</strong>
                                    <p className="text-xs mt-1">If the winning number is 0 or 5, the Winning Color for the round is automatically VIOLET. Bets on VIOLET will win, and bets on RED or GREEN will lose in this specific scenario.</p>
                                </div>
                                 <p className="italic">Note: Bets on color and number are independent. You can win on your color bet, your number bet, both, or neither.</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Numbers & Their Visual Appearance</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <p className="text-sm mb-2">The colors below are for visual styling of the number balls only and do not determine the round's winning color for betting purposes, except for the special 0/5 rule noted above.</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><span className="text-red-500 font-semibold">0: Styled Red</span> + <span className="text-purple-500 font-semibold">Violet</span> (If 0 wins, round color is VIOLET)</li>
                                    <li><span className="text-green-500 font-semibold">1: Styled Green</span></li>
                                    <li><span className="text-red-500 font-semibold">2: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">3: Styled Green</span></li>
                                    <li><span className="text-red-500 font-semibold">4: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">5: Styled Green</span> + <span className="text-purple-500 font-semibold">Violet</span> (If 5 wins, round color is VIOLET)</li>
                                    <li><span className="text-red-500 font-semibold">6: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">7: Styled Green</span></li>
                                    <li><span className="text-red-500 font-semibold">8: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">9: Styled Green</span></li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="item-4">
                            <AccordionTrigger className="text-destructive/80 hover:text-destructive">
                                <AlertCircle className="mr-2 h-5 w-5 text-destructive/80" /> Important Notes
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 text-muted-foreground">
                               <p className="font-bold text-destructive">This is a prototype application. No real money is involved.</p>
                               <p>Minimum bet amount for each bet type (color or number): ₹{MIN_BET_AMOUNT}.</p>
                               <p>Bets are final once placed.</p>
                               <p>Play responsibly. This is a game of chance.</p>
                               <p>You must be logged in to track your balance and winnings properly. Bets made as a guest are for fun only and won't be saved.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
