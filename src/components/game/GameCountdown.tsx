
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
  endTime: number; // The absolute timestamp when the round ends
}

const calculateTimeLeft = (endTime: number) => {
    if (!endTime || endTime === 0) return GAME_ROUND_DURATION_SECONDS;
    const now = Date.now();
    const timeLeft = Math.round((endTime - now) / 1000);
    return Math.max(0, timeLeft);
};

export function GameCountdown({ onTimerEnd, isProcessing = false, roundId, endTime }: GameCountdownProps) {
  // Initialize with a static value to prevent hydration mismatch
  const [timeLeft, setTimeLeft] = useState(GAME_ROUND_DURATION_SECONDS);

  const totalDuration = GAME_ROUND_DURATION_SECONDS;

  useEffect(() => {
    // Don't run the timer if processing, or if endTime hasn't been set yet (from initial client hydration)
    if (isProcessing || !endTime) {
      if (isProcessing) {
        setTimeLeft(0);
      }
      return;
    }

    // Set the initial correct time when endTime is available
    setTimeLeft(calculateTimeLeft(endTime));

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(endTime);
      if (newTimeLeft <= 0) {
        clearInterval(timer);
        onTimerEnd();
        setTimeLeft(0);
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimerEnd, isProcessing, roundId, endTime]);

  const progressPercentage = (timeLeft / totalDuration) * 100;

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium text-primary">Current Round #{roundId}</CardTitle>
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
