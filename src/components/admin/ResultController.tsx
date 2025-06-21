
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2, Settings } from 'lucide-react';
import type { ColorOption, NumberOption } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const ADMIN_RESULT_STORAGE_KEY = 'CROTOS_ADMIN_RESULT_OVERRIDE';

export function ResultController() {
  const [mode, setMode] = useState<'random' | 'manual'>('random');
  // Use strings for state to simplify interaction with Select components
  const [manualColor, setManualColor] = useState<string>('');
  const [manualNumber, setManualNumber] = useState<string>('');
  const { toast } = useToast();

  const handleSetResult = () => {
    try {
      if (mode === 'manual') {
        // Simplified and more robust check
        if (!manualNumber || !manualColor) {
            toast({ title: "Invalid Selection", description: "Please select both a winning number and a winning color for manual override.", variant: "destructive" });
            return;
        }
        
        const resultToStore = {
            winningNumber: parseInt(manualNumber, 10) as NumberOption,
            winningColor: manualColor as ColorOption,
        };
  
        localStorage.setItem(ADMIN_RESULT_STORAGE_KEY, JSON.stringify(resultToStore));
        toast({ title: "Manual Result Set", description: `The next round will be Number: ${resultToStore.winningNumber}, Color: ${resultToStore.winningColor}.` });
        
      } else { // mode === 'random'
          localStorage.removeItem(ADMIN_RESULT_STORAGE_KEY);
          toast({ title: "Result Set to Random", description: "The next round will have a random outcome." });
      }
    } catch (error) {
      console.error("Error saving admin result to localStorage:", error);
      toast({
          title: "Storage Error",
          description: "Could not save the admin-defined result.",
          variant: "destructive",
      });
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
                  value={manualNumber} 
                  onValueChange={(value) => setManualNumber(value)}
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
                  onValueChange={(value) => setManualColor(value)}
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

    