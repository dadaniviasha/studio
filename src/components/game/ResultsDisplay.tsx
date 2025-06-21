
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { GameResult } from '@/lib/types';
import { Trophy, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NUMBER_COLORS } from '@/lib/constants';

interface ResultsDisplayProps {
  currentResult: GameResult | null;
  history: GameResult[];
}

// This function determines the visual styling of the number ball
const getBallColorClasses = (number: number, isLarge: boolean = false): string => {
  const info = NUMBER_COLORS[number]; // For visual styling only
  let classes = isLarge ? 'w-16 h-16 md:w-20 md:h-20 text-3xl md:text-4xl' : 'w-8 h-8 text-sm';
  
  if (info.violet) { // Visual: If number includes violet (e.g., 0 or 5)
    if (info.primary === 'RED') {
      classes += ' bg-gradient-to-br from-red-500 to-purple-500 text-white';
    } else { // GREEN
      classes += ' bg-gradient-to-br from-green-500 to-purple-500 text-white';
    }
  } else if (info.primary === 'RED') {
    classes += ' bg-red-500 text-white';
  } else { // GREEN
    classes += ' bg-green-500 text-white';
  }
  return classes;
};

// This function determines the badge color for the winningColor of the round
const getWinningColorBadgeClass = (winningColor: GameResult['winningColor']): string => {
    switch (winningColor) {
        case 'RED': return 'bg-red-500';
        case 'GREEN': return 'bg-green-500';
        case 'VIOLET': return 'bg-purple-500';
        default: return 'bg-gray-500'; // Fallback
    }
};
// This function determines the badge color for the winningColor of the round for history items (outline)
const getWinningColorHistoryBadgeClass = (winningColor: GameResult['winningColor']): string => {
    switch (winningColor) {
        case 'RED': return 'border-red-500 text-red-500';
        case 'GREEN': return 'border-green-500 text-green-500';
        case 'VIOLET': return 'border-purple-500 text-purple-500';
        default: return 'border-gray-500 text-gray-500'; // Fallback
    }
};


export function ResultsDisplay({ currentResult, history }: ResultsDisplayProps) {
  const [revealedResult, setRevealedResult] = useState<GameResult | null>(null);

  useEffect(() => {
    if (currentResult) {
      const timer = setTimeout(() => {
        setRevealedResult(currentResult);
      }, 100); 
      return () => clearTimeout(timer);
    }
  }, [currentResult]);
  
  const displayResult = revealedResult || currentResult;

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary flex items-center">
          <Trophy className="mr-2 h-7 w-7" /> Game Results
        </CardTitle>
        <CardDescription>Check out the latest winning numbers and colors.</CardDescription>
      </CardHeader>
      <CardContent>
        {displayResult ? (
          <div className="mb-8 p-6 rounded-lg bg-background/50 shadow-inner animate-result-reveal">
            <h3 className="text-center text-lg font-semibold text-accent mb-1">Round #{displayResult.roundId} Winner!</h3>
            <div className="flex flex-col items-center justify-center space-y-3">
              <div 
                className={cn(
                  "rounded-full flex items-center justify-center font-bold shadow-lg",
                  getBallColorClasses(displayResult.winningNumber, true) // Visual styling of the number ball
                )}
              >
                {displayResult.winningNumber}
              </div>
              <div className="flex space-x-2">
                <Badge 
                  className={cn(
                    "text-sm px-3 py-1", 
                    getWinningColorBadgeClass(displayResult.winningColor) // Badge for the actual winning color
                  )}
                >
                  {displayResult.winningColor}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Waiting for the first result...</p>
        )}

        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-3 flex items-center text-foreground/80">
            <History className="mr-2 h-5 w-5" /> Recent History
          </h4>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background/30">
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((res, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-card/50 hover:bg-card/70 transition-colors">
                    <span className="text-xs text-muted-foreground">Round #{res.roundId}</span>
                    <div className="flex items-center space-x-2">
                       <div 
                        className={cn(
                          "rounded-full flex items-center justify-center font-semibold shadow-md",
                          getBallColorClasses(res.winningNumber) // Visual styling of number ball in history
                        )}
                      >
                        {res.winningNumber}
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(
                            "text-xs",
                           getWinningColorHistoryBadgeClass(res.winningColor) // Badge for actual winning color in history
                        )}
                      >
                        {res.winningColor}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground">No history yet.</p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
