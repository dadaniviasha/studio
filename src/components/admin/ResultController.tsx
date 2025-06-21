
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Settings } from 'lucide-react';
import type { ColorOption, NumberOption, GameResult } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ResultControllerProps {
  // Allow null to clear the override
  onSetResult: (result: Partial<GameResult> | null) => void;
}

export function ResultController({ onSetResult }: ResultControllerProps) {
  const [mode, setMode] = useState<'random' | 'manual'>('random');
  const [manualColor, setManualColor] = useState<ColorOption | ''>('');
  const [manualNumber, setManualNumber] = useState<NumberOption | ''>('');
  const { toast } = useToast();

  const handleSetResult = () => {
    if (mode === 'manual') {
      if (manualNumber === '' || manualColor === '') {
          toast({ title: "Invalid Selection", description: "Please select both a winning number and a winning color for manual override.", variant: "destructive" });
          return;
      }
      
      const resultToSet: Partial<GameResult> = {
          winningNumber: manualNumber as NumberOption,
          winningColor: manualColor as ColorOption,
      };

      onSetResult(resultToSet);
      
    } else { // mode === 'random'
        onSetResult(null); // Signal to clear any existing override
    }
  };

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <Settings className="mr-2 h-6 w-6" /> Next Round Control
        </CardTitle>
        <CardDescription>Choose whether the next round's result is random or manually set. This setting only applies to the very next round.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <RadioGroup value={mode} onValueChange={(value: 'random' | 'manual') => setMode(value)} className="space-y-2">
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="r1" />
                <Label htmlFor="r1">Random Result (Default)</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="r2" />
                <Label htmlFor="r2">Manual Override</Label>
            </div>
        </RadioGroup>

        <div className="space-y-4 p-4 border rounded-md bg-background/30 transition-opacity" style={{ opacity: mode === 'manual' ? 1 : 0.5 }}>
            <fieldset disabled={mode === 'random'} className="space-y-4">
              <h3 className="text-lg font-medium text-foreground/80">Manual Configuration</h3>
              <div>
                <Label htmlFor="manualNumber">Winning Number *</Label>
                <Select 
                  value={manualNumber === '' ? '' : manualNumber.toString()} 
                  onValueChange={(value) => {
                    const numValue = value === '' ? '' : parseInt(value) as NumberOption;
                    setManualNumber(numValue);
                  }}
                >
                  <SelectTrigger id="manualNumber" className="w-full h-12 mt-1">
                    <SelectValue placeholder="Select winning number" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i as NumberOption).map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manualColor">Winning Color *</Label>
                <Select 
                  value={manualColor} 
                  onValueChange={(value: ColorOption | '') => setManualColor(value)}
                >
                  <SelectTrigger id="manualColor" className="w-full h-12 mt-1">
                    <SelectValue placeholder="Select winning color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RED">Red</SelectItem>
                    <SelectItem value="GREEN">Green</SelectItem>
                    <SelectItem value="VIOLET">Violet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </fieldset>
        </div>
        
        <Button onClick={handleSetResult} className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
          <Wand2 className="mr-2 h-5 w-5" />
          Apply For Next Round
        </Button>
      </CardContent>
    </Card>
  );
}
