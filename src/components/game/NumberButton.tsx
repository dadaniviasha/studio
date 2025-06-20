"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { NumberOption } from '@/lib/types';
import { NUMBER_COLORS } from '@/lib/constants';

interface NumberButtonProps {
  number: NumberOption;
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export function NumberButton({ number, onClick, isSelected, disabled }: NumberButtonProps) {
  const numberInfo = NUMBER_COLORS[number];
  let bgColorClass = '';
  if (numberInfo.violet) {
    bgColorClass = 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600';
  } else if (numberInfo.primary === 'RED') {
    bgColorClass = 'bg-red-500 hover:bg-red-600';
  } else {
    bgColorClass = 'bg-green-500 hover:bg-green-600';
  }
  
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full h-14 text-2xl font-bold transition-all duration-150 ease-in-out transform hover:scale-105 text-white',
        bgColorClass,
        isSelected && 'ring-4 ring-offset-2 ring-offset-background ring-accent scale-105 shadow-lg',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
      aria-pressed={isSelected}
      aria-label={`Bet on number ${number}`}
    >
      {number}
    </Button>
  );
}
