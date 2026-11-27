import mongoose from 'mongoose';

// What went between a store and its Pet Pooja, one row per message (services/posOutbox.service.js and posCallback.service.js).
// It is also the outbox: an 'out' row waiting to be sent is 'pending' with a nextAttemptAt.
//
//   direction  out = this app -> Pet Pooja (save_order, cancel_order, test, menu_fetch),
//              in  = Pet Pooja -> this app (status_callback, menu_push, item_stock, store_status)
//   status     out: pending -> sent | failed (after the last retry) | skipped (the store is not set up: retry once it is)
//              in:  applied (the order moved) | ignored (nothing to do, e.g. already accepted) | failed (could not apply)
// No keys, no customer phone or address are kept here: only ids, states and a short note.
export const POS_SYNC_STATUSES = ['pending', 'sent', 'failed', 'skipped', 'applied', 'ignored'];

const posSyncLogSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null, index: true },
        orderNumber: { type: String, default: '', trim: true },
        provider: { type: String, enum: ['petpooja'], default: 'petpooja' },
        direction: { type: String, enum: ['out', 'in'], required: true },
        action: { type: String, enum: ['save_order', 'cancel_order', 'test', 'status_callback', 'menu_fetch', 'menu_push', 'item_stock', 'store_status'], required: true },
        status: { type: String, enum: POS_SYNC_STATUSES, required: true, index: true },
        attempts: { type: Number, default: 0, min: 0 },
        nextAttemptAt: { type: Date, default: null, index: true },
        lastError: { type: String, default: '', maxlength: 500 },
        note: { type: String, default: '', maxlength: 500 },
        posOrderId: { type: String, default: '', trim: true },
        posStatus: { type: String, default: '', trim: true },
        // one save / cancel per order (a retry reuses the row)
        dedupeKey: { type: String, default: undefined },
    },
    { timestamps: true, collection: 'food_pos_sync_logs' },
);

posSyncLogSchema.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
posSyncLogSchema.index({ storeId: 1, createdAt: -1 });
posSyncLogSchema.index({ status: 1, nextAttemptAt: 1 });

export const PosSyncLog = mongoose.models.PosSyncLog || mongoose.model('PosSyncLog', posSyncLogSchema);
