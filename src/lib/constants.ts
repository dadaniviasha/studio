
export const MIN_BET_AMOUNT = 5;
export const MIN_DEPOSIT_AMOUNT = 50;
export const MIN_WITHDRAWAL_AMOUNT = 200;

// Defines the fixed payout multipliers for different bet types.
// The house edge is built into these multipliers.
export const PAYOUT_MULTIPLIERS = {
  RED: 1.9,    // Bet 10, win 19 (9 profit)
  GREEN: 1.9,  // Bet 10, win 19 (9 profit)
  VIOLET: 4.5, // Bet 10, win 45 (35 profit)
  NUMBER: 9,   // Bet 10, win 90 (80 profit)
};

export const GAME_ROUND_DURATION_SECONDS = 60;
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

    
