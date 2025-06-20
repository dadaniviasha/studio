
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

interface ResultControllerProps {
  onSetResult: (result: Partial<GameResult>) => void;
}

export function ResultController({ onSetResult }: ResultControllerProps) {
  const [controlMode, setControlMode] = useState<'manual' | 'random'>('manual');
  const [manualColor, setManualColor] = useState<ColorOption | ''>('');
  const [manualNumber, setManualNumber] = useState<NumberOption | ''>('');
  const { toast } = useToast();

  const handleSetResult = () => {
    let resultToSet: Partial<GameResult>;

    if (controlMode === 'random') {
      const randomNumber = Math.floor(Math.random() * 10) as NumberOption;
      let randomColor: ColorOption;

      if (randomNumber === 0 || randomNumber === 5) {
        randomColor = 'VIOLET';
      } else {
        const availableColors: ColorOption[] = ['RED', 'GREEN', 'VIOLET'];
        randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
      }
      
      resultToSet = {
        winningNumber: randomNumber,
        winningColor: randomColor,
        finalizedBy: 'random',
      };
      onSetResult(resultToSet);
      toast({ title: "Random Result Triggered", description: `Next result will be Number: ${resultToSet.winningNumber}, Color: ${resultToSet.winningColor}.` });
      return;
    }

    // Manual mode
    if (manualNumber === '' || manualColor === '') {
        toast({ title: "Invalid Selection", description: "In manual mode, please select both a winning number and a winning color.", variant: "destructive" });
        return;
    }
    
    let effectiveWinningColor = manualColor as ColorOption;
    if (manualNumber === 0 || manualNumber === 5) {
        effectiveWinningColor = 'VIOLET';
        if (manualColor !== 'VIOLET' && manualColor !== '') { // Only toast if admin's choice was different and overridden
            toast({ title: "Color Override", description: `Number ${manualNumber} selected. Winning color automatically set to VIOLET.`, variant: "default", duration: 4000 });
        }
    }
    
    resultToSet = {
        winningNumber: manualNumber as NumberOption,
        winningColor: effectiveWinningColor,
        finalizedBy: 'admin',
    };

    onSetResult(resultToSet);
    toast({ title: "Manual Result Set", description: `Next result configured to Number: ${resultToSet.winningNumber}, Color: ${resultToSet.winningColor}.` });
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
              <Label htmlFor="manualNumber">Winning Number *</Label>
              <Select 
                value={manualNumber === '' ? '' : manualNumber.toString()} 
                onValueChange={(value) => {
                  const numValue = value === '' ? '' : parseInt(value) as NumberOption;
                  setManualNumber(numValue);
                  if (numValue === 0 || numValue === 5) {
                    // Optionally auto-select Violet or at least inform admin if they pick another color
                    // For now, the override happens at submission time.
                  }
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
              <Select value={manualColor} onValueChange={(value: ColorOption | '') => setManualColor(value)}>
                <SelectTrigger id="manualColor" className="w-full h-12 mt-1">
                  <SelectValue placeholder="Select winning color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RED">Red</SelectItem>
                  <SelectItem value="GREEN">Green</SelectItem>
                  <SelectItem value="VIOLET">Violet</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Both number and color are required. If number 0 or 5 is selected, winning color will be VIOLET.
              </p>
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
