
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppFooter } from '@/components/layout/AppFooter';
import { BettingArea } from '@/components/game/BettingArea';
import { ResultsDisplay } from '@/components/game/ResultsDisplay';
import { GameCountdown } from '@/components/game/GameCountdown';
import type { GameResult, Bet as BetType, GameRound, BetSubmission, ColorOption, NumberOption } from '@/lib/types';
import { NUMBER_COLORS, PAYOUT_MULTIPLIERS, RESULT_PROCESSING_DURATION_SECONDS, GAME_ROUND_DURATION_SECONDS, MIN_BET_AMOUNT } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

// Placeholder sound data URIs (silent WAV)
const SILENT_SOUND_PLACEHOLDER = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAVAAAAHYAAABACAA';

const GUEST_USER_ID = "guest_user";
const GUEST_INITIAL_BALANCE = 200; // Give guests some play money
const ADMIN_RESULT_STORAGE_KEY = 'CROTOS_ADMIN_RESULT_OVERRIDE';
const ROUND_ID_STORAGE_KEY = 'CROTOS_CURRENT_ROUND_ID'; // Kept for admin panel compatibility
const ACTIVE_BETS_STORAGE_KEY = 'CROTOS_ACTIVE_BETS';
const ROUND_STORAGE_KEY = 'CROTOS_CURRENT_ROUND';
const ROUND_COUNTER_STORAGE_KEY = 'CROTOS_ROUND_COUNTER'; // For sequential round IDs

