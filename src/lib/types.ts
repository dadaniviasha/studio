export type ColorOption = "RED" | "GREEN" | "VIOLET";
export type NumberOption = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface Bet {
  id: string;
  userId: string;
  roundId: string;
  selectedColor: ColorOption | null;
  selectedNumber: NumberOption | null;
  amount: number;
  timestamp: number;
  isProcessed?: boolean;
  isWin?: boolean;
  payout?: number;
}

export interface GameResult {
  roundId: string;
  /** If winningNumber is 0 or 5, this will be VIOLET. Otherwise, it is determined independently. */
  winningColor: ColorOption;
  winningNumber: NumberOption;
  timestamp: number;
  finalizedBy: "admin" | "random";
}

export interface User {
  id: string; // This will be the Firebase UID
  username: string; // This will be the Firebase displayName
  email: string;
  walletBalance: number; // This would typically be stored in Firestore, not on the auth object
  isAdmin: boolean; // This is now a permanent, non-optional flag from Firestore
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "bet_placed" | "bet_won" | "signup_bonus";
  amount: number;
  timestamp: number;
  description: string;
  status: "completed" | "pending" | "failed";
}

export interface WithdrawalRequest {
  id:string;
  userId: string;
  amount: number;
  requestedAt: number;
  status: "pending" | "approved" | "rejected";
  processedAt?: number;
}

export interface GameRound {
  id: string;
  startTime: number;
  endTime: number;
  status: "betting" | "processing" | "completed";
  result?: GameResult;
}

// Payload from BettingArea to HomePage
export interface BetSubmission {
  colorBet?: { color: ColorOption; amount: number };
  numberBet?: { number: NumberOption; amount: number };
}
