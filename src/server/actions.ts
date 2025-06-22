"use server";

import type { Bet, ColorOption, NumberOption, GameResult, WithdrawalRequest, User } from "@/lib/types";
import { MIN_BET_AMOUNT, MIN_WITHDRAWAL_AMOUNT } from "@/lib/constants";
import { getAllUsers, updateUserBalanceInDb, getUserDocument } from "@/lib/firebase/firestore";

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
        username: 'Unknown',
        email: 'Unknown',
        upiId: 'Unknown'
    };

    // await saveWithdrawalRequest(newRequest);
    // Optionally, could put a hold on the funds in user's wallet
    
    return { success: true, message: "Withdrawal request submitted successfully.", request: newRequest };
}

interface ProcessWithdrawalArgs {
    requestId: string;
    adminId: string;
    userId: string;
    amount: number;
}
export async function processWithdrawalAction(args: ProcessWithdrawalArgs): Promise<{ success: boolean; message: string }> {
    console.log("Processing withdrawal:", args);

    if (args.amount <= 0) {
        return { success: false, message: "Withdrawal amount must be positive." };
    }

    try {
        const adminUser = await getUserDocument(args.adminId);
        if (!adminUser || !adminUser.isAdmin) {
            return { 
                success: false, 
                message: "Authorization Failed. You do not have privileges to process withdrawals." 
            };
        }

        const userToUpdate = await getUserDocument(args.userId);
        if (!userToUpdate) {
            return { success: false, message: `User with ID ${args.userId} not found.` };
        }

        if (userToUpdate.walletBalance < args.amount) {
            return {
                success: false,
                message: `${userToUpdate.username}'s balance (₹${userToUpdate.walletBalance.toFixed(2)}) is insufficient for this withdrawal.`,
            };
        }
        
        const newBalance = userToUpdate.walletBalance - args.amount;
        await updateUserBalanceInDb(args.userId, newBalance);

        return { success: true, message: `Withdrawal approved for ${userToUpdate.username}. New balance: ₹${newBalance.toFixed(2)}.` };
        
    } catch (error: any) {
        console.error("Error processing withdrawal via server action:", error);
        if (error.code === 'permission-denied') {
            const specificMessage = "Permission Denied by Database. Please ensure Firestore rules are published and your admin account has 'isAdmin: true' flag.";
            return { success: false, message: specificMessage };
        }
        return { success: false, message: "A server error occurred." };
    }
}

export async function getAllUsersAction(): Promise<User[]> {
    // In a real app, you might want to add pagination
    try {
      return await getAllUsers();
    } catch (error: any) {
        if (error.code === 'permission-denied' || error.message.includes('insufficient permissions')) {
            console.error("PERMISSION DENIED trying to list all users. This requires special Firestore rules for admins.");
            // Re-throw the error with a more specific message that the client can handle.
            throw new Error("Missing or insufficient permissions. This action requires admin privileges defined in Firestore rules. See PROPOSED_FIRESTORE_RULES.md for the solution.");
        }
        throw error; // Re-throw other errors
    }
}

export async function updateUserBalanceAction(adminId: string, userId: string, newBalance: number): Promise<{ success: boolean; message: string }> {
    if (newBalance < 0) {
        return { success: false, message: "Balance cannot be negative." };
    }
    
    try {
        const adminUser = await getUserDocument(adminId);
        if (!adminUser || !adminUser.isAdmin) {
            return {
                success: false,
                message: "Authorization Failed. You do not have privileges to update user balances."
            };
        }

        await updateUserBalanceInDb(userId, newBalance);
        const user = await getUserDocument(userId);
        return { success: true, message: `Balance for ${user?.username || 'user'} updated successfully.` };
    } catch (error: any) {
        console.error("Error updating user balance via server action:", error);
        if (error.code === 'permission-denied') {
            const specificMessage = "Permission Denied by Database. Please ensure Firestore rules from PROPOSED_FIRESTORE_RULES.md are published and your admin account has the 'isAdmin: true' flag in the database.";
            return { success: false, message: specificMessage };
       }
        return { success: false, message: "A server error occurred." };
    }
}

export async function approveDepositAction(adminId: string, userId: string, depositAmount: number): Promise<{ success: boolean; message: string; newBalance?: number }> {
    if (depositAmount <= 0) {
        return { success: false, message: "Deposit amount must be positive." };
    }

    try {
        // Step 1: Programmatically verify the user making the request is an admin.
        const adminUser = await getUserDocument(adminId);
        if (!adminUser || !adminUser.isAdmin) {
            return { 
                success: false, 
                message: "Authorization Failed. Your account does not have privileges to approve deposits." 
            };
        }

        // Step 2: Proceed with the original logic, now with an extra layer of security.
        const user = await getUserDocument(userId);
        if (!user) {
            return { success: false, message: `User with ID ${userId} not found.` };
        }

        const newBalance = user.walletBalance + depositAmount;
        await updateUserBalanceInDb(userId, newBalance);
        
        const successMessage = `${user.username}'s balance is now ₹${newBalance.toFixed(2)}.`;

        return { success: true, message: successMessage, newBalance };
    } catch (error: any) {
        console.error("Error approving deposit via server action:", error);
        
        // This catch block is still crucial for handling potential Firestore rule errors
        // that might occur if the rules are misconfigured, even with the programmatic check.
        if (error.code === 'permission-denied') {
             const specificMessage = "Permission Denied by Database. Please ensure Firestore rules from PROPOSED_FIRESTORE_RULES.md are published and your admin account has the 'isAdmin: true' flag in the database.";
             return { success: false, message: specificMessage };
        }
        
        return { success: false, message: "A server error occurred while approving the deposit." };
    }
}
