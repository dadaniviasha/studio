
export const MIN_BET_AMOUNT = 5;
export const MIN_WITHDRAWAL_AMOUNT = 200;

export const PAYOUT_MULTIPLIERS = {
  RED: 2,
  GREEN: 2,
  VIOLET: 5,
  NUMBER: 9,
  // NUMBER_AND_COLOR: 15, // This is removed as bets are now separate
};

export const GAME_ROUND_DURATION_SECONDS = 30; // Updated from 60 to 30
export const RESULT_PROCESSING_DURATION_SECONDS = 10; // Time to show result before new round

// Defines the primary color and if Violet is also applicable for each number
export const NUMBER_COLORS: Record<number, { primary: 'RED' | 'GREEN', violet?: 'VIOLET' }> = {
  0: { primary: 'RED', violet: 'VIOLET' }, // 0 is Red and Violet
  1: { primary: 'GREEN' },                 // 1 is Green
  2: { primary: 'RED' },                   // 2 is Red
  3: { primary: 'GREEN' },                 // 3 is Green
  4: { primary: 'RED' },                   // 4 is Red
  5: { primary: 'GREEN', violet: 'VIOLET' },// 5 is Green and Violet
  6: { primary: 'RED' },                   // 6 is Red
  7: { primary: 'GREEN' },                 // 7 is Green
  8: { primary: 'RED' },                   // 8 is Red
  9: { primary: 'GREEN' },                 // 9 is Green
};
