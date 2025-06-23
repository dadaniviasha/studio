"use server";

import type { Bet, ColorOption, NumberOption, GameResult, WithdrawalRequest, User } from "@/lib/types";
import { MIN_BET_AMOUNT, MIN_WITHDRAWAL_AMOUNT } from "@/lib/constants";
import { adminDb } from "@/lib/firebase/admin"; // Using Admin SDK now
import { FieldValue } from 'firebase-admin/firestore';

// --- Helper Functions for Admin Actions ---

async function getAdminUserDoc(uid: string): Promise<User | null> {
    if (!adminDb) return null;
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    return userSnap.exists ? userSnap.data() as User : null;
}

// --- Public Server Actions ---

// This action remains unchanged as it's a simulation and doesn't touch the DB.
export async function placeBetAction(args: {
  userId: string;
  roundId: string;
  type: "color" | "number";
  selection: ColorOption | NumberOption;
  amount: number;
}): Promise<{ success: boolean; message: string; bet?: Bet, newBalance?: number }> {
  console.log("Placing bet:", args);

  if (args.amount < MIN_BET_AMOUNT) {
    return { success: false, message: `Minimum bet amount is ₹${MIN_BET_AMOUNT}.` };
  }

  const newBet: Bet = {
    id: `bet_${Date.now()}`,
    userId: args.userId,
    roundId: args.roundId,
    selectedColor: args.type === 'color' ? args.selection as ColorOption : null,
    selectedNumber: args.type === 'number' ? args.selection as NumberOption : null,
    amount: args.amount,
    timestamp: Date.now(),
  };

  return { success: true, message: "Bet placed successfully!", bet: newBet, newBalance: 0 };
}

// This action remains unchanged as it's a simulation.
export async function setNextResultAction(args: {
  winningNumber: NumberOption;
  winningColor: ColorOption;
  finalizedBy: "admin" | "random";
}): Promise<{ success: boolean; message: string; result?: GameResult }> {
  console.log("Admin setting next result:", args);
  
  const newResult: GameResult = {
    ...args,
    roundId: `round_${Date.now()}`,
    timestamp: Date.now(),
  };

  return { success: true, message: "Next result set successfully.", result: newResult };
}

// This action remains unchanged as it's a simulation.
export async function requestWithdrawalAction(args: {
    userId: string;
    amount: number;
}): Promise<{ success: boolean; message: string; request?: WithdrawalRequest}> {
    console.log("Withdrawal request:", args);

    if (args.amount < MIN_WITHDRAWAL_AMOUNT) {
        return { success: false, message: `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}.` };
    }

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
    
    return { success: true, message: "Withdrawal request submitted successfully.", request: newRequest };
}

/**
 * [ADMIN-ONLY] Processes a user's withdrawal request.
 * This action now uses the Firebase Admin SDK to bypass Firestore security rules.
 */
export async function processWithdrawalAction(args: {
    adminId: string;
    userId: string;
    amount: number;
    requestId: string;
}): Promise<{ success: boolean; message: string }> {
    if (!adminDb) {
        return { success: false, message: "Admin database is not configured. Check server logs." };
    }

    if (args.amount <= 0) {
        return { success: false, message: "Withdrawal amount must be positive." };
    }

    try {
        const adminUser = await getAdminUserDoc(args.adminId);
        if (!adminUser || !adminUser.isAdmin) {
            return { success: false, message: "Authorization Failed. Your account does not have privileges." };
        }

        const userToUpdate = await getAdminUserDoc(args.userId);
        if (!userToUpdate) {
            return { success: false, message: `User with ID ${args.userId} not found.` };
        }

        if (userToUpdate.walletBalance < args.amount) {
            return {
                success: false,
                message: `${userToUpdate.username}'s balance (₹${userToUpdate.walletBalance.toFixed(2)}) is insufficient.`,
            };
        }
        
        const userRef = adminDb.collection('users').doc(args.userId);
        await userRef.update({
            walletBalance: FieldValue.increment(-args.amount)
        });

        const newBalance = userToUpdate.walletBalance - args.amount;
        return { success: true, message: `Withdrawal approved. ${userToUpdate.username}'s new balance: ₹${newBalance.toFixed(2)}.` };
        
    } catch (error: any) {
        console.error("Error processing withdrawal with Admin SDK:", error);
        return { success: false, message: "A server error occurred. Check admin credentials and server logs." };
    }
}

/**
 * [ADMIN-ONLY] Fetches all users from Firestore using the Admin SDK.
 * This bypasses all client-side security rules.
 */
export async function getAllUsersAction(): Promise<User[]> {
    if (!adminDb) {
        console.error("Cannot get all users: Admin database is not configured.");
        return [];
    }
    
    try {
      const usersSnapshot = await adminDb.collection('users').get();
      const usersList = usersSnapshot.docs.map(doc => doc.data() as User);
      return usersList;
    } catch (error: any) {
        console.error("Error fetching all users with Admin SDK:", error);
        throw new Error("Failed to fetch users. Ensure Firebase Admin credentials are set correctly in your server environment.");
    }
}

/**
 * [ADMIN-ONLY] Updates a user's balance using the Admin SDK.
 */
export async function updateUserBalanceAction(adminId: string, userId: string, newBalance: number): Promise<{ success: boolean; message: string }> {
     if (!adminDb) {
        return { success: false, message: "Admin database is not configured. Check server logs." };
    }
    
    if (newBalance < 0) {
        return { success: false, message: "Balance cannot be negative." };
    }
    
    try {
        const adminUser = await getAdminUserDoc(adminId);
        if (!adminUser || !adminUser.isAdmin) {
            return { success: false, message: "Authorization Failed. You do not have privileges." };
        }

        const userRef = adminDb.collection('users').doc(userId);
        await userRef.update({ walletBalance: newBalance });
        
        const user = await getAdminUserDoc(userId);
        return { success: true, message: `Balance for ${user?.username || 'user'} updated to ₹${newBalance.toFixed(2)}.` };
    } catch (error: any) {
        console.error("Error updating balance with Admin SDK:", error);
        return { success: false, message: "A server error occurred. Check admin credentials and server logs." };
    }
}

/**
 * [ADMIN-ONLY] Approves a user's deposit request using the Admin SDK.
 */
export async function approveDepositAction(adminId: string, userId: string, depositAmount: number): Promise<{ success: boolean; message: string; newBalance?: number }> {
    if (!adminDb) {
        return { success: false, message: "Admin database is not configured. Check server logs." };
    }

    if (depositAmount <= 0) {
        return { success: false, message: "Deposit amount must be positive." };
    }

    try {
        const adminUser = await getAdminUserDoc(adminId);
        if (!adminUser || !adminUser.isAdmin) {
            return { success: false, message: "Authorization Failed. You do not have privileges." };
        }

        const userRef = adminDb.collection('users').doc(userId);
        const user = (await userRef.get()).data() as User | undefined;

        if (!user) {
            return { success: false, message: `User with ID ${userId} not found.` };
        }
        
        await userRef.update({
            walletBalance: FieldValue.increment(depositAmount)
        });

        const newBalance = user.walletBalance + depositAmount;
        return { success: true, message: `${user.username}'s balance is now ₹${newBalance.toFixed(2)}.`, newBalance };
    } catch (error: any) {
        console.error("Error approving deposit with Admin SDK:", error);
        return { success: false, message: "A server error occurred. Check admin credentials and server logs." };
    }
}
