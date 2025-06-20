"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ColorOption } from '@/lib/types';

interface ColorButtonProps {
  color: ColorOption;
  onClick: () => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export function ColorButton({ color, onClick, isSelected, disabled }: ColorButtonProps) {
  const colorClasses = {
    RED: 'bg-red-500 hover:bg-red-600 border-red-700 text-white',
    GREEN: 'bg-green-500 hover:bg-green-600 border-green-700 text-white',
    VIOLET: 'bg-purple-600 hover:bg-purple-700 border-purple-800 text-white',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full h-16 text-xl font-bold transition-all duration-150 ease-in-out transform hover:scale-105',
        colorClasses[color],
        isSelected && 'ring-4 ring-offset-2 ring-offset-background ring-accent scale-105 shadow-lg',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
      aria-pressed={isSelected}
      aria-label={`Bet on ${color.toLowerCase()}`}
    >
      {color}
    </Button>
  );
}
