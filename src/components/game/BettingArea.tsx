"use client";

import { useState } from 'react';
import { DollarSign, Zap, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import type { ColorOption, NumberOption } from '@/lib/types';
import { MIN_BET_AMOUNT } from '@/lib/constants';
import { ColorButton } from './ColorButton';
import { NumberButton } from './NumberButton';

interface BettingAreaProps {
  onBetPlaced: (betDetails: { color: ColorOption | null, number: NumberOption | null, amount: number }) => void;
  disabled?: boolean; // If game is not in betting phase
}

export function BettingArea({ onBetPlaced, disabled }: BettingAreaProps) {
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<NumberOption | null>(null);
  const [betAmount, setBetAmount] = useState<string>(MIN_BET_AMOUNT.toString());
  const { toast } = useToast();

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) { // Allow only numbers
      setBetAmount(value);
    }
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const toggleColorSelection = (color: ColorOption) => {
    setSelectedColor(prev => prev === color ? null : color);
  };

  const toggleNumberSelection = (number: NumberOption) => {
    setSelectedNumber(prev => prev === number ? null : number);
  };

  const handlePlaceBet = () => {
    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount < MIN_BET_AMOUNT) {
      toast({
        title: "Invalid Bet",
        description: `Minimum bet amount is ₹${MIN_BET_AMOUNT}.`,
        variant: "destructive",
      });
      return;
    }

    if (!selectedColor && selectedNumber === null) {
      toast({
        title: "No Selection",
        description: "Please select a color and/or a number to bet on.",
        variant: "destructive",
      });
      return;
    }
    
    let description = "";
    if (selectedColor && selectedNumber !== null) {
      description = `₹${amount} on Number ${selectedNumber} AND ${selectedColor}.`;
    } else if (selectedNumber !== null) {
      description = `₹${amount} on Number ${selectedNumber}.`;
    } else if (selectedColor) {
      description = `₹${amount} on ${selectedColor}.`;
    }

    onBetPlaced({ color: selectedColor, number: selectedNumber, amount });
    toast({ title: "Bet Placed!", description });
    
    // Reset selections after bet
    // setSelectedColor(null);
    // setSelectedNumber(null);
  };
  
  const quickBetAmounts = [10, 50, 100, 500];

  return (
    <Card className="w-full shadow-2xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Zap className="mr-2 h-7 w-7" /> Place Your Bet
        </CardTitle>
        <CardDescription>Select a color, a number, or both. Then set your amount.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label className="text-lg font-medium text-foreground/80 mb-2 block">Choose Color (Optional)</Label>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
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
          </div>

          <div>
            <Label className="text-lg font-medium text-foreground/80 mb-2 block">Choose Number (Optional)</Label>
            <div className="grid grid-cols-5 gap-2 md:gap-3">
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
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <Label htmlFor="betAmount" className="text-lg font-medium text-foreground/80">Bet Amount (₹)</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="betAmount"
                type="text" 
                value={betAmount}
                onChange={handleBetAmountChange}
                placeholder={`Min ₹${MIN_BET_AMOUNT}`}
                className="pl-10 text-lg h-12 focus:ring-accent focus:border-accent"
                disabled={disabled}
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickBetAmounts.map(amount => (
              <Button key={amount} variant="outline" onClick={() => handleQuickBet(amount)} disabled={disabled} className="text-accent border-accent hover:bg-accent/10">
                ₹{amount}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handlePlaceBet}
          disabled={disabled || (!selectedColor && selectedNumber === null) || parseInt(betAmount) < MIN_BET_AMOUNT}
          className="w-full h-14 text-xl font-bold bg-accent hover:bg-accent/90 text-accent-foreground transition-transform transform hover:scale-105"
        >
          <Zap className="mr-2 h-6 w-6" /> Confirm Bet
        </Button>
      </CardFooter>
    </Card>
  );
}
