
"use client";

import { useState } from 'react';
import { DollarSign, Zap, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import type { ColorOption, NumberOption, BetSubmission } from '@/lib/types';
import { MIN_BET_AMOUNT } from '@/lib/constants';
import { ColorButton } from './ColorButton';
import { NumberButton } from './NumberButton';
import Link from 'next/link';

interface BettingAreaProps {
  onBetPlaced: (submission: BetSubmission) => void;
  disabled?: boolean;
  isLoggedIn: boolean;
}

export function BettingArea({ onBetPlaced, disabled, isLoggedIn }: BettingAreaProps) {
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<NumberOption | null>(null);
  const [colorBetAmount, setColorBetAmount] = useState<string>('');
  const [numberBetAmount, setNumberBetAmount] = useState<string>('');
  const { toast } = useToast();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'color' | 'number') => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { 
      if (type === 'color') {
        setColorBetAmount(value);
      } else {
        setNumberBetAmount(value);
      }
    }
  };

  const handleQuickBet = (amount: number, type: 'color' | 'number') => {
    if (type === 'color') setColorBetAmount(amount.toString());
    else setNumberBetAmount(amount.toString());
  };

  const toggleColorSelection = (color: ColorOption) => {
    setSelectedColor(prev => prev === color ? null : color);
    if (colorBetAmount === '' && (selectedColor === null || selectedColor !== color) ) setColorBetAmount(MIN_BET_AMOUNT.toString());
    if (selectedColor === color && colorBetAmount !== '') setColorBetAmount(''); 
  };

  const toggleNumberSelection = (number: NumberOption) => {
    setSelectedNumber(prev => prev === number ? null : number);
     if (numberBetAmount === '' && (selectedNumber === null || selectedNumber !== number)) setNumberBetAmount(MIN_BET_AMOUNT.toString());
     if (selectedNumber === number && numberBetAmount !== '') setNumberBetAmount(''); 
  };

  const handlePlaceBet = () => {
    if (!isLoggedIn) {
      toast({
        title: "Login Required",
        description: "Please log in or sign up to place bets.",
        variant: "destructive",
      });
      return;
    }

    const amountColorNum = parseInt(colorBetAmount, 10);
    const amountNumberNum = parseInt(numberBetAmount, 10);

    const isColorBetAttempted = selectedColor && colorBetAmount !== '';
    const isNumberBetAttempted = selectedNumber !== null && numberBetAmount !== '';

    const isColorBetValid = isColorBetAttempted && !isNaN(amountColorNum) && amountColorNum >= MIN_BET_AMOUNT;
    const isNumberBetValid = isNumberBetAttempted && !isNaN(amountNumberNum) && amountNumberNum >= MIN_BET_AMOUNT;

    if (!isColorBetValid && !isNumberBetValid) {
      toast({
        title: "Invalid Bet",
        description: `Please select a color or number and enter a valid bet amount (min ₹${MIN_BET_AMOUNT}).`,
        variant: "destructive",
      });
      return;
    }
    
    if (isColorBetAttempted && !isColorBetValid && isNumberBetValid) {
         toast({ title: "Color Bet Invalid", description: `Color bet amount is invalid. Only Number bet will be placed.`, variant: "default" });
    }
    if (isNumberBetAttempted && !isNumberBetValid && isColorBetValid) {
         toast({ title: "Number Bet Invalid", description: `Number bet amount is invalid. Only Color bet will be placed.`, variant: "default" });
    }

    const submission: BetSubmission = {};
    if (isColorBetValid && selectedColor) {
      submission.colorBet = { color: selectedColor, amount: amountColorNum };
    }
    if (isNumberBetValid && selectedNumber !== null) {
      submission.numberBet = { number: selectedNumber, amount: amountNumberNum };
    }

    if (Object.keys(submission).length === 0) {
       toast({
        title: "No Valid Bets",
        description: `Ensure selections have valid amounts (min ₹${MIN_BET_AMOUNT}).`,
        variant: "destructive",
      });
      return;
    }

    onBetPlaced(submission);
  };
  
  const quickBetAmounts = [10, 50, 100, 500];

  const canConfirmBet = !disabled && isLoggedIn && (
    (selectedColor && parseInt(colorBetAmount, 10) >= MIN_BET_AMOUNT) ||
    (selectedNumber !== null && parseInt(numberBetAmount, 10) >= MIN_BET_AMOUNT)
  );

  return (
    <Card className="w-full shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardDescription className="pt-2 text-center text-base">Select a color and/or a number. Enter amounts for each.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isLoggedIn && !disabled && (
          <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10 text-center">
            <UserX className="mx-auto h-8 w-8 text-destructive mb-2" />
            <p className="text-destructive font-semibold mb-2">You are playing as a guest.</p>
            <p className="text-sm text-muted-foreground mb-3">Your balance and bets won&apos;t be saved.</p>
            <Link href="/login">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Login or Sign Up to Save Progress
              </Button>
            </Link>
          </div>
        )}

        <div className="p-4 border rounded-lg bg-background/30">
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
            {(['RED', 'GREEN', 'VIOLET'] as ColorOption[]).map((color) => (
              <ColorButton
                key={color}
                color={color}
                onClick={() => toggleColorSelection(color)}
                isSelected={selectedColor === color}
                disabled={disabled}
              />
            ))}
          </div>
          {selectedColor && (
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="colorBetAmount" className="text-md font-medium text-foreground/80">Amount for {selectedColor} (₹)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="colorBetAmount"
                    type="text" 
                    value={colorBetAmount}
                    onChange={(e) => handleAmountChange(e, 'color')}
                    placeholder={`Min ₹${MIN_BET_AMOUNT}`}
                    className="pl-10 text-lg h-12 focus:ring-accent focus:border-accent"
                    disabled={disabled || !selectedColor}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickBetAmounts.map(amount => (
                  <Button key={`color-${amount}`} variant="outline" onClick={() => handleQuickBet(amount, 'color')} disabled={disabled || !selectedColor} className="text-accent border-accent hover:bg-accent/10">
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-background/30">
          <div className="grid grid-cols-5 gap-2 md:gap-3 mb-4">
            {([0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as NumberOption[]).map((num) => (
              <NumberButton
                key={num}
                number={num}
                onClick={() => toggleNumberSelection(num)}
                isSelected={selectedNumber === num}
                disabled={disabled}
              />
            ))}
          </div>
          {selectedNumber !== null && (
            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="numberBetAmount" className="text-md font-medium text-foreground/80">Amount for Number {selectedNumber} (₹)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="numberBetAmount"
                    type="text" 
                    value={numberBetAmount}
                    onChange={(e) => handleAmountChange(e, 'number')}
                    placeholder={`Min ₹${MIN_BET_AMOUNT}`}
                    className="pl-10 text-lg h-12 focus:ring-accent focus:border-accent"
                    disabled={disabled || selectedNumber === null}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickBetAmounts.map(amount => (
                  <Button key={`num-${amount}`} variant="outline" onClick={() => handleQuickBet(amount, 'number')} disabled={disabled || selectedNumber === null} className="text-accent border-accent hover:bg-accent/10">
                    ₹{amount}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePlaceBet}
          disabled={!canConfirmBet}
          className="w-full h-14 text-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground transition-transform transform hover:scale-105"
        >
          <Zap className="mr-2 h-6 w-6" /> Confirm Bets
        </Button>
      </CardFooter>
    </Card>
  );
}
