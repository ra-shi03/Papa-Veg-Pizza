import { recordTransaction, ensureWallet, getBalance, getTransactionsByEntity } from './transaction.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Universal wallet service — facade over transaction.service for
 * common wallet operations (credit, debit, lock, unlock, get balance).
 *
 * Each entity type has its own Mongoose model, but this service
 * provides a unified interface.
 *
 * Customer (user) wallets are NOT handled here — they live in walletAccounts/walletTransactions
 * and are changed only through modules/food/user/services/walletLedger.service.js.
 */

/**
 * Credit an entity's wallet.
 */
export async function creditWallet({
    entityType, entityId, amount, description,
    category = 'other', orderId, paymentId, metadata
}) {
    return recordTransaction({
        entityType,
        entityId: String(entityId),
        type: 'credit',
        amount: Number(amount),
        description,
        category,
        orderId: orderId ? String(orderId) : null,
        paymentId: paymentId ? String(paymentId) : null,
        metadata
    });
}

/**
 * Debit an entity's wallet.
 */
export async function debitWallet({
    entityType, entityId, amount, description,
    category = 'other', orderId, paymentId, metadata
}) {
    return recordTransaction({
        entityType,
        entityId: String(entityId),
        type: 'debit',
        amount: Number(amount),
        description,
        category,
        orderId: orderId ? String(orderId) : null,
        paymentId: paymentId ? String(paymentId) : null,
        metadata
    });
}

/**
 * Get wallet info for any entity.
 */
export async function getWalletBalance(entityType, entityId) {
    return getBalance(entityType, entityId);
}

/**
 * Get wallet + recent transactions for any entity.
 */
export async function getWalletWithTransactions(entityType, entityId, { page = 1, limit = 20 } = {}) {
    const [balance, txns] = await Promise.all([
        getBalance(entityType, entityId),
        getTransactionsByEntity(entityType, entityId, { page, limit })
    ]);

    return {
        ...balance,
        ...txns
    };
}

/**
 * Lock amount in wallet (for pending settlements).
 * Locked amount cannot be withdrawn but is still part of balances.
 */
export async function lockWalletAmount(entityType, entityId, amount) {
    const wallet = await ensureWallet(entityType, entityId);
    const available = (Number(wallet.balance) || 0) - (Number(wallet.lockedAmount) || 0);

    if (amount > available) {
        throw new Error(`Cannot lock ${amount}. Available: ${available}`);
    }

    wallet.lockedAmount = (Number(wallet.lockedAmount) || 0) + amount;
    await wallet.save();

    logger.info(`Locked ${amount} for ${entityType}:${entityId}. Total locked: ${wallet.lockedAmount}`);
    return { lockedAmount: wallet.lockedAmount, balance: wallet.balance };
}

/**
 * Unlock amount in wallet (after settlement is processed/cancelled).
 */
export async function unlockWalletAmount(entityType, entityId, amount) {
    const wallet = await ensureWallet(entityType, entityId);
    wallet.lockedAmount = Math.max(0, (Number(wallet.lockedAmount) || 0) - amount);
    await wallet.save();

    logger.info(`Unlocked ${amount} for ${entityType}:${entityId}. Total locked: ${wallet.lockedAmount}`);
    return { lockedAmount: wallet.lockedAmount, balance: wallet.balance };
}