export default function HomePage() {
  const { currentUser, updateBalance: updateAuthBalance, loading: authLoading } = useAuth();
  const [currentResult, setCurrentResult] = useState<GameResult | null>(null);
  const [resultHistory, setResultHistory] = useState<GameResult[]>([]);
  const [isBettingPhase, setIsBettingPhase] = useState(true);

  // Initialize state with server-safe defaults to prevent hydration errors
  const [activeBets, setActiveBets] = useState<BetType[]>([]);
  const [round, setRound] = useState<GameRound>({
    id: '...',
    startTime: 0,
    endTime: 0,
    status: 'betting'
  });

  const [currentDisplayedBalance, setCurrentDisplayedBalance] = useState<number>(GUEST_INITIAL_BALANCE);
  
  // Create refs to hold the latest values of state, preventing the timer from resetting.
  const activeBetsRef = useRef(activeBets);
  useEffect(() => {
    activeBetsRef.current = activeBets;
  }, [activeBets]);

  const currentDisplayedBalanceRef = useRef(currentDisplayedBalance);
  useEffect(() => {
    currentDisplayedBalanceRef.current = currentDisplayedBalance;
  }, [currentDisplayedBalance]);

  const processingEndRef = useRef(false); // Ref to prevent duplicate round end processing

  const { toast } = useToast();

  const roundRef = useRef(round);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  const betPlacedSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);

  // This effect runs only on the client after the initial render to safely access localStorage
  useEffect(() => {
    // Function to get the round state from localStorage or create a new one
    const getInitialRound = (): GameRound => {
      try {
        const storedRoundJSON = localStorage.getItem(ROUND_STORAGE_KEY);
        if (storedRoundJSON) {
          const storedRound: GameRound = JSON.parse(storedRoundJSON);
          if (storedRound.endTime > Date.now()) {
            return storedRound;
          }
        }
      } catch (error) {
        console.error("Failed to load round from localStorage", error);
        localStorage.removeItem(ROUND_STORAGE_KEY);
      }
      
      // If we are here, we need a new round. Let's get/increment the counter.
      const storedCounterStr = localStorage.getItem(ROUND_COUNTER_STORAGE_KEY);
      const currentCounter = storedCounterStr ? parseInt(storedCounterStr, 10) : 0;
      const newCounter = currentCounter + 1;
      localStorage.setItem(ROUND_COUNTER_STORAGE_KEY, newCounter.toString());
      
      const newRound: GameRound = {
        id: `${newCounter}`,
        startTime: Date.now(),
        endTime: Date.now() + GAME_ROUND_DURATION_SECONDS * 1000,
        status: 'betting'
      };
      localStorage.setItem(ROUND_STORAGE_KEY, JSON.stringify(newRound));
      return newRound;
    };

    // Function to get active bets from localStorage
    const getInitialActiveBets = (): BetType[] => {
      try {
        const storedBets = localStorage.getItem(ACTIVE_BETS_STORAGE_KEY);
        return storedBets ? JSON.parse(storedBets) : [];
      } catch (error) {
        console.error("Could not load active bets from localStorage:", error);
        localStorage.removeItem(ACTIVE_BETS_STORAGE_KEY);
        return [];
      }
    };
    
    setRound(getInitialRound());
    setActiveBets(getInitialActiveBets());
  }, []);


  useEffect(() => {
    if (!authLoading) {
      if (currentUser) {
        setCurrentDisplayedBalance(currentUser.walletBalance);
      } else {
        setCurrentDisplayedBalance(GUEST_INITIAL_BALANCE);
      }
    }
  }, [currentUser, authLoading]);

  // This effect syncs the entire round object to localStorage whenever it changes.
  // This makes the timer persistent across page navigations.
  useEffect(() => {
    // Only run on client after initial state has been set
    if (round.startTime === 0) return;
    try {
      localStorage.setItem(ROUND_STORAGE_KEY, JSON.stringify(round));
      // For compatibility with the admin panel, also set the simple ID key
      localStorage.setItem(ROUND_ID_STORAGE_KEY, round.id);
    } catch (error) {
      console.error("Could not save round state to localStorage:", error);
    }
  }, [round]);

  // This effect syncs the active bets to localStorage whenever they change.
  // This allows other components/pages (like the admin panel) to view them.
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_BETS_STORAGE_KEY, JSON.stringify(activeBets));
    } catch (error) {
      console.error("Could not save active bets to localStorage:", error);
    }
  }, [activeBets]);


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
    if (processingEndRef.current) return; // Guard against multiple calls
    processingEndRef.current = true; // Set flag to indicate processing has started

    setIsBettingPhase(false);
    setRound(prev => ({ ...prev, status: 'processing' }));

    setTimeout(() => {
      let newResult: GameResult | null = null;
      
      const adminDefinedResultString = localStorage.getItem(ADMIN_RESULT_STORAGE_KEY);
      
      if (adminDefinedResultString) {
        try {
          const adminResult = JSON.parse(adminDefinedResultString);
          // Add a much more robust check on the parsed object
          const isValidNumber = typeof adminResult.winningNumber === 'number' && adminResult.winningNumber >= 0 && adminResult.winningNumber <= 9;
          const isValidColor = typeof adminResult.winningColor === 'string' && ['RED', 'GREEN', 'VIOLET'].includes(adminResult.winningColor);

          if (isValidNumber && isValidColor) {
            console.log("Applying admin-defined result:", adminResult);
            newResult = {
              roundId: roundRef.current.id,
              winningNumber: adminResult.winningNumber,
              winningColor: adminResult.winningColor,
              timestamp: Date.now(),
              finalizedBy: 'admin',
            };
          } else {
             console.warn("Invalid admin result found in localStorage. Falling back to random.", adminResult);
          }
        } catch (error) {
          console.error("Error parsing admin result. Falling back to random:", error);
        } finally {
            // Always remove the key after attempting to use it.
            localStorage.removeItem(ADMIN_RESULT_STORAGE_KEY);
        }
      }

      // If no valid admin result was created, generate a random one.
      if (!newResult) {
        console.log("Generating random result.");
        const winningNumber = Math.floor(Math.random() * 10) as NumberOption;
        const availableColors: ColorOption[] = ['RED', 'GREEN', 'VIOLET'];
        const determinedWinningColor = availableColors[Math.floor(Math.random() * availableColors.length)];
        
        newResult = {
          roundId: roundRef.current.id,
          winningNumber,
          winningColor: determinedWinningColor,
          timestamp: Date.now(),
          finalizedBy: 'random', 
        };
      }

      setCurrentResult(newResult);
      setResultHistory(prev => [newResult!, ...prev.slice(0, 9)]); 

      // --- NEW FIXED-ODDS PAYOUT LOGIC ---
      const betsPlacedThisRound = activeBetsRef.current.filter(bet => bet.roundId === roundRef.current.id && !bet.isProcessed);
      let totalWinningsThisRound = 0;
      
      const updatedBets = activeBetsRef.current.map(bet => {
        if (bet.roundId !== roundRef.current.id || bet.isProcessed) return bet;

        let isWinner = false;
        let payoutMultiplier = 0;
        
        if (bet.selectedColor !== null && bet.selectedColor === newResult!.winningColor) {
            isWinner = true;
            payoutMultiplier = PAYOUT_MULTIPLIERS[bet.selectedColor];
        }
        if (bet.selectedNumber !== null && bet.selectedNumber === newResult!.winningNumber) {
            isWinner = true;
            // Number bets have their own multiplier and win independently.
            // If user also won on color, we add this win on top.
            payoutMultiplier += PAYOUT_MULTIPLIERS.NUMBER;
        }

        const processedBet = { ...bet, isWin: false, payout: 0, isProcessed: true };
        
        if (isWinner) {
            // Recalculate payout for each winning condition if both are met
            let payoutAmount = 0;
            if (bet.selectedColor === newResult!.winningColor) {
                payoutAmount += bet.amount * PAYOUT_MULTIPLIERS[bet.selectedColor];
            }
            if (bet.selectedNumber === newResult!.winningNumber) {
                payoutAmount += bet.amount * PAYOUT_MULTIPLIERS.NUMBER;
            }

            totalWinningsThisRound += payoutAmount;
            processedBet.isWin = true;
            processedBet.payout = payoutAmount;
        }
        return processedBet;
      });
      
      setActiveBets(updatedBets); 
      
      const newBalance = currentDisplayedBalanceRef.current + totalWinningsThisRound;
      if (currentUser) {
        updateAuthBalance(newBalance); 
      }
      setCurrentDisplayedBalance(newBalance); 
      
      if (totalWinningsThisRound > 0) {
        toast({ 
            title: "🎉 Congratulations! 🎉", 
            description: `You won a total of ₹${totalWinningsThisRound.toFixed(2)} this round.`,
            variant: "default", 
            duration: 5000,
        });
        playLocalSound(winSoundRef);
      } else if (betsPlacedThisRound.length > 0) { 
        toast({ 
            title: "💔 Round Over 💔", 
            description: "No wins this time. Better luck next round!", 
            variant: "default",
            duration: 5000,
        });
        playLocalSound(loseSoundRef);
      }

      setTimeout(() => {
        const storedCounterStr = localStorage.getItem(ROUND_COUNTER_STORAGE_KEY);
        const currentCounter = storedCounterStr ? parseInt(storedCounterStr, 10) : 0;
        const newCounter = currentCounter + 1;
        localStorage.setItem(ROUND_COUNTER_STORAGE_KEY, newCounter.toString());
        
        const newRoundId = `${newCounter}`;
        
        setRound({
          id: newRoundId,
          startTime: Date.now(),
          endTime: Date.now() + GAME_ROUND_DURATION_SECONDS * 1000,
          status: 'betting'
        });
        setActiveBets(prev => prev.filter(bet => !bet.isProcessed || bet.roundId !== newResult!.roundId)); 
        setIsBettingPhase(true);
        processingEndRef.current = false; // Reset flag for the next round
      }, RESULT_PROCESSING_DURATION_SECONDS * 1000);

    }, 2000); 
  }, [toast, currentUser, updateAuthBalance]);

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
            <GameCountdown 
                onTimerEnd={processRoundEnd} 
                isProcessing={!isBettingPhase} 
                roundId={round.id} 
                endTime={round.endTime} 
            />
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
             <Card className="shadow-xl bg-gradient-to-br from-accent to-primary text-accent-foreground">
                <CardHeader>
                    <CardTitle className="text-xl font-headline flex items-center">
                        <Gift className="mr-2 h-6 w-6" /> Special Promotion
                    </CardTitle>
                    <CardDescription className="text-accent-foreground/80">
                      Available for new players!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>New to Crotos? Get a <strong className="font-bold">₹50 welcome bonus</strong> when you sign up to get started!</p>
                </CardContent>
                <CardFooter>
                    {!currentUser ? (
                      <Link href="/signup" className="w-full">
                          <Button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold backdrop-blur-sm">
                            Sign Up & Claim Bonus
                          </Button>
                      </Link>
                    ) : (
                       <p className="text-xs text-accent-foreground/90">Welcome! Your bonus has been added to your wallet.</p>
                    )}
                </CardFooter>
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
                                <p>5. If your prediction is correct, you win based on a fixed multiplier!</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>Payout System</AccordionTrigger>
                            <AccordionContent className="space-y-3 text-muted-foreground">
                                <p>This game uses a <strong>fixed-odds payout system</strong>. Your winnings are calculated by multiplying your bet amount by a fixed multiplier for each bet type.</p>
                                <ul className="list-disc list-inside space-y-2 mt-2">
                                  <li><strong className="text-foreground">Bet on Red or Green:</strong> Win <strong className="text-primary">{PAYOUT_MULTIPLIERS.RED}x</strong> your bet amount. (e.g., ₹10 wins ₹19).</li>
                                  <li><strong className="text-foreground">Bet on Violet:</strong> Win <strong className="text-primary">{PAYOUT_MULTIPLIERS.VIOLET}x</strong> your bet amount. (e.g., ₹10 wins ₹45).</li>
                                  <li><strong className="text-foreground">Bet on a Number:</strong> Win <strong className="text-primary">{PAYOUT_MULTIPLIERS.NUMBER}x</strong> your bet amount. (e.g., ₹10 wins ₹90).</li>
                                </ul>
                                <p className="italic mt-3">Note: Bets on color and number are independent. You can win on your color bet, your number bet, both, or neither in the same round.</p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Numbers & Their Visual Appearance</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                <p className="text-sm mb-2">The colors below are for visual styling of the number balls only and do not determine the round's winning color for betting purposes.</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li><span className="text-red-500 font-semibold">0: Styled Red</span> + <span className="text-purple-500 font-semibold">Violet</span></li>
                                    <li><span className="text-green-500 font-semibold">1: Styled Green</span></li>
                                    <li><span className="text-red-500 font-semibold">2: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">3: Styled Green</span></li>
                                    <li><span className="text-red-500 font-semibold">4: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">5: Styled Green</span> + <span className="text-purple-500 font-semibold">Violet</span></li>
                                    <li><span className="text-red-500 font-semibold">6: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">7: Styled Green</span></li>
                                    <li><span className="text-red-500 font-semibold">8: Styled Red</span></li>
                                    <li><span className="text-green-500 font-semibold">9: Styled Green</span></li>
                                </ul>
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

    