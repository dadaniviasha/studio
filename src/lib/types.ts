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
  winningColor: ColorOption; // The independently determined winning color for the round
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

// Payload from BettingArea to HomePage
export interface BetSubmission {
  colorBet?: { color: ColorOption; amount: number };
  numberBet?: { number: NumberOption; amount: number };
}
