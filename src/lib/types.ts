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
  winningColor: ColorOption; // This is the primary color of the winning number
  winningVioletColor?: ColorOption; // This is 'VIOLET' if the winning number also has violet
  winningNumber: NumberOption;
  timestamp: number;
  finalizedBy: "admin" | "random";
}

export interface User {
  id: string;
  username: string; // Or some identifier
  walletBalance: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "deposit" | "withdrawal" | "bet_placed" | "bet_won";
  amount: number;
  timestamp: number;
  relatedBetId?: string;
  status?: "pending" | "completed" | "failed"; // For deposits/withdrawals
}

export interface WithdrawalRequest {
  id: string;
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
