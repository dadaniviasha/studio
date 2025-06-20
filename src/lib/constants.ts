export const MIN_BET_AMOUNT = 5;
export const MIN_WITHDRAWAL_AMOUNT = 200;

export const PAYOUT_MULTIPLIERS = {
  RED: 2,
  GREEN: 2,
  VIOLET: 5,
  NUMBER: 9,
};

export const GAME_ROUND_DURATION_SECONDS = 60; // e.g., 1 minute betting time
export const RESULT_PROCESSING_DURATION_SECONDS = 10; // Time to show result before new round

export const NUMBER_COLORS: Record<number, { primary: 'RED' | 'GREEN', violet?: 'VIOLET' }> = {
  0: { primary: 'RED', violet: 'VIOLET' },
  1: { primary: 'GREEN' },
  2: { primary: 'RED' },
  3: { primary: 'GREEN' },
  4: { primary: 'RED' },
  5: { primary: 'GREEN', violet: 'VIOLET' },
  6: { primary: 'RED' },
  7: { primary: 'GREEN' },
  8: { primary: 'RED' },
  9: { primary: 'GREEN' },
};
