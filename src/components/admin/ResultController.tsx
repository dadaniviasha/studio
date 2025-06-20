
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Wand2, Settings, Shuffle } from 'lucide-react';
import type { ColorOption, NumberOption, GameResult } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { NUMBER_COLORS } from '@/lib/constants';

interface ResultControllerProps {
  onSetResult: (result: Partial<GameResult>) => void; // Partial because admin might only set number, color derived.
}

export function ResultController({ onSetResult }: ResultControllerProps) {
  const [controlMode, setControlMode] = useState<'manual' | 'random'>('manual');
  const [manualColor, setManualColor] = useState<ColorOption | ''>(''); // This is for admin hinting, actual result color is derived by number
  const [manualNumber, setManualNumber] = useState<NumberOption | ''>('');
  const { toast } = useToast();

  const handleSetResult = () => {
    if (controlMode === 'random') {
      const winningNumber = Math.floor(Math.random() * 10) as NumberOption;
      const colorInfo = NUMBER_COLORS[winningNumber];
      const resultToSet: Partial<GameResult> = {
        winningNumber,
        winningColor: colorInfo.primary,
        finalizedBy: 'random',
      };
      onSetResult(resultToSet);
      toast({ title: "Random Result Triggered", description: `Next result will be random.` });
      return;
    }

    // Manual mode
    if (manualNumber === '' && manualColor === '') { // Admin must select at least one input if in manual mode
        toast({ title: "Invalid Selection", description: "Please select a number or suggest a color.", variant: "destructive" });
        return;
    }
    
    let resultToSet: Partial<GameResult>;

    if (manualNumber !== '') { // Number selection takes precedence
        const num = manualNumber as NumberOption;
        const colorInfo = NUMBER_COLORS[num];
        resultToSet = {
            winningNumber: num,
            winningColor: colorInfo.primary,
            finalizedBy: 'admin',
        };
    } else if (manualColor !== '') { // If only color is suggested, pick a random number of that color
        const possibleNumbers = (Object.keys(NUMBER_COLORS) as unknown as NumberOption[])
            .map(nStr => parseInt(nStr) as NumberOption) // Ensure number type
            .filter(n => {
                const info = NUMBER_COLORS[n];
                return info.primary === manualColor || (manualColor === 'VIOLET' && info.violet);
            });
        
        if (possibleNumbers.length === 0) {
            toast({ title: "No Matching Number", description: `No number matches the selected color criteria: ${manualColor}. Try a different color or set a number.`, variant: "destructive" });
            return;
        }
        const winningNumber = possibleNumbers[Math.floor(Math.random() * possibleNumbers.length)];
        const colorInfo = NUMBER_COLORS[winningNumber];
        resultToSet = {
            winningNumber,
            winningColor: colorInfo.primary,
            finalizedBy: 'admin',
        };
    } else {
         // This state should not be reached due to the initial check, but as a fallback:
         toast({ title: "Error", description: "Invalid state for setting result. Please select a number or a color.", variant: "destructive" });
         return;
    }

    onSetResult(resultToSet);
    toast({ title: "Manual Result Set", description: `Next result configured to Number: ${resultToSet.winningNumber}, Primary Color: ${resultToSet.winningColor}.` });
    setManualColor('');
    setManualNumber('');
  };

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <Settings className="mr-2 h-6 w-6" /> Game Result Control
        </CardTitle>
        <CardDescription>Manually set the next game result or trigger a random one.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base">Control Mode</Label>
          <RadioGroup defaultValue="manual" value={controlMode} onValueChange={(value: 'manual' | 'random') => setControlMode(value)} className="mt-2 flex space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="manual" id="manual" />
              <Label htmlFor="manual" className="font-normal">Manual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="random" id="random" />
              <Label htmlFor="random" className="font-normal">Random</Label>
            </div>
          </RadioGroup>
        </div>

        {controlMode === 'manual' && (
          <div className="space-y-4 p-4 border rounded-md bg-background/30">
            <h3 className="text-lg font-medium text-foreground/80">Manual Configuration</h3>
            <div>
              <Label htmlFor="manualNumber">Winning Number (Overrides Color if set)</Label>
              <Select value={manualNumber === '' ? '' : manualNumber.toString()} onValueChange={(value) => setManualNumber(value === '' ? '' : parseInt(value) as NumberOption)}>
                <SelectTrigger id="manualNumber" className="w-full h-12 mt-1">
                  <SelectValue placeholder="Select number (highest priority)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i as NumberOption).map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground mt-1">Setting a number automatically determines its primary color(s).</p>
            </div>
             <div>
              <Label htmlFor="manualColor">Suggest Winning Color (Used if no number is set)</Label>
              <Select value={manualColor} onValueChange={(value: ColorOption | '') => setManualColor(value)}>
                <SelectTrigger id="manualColor" className="w-full h-12 mt-1">
                  <SelectValue placeholder="Select color (if no number is chosen)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="RED">Red</SelectItem>
                  <SelectItem value="GREEN">Green</SelectItem>
                  <SelectItem value="VIOLET">Violet</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">If a number is set, this color selection is ignored. If only color is set, a random number of this color type will be picked.</p>
            </div>
          </div>
        )}
        
        <Button onClick={handleSetResult} className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
          {controlMode === 'random' ? <Shuffle className="mr-2 h-5 w-5" /> : <Wand2 className="mr-2 h-5 w-5" />}
          {controlMode === 'random' ? 'Trigger Random Result' : 'Set Next Result'}
        </Button>
      </CardContent>
    </Card>
  );
}
