
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Settings } from 'lucide-react';
import type { ColorOption, NumberOption, GameResult } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

interface ResultControllerProps {
  onSetResult: (result: Partial<GameResult>) => void;
}

export function ResultController({ onSetResult }: ResultControllerProps) {
  const [manualColor, setManualColor] = useState<ColorOption | ''>('');
  const [manualNumber, setManualNumber] = useState<NumberOption | ''>('');
  const { toast } = useToast();

  const handleSetResult = () => {
    if (manualNumber === '' || manualColor === '') {
        toast({ title: "Invalid Selection", description: "Please select both a winning number and a winning color.", variant: "destructive" });
        return;
    }
    
    const resultToSet: Partial<GameResult> = {
        winningNumber: manualNumber as NumberOption,
        winningColor: manualColor as ColorOption,
    };

    onSetResult(resultToSet);
    toast({ title: "Result Override Set", description: `The next round will be Number: ${resultToSet.winningNumber}, Color: ${resultToSet.winningColor}.` });
    
    // Clear the fields for better UX
    setManualColor('');
    setManualNumber('');
  };

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <Settings className="mr-2 h-6 w-6" /> Result Override
        </CardTitle>
        <CardDescription>Manually set the outcome for only the next round. The game returns to random results automatically after that.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-md bg-background/30">
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
        </div>
        
        <Button onClick={handleSetResult} className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
          <Wand2 className="mr-2 h-5 w-5" />
          Set Next Result
        </Button>
      </CardContent>
    </Card>
  );
}
