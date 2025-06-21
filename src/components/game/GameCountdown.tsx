
"use client";

import { useState, useEffect } from 'react';
import { TimerIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GAME_ROUND_DURATION_SECONDS } from '@/lib/constants';

interface GameCountdownProps {
  onTimerEnd: () => void;
  isProcessing?: boolean;
  roundId: string | number; 
}

export function GameCountdown({ onTimerEnd, isProcessing = false, roundId }: GameCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(GAME_ROUND_DURATION_SECONDS);

  useEffect(() => {
    setTimeLeft(GAME_ROUND_DURATION_SECONDS); // Reset timer when roundId changes or processing state changes
    if (isProcessing) return;

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Schedule onTimerEnd to run after the current update cycle
          setTimeout(() => onTimerEnd(), 0); 
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimerEnd, isProcessing, roundId]);

  const progressPercentage = (timeLeft / GAME_ROUND_DURATION_SECONDS) * 100;

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium text-primary">Current Round #{String(roundId).slice(-5)}</CardTitle>
        <TimerIcon className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        {isProcessing ? (
          <div className="text-2xl font-bold text-center text-accent animate-pulse-bg">Processing Result...</div>
        ) : (
          <div className="text-4xl font-bold text-center text-foreground">{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</div>
        )}
        <Progress value={isProcessing ? 100 : progressPercentage} className="mt-4 h-3 [&>div]:bg-accent" aria-label={`Time left: ${timeLeft} seconds`} />
        <p className="text-xs text-muted-foreground text-center mt-2">
          {isProcessing ? "Waiting for the next round..." : "Place your bets before time runs out!"}
        </p>
      </CardContent>
    </Card>
  );
}
