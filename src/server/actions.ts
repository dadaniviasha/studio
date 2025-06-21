"use server";

import type { Bet, ColorOption, NumberOption, GameResult, WithdrawalRequest, User } from "@/lib/types";
import { MIN_BET_AMOUNT, MIN_WITHDRAWAL_AMOUNT } from "@/lib/constants";
import { getAllUsers, updateUserBalanceInDb } from "@/lib/firebase/firestore";

// This is a placeholder file. In a real application, these actions would interact with a database,
// handle authentication, and perform actual game logic. For this scaffold, they will mostly
// log actions and return simulated responses.

interface PlaceBetArgs {
  userId: string;
  roundId: string;
  type: "color" | "number";
  selection: ColorOption | NumberOption;
  amount: number;
}

export async function placeBetAction(args: PlaceBetArgs): Promise<{ success: boolean; message: string; bet?: Bet, newBalance?: number }> {
  console.log("Placing bet:", args);

  if (args.amount < MIN_BET_AMOUNT) {
    return { success: false, message: `Minimum bet amount is ₹${MIN_BET_AMOUNT}.` };
  }

  // Simulate balance check (would fetch from DB)
  // const userBalance = await getUserBalance(args.userId);
  // if (userBalance < args.amount) {
  //   return { success: false, message: "Insufficient balance." };
  // }

  // Simulate deducting balance and saving bet
  const newBet: Bet = {
    id: `bet_${Date.now()}`,
    userId: args.userId,
    roundId: args.roundId,
    selectedColor: args.type === 'color' ? args.selection as ColorOption : null,
    selectedNumber: args.type === 'number' ? args.selection as NumberOption : null,
    amount: args.amount,
    timestamp: Date.now(),
  };
  
  // const updatedBalance = userBalance - args.amount;
  // await updateUserBalance(args.userId, updatedBalance);
  // await saveBet(newBet);

  return { success: true, message: "Bet placed successfully!", bet: newBet, newBalance: 0 /*updatedBalance*/ };
}


interface SetNextResultArgs {
  winningNumber: NumberOption;
  winningColor: ColorOption;
  finalizedBy: "admin" | "random";
}
export async function setNextResultAction(args: SetNextResultArgs): Promise<{ success: boolean; message: string; result?: GameResult }> {
  console.log("Admin setting next result:", args);
  
  const newResult: GameResult = {
    ...args,
    roundId: `round_${Date.now()}`, // Or current active round ID
    timestamp: Date.now(),
  };

  // Simulate saving result and triggering payout calculations
  // await saveGameResult(newResult);
  // await processPayoutsForRound(newResult.roundId);

  return { success: true, message: "Next result set successfully.", result: newResult };
}

interface RequestWithdrawalArgs {
    userId: string;
    amount: number;
}
export async function requestWithdrawalAction(args: RequestWithdrawalArgs): Promise<{ success: boolean; message: string; request?: WithdrawalRequest}> {
    console.log("Withdrawal request:", args);

    if (args.amount < MIN_WITHDRAWAL_AMOUNT) {
        return { success: false, message: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.` };
    }

    // const userBalance = await getUserBalance(args.userId);
    // if (userBalance < args.amount) {
    //   return { success: false, message: "Insufficient balance for withdrawal." };
    // }

    const newRequest: WithdrawalRequest = {
        id: `wd_${Date.now()}`,
        userId: args.userId,
        amount: args.amount,
        requestedAt: Date.now(),
        status: 'pending',
    };

    // await saveWithdrawalRequest(newRequest);
    // Optionally, could put a hold on the funds in user's wallet
    
    return { success: true, message: "Withdrawal request submitted successfully.", request: newRequest };
}

interface ProcessWithdrawalArgs {
    requestId: string;
    status: 'approved' | 'rejected';
    adminId: string;
}
export async function processWithdrawalAction(args: ProcessWithdrawalArgs): Promise<{ success: boolean; message: string }> {
    console.log("Processing withdrawal:", args);
    
    // const request = await getWithdrawalRequest(args.requestId);
    // if (!request || request.status !== 'pending') {
    //   return { success: false, message: "Invalid or already processed request." };
    // }

    // if (args.status === 'approved') {
        // Deduct from user balance if not already on hold
        // Mark request as approved
    // } else {
        // Release hold if any
        // Mark request as rejected
    // }
    // await updateWithdrawalRequestStatus(args.requestId, args.status, args.adminId);

    return { success: true, message: `Withdrawal request ${args.requestId} has been ${args.status}.` };
}

export async function getAllUsersAction(): Promise<User[]> {
    // In a real app, you might want to add pagination
    return await getAllUsers();
}

export async function updateUserBalanceAction(userId: string, newBalance: number): Promise<{ success: boolean; message: string }> {
    if (newBalance < 0) {
        return { success: false, message: "Balance cannot be negative." };
    }
    
    // TODO: Add permission check here in a real app to ensure only admin can call this
    
    try {
        await updateUserBalanceInDb(userId, newBalance);
        return { success: true, message: `Balance updated for user ${userId}.` };
    } catch (error) {
        console.error("Error updating user balance via server action:", error);
        return { success: false, message: "A server error occurred." };
    }
}
