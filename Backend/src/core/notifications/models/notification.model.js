import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        ownerType: {
            type: String,
            enum: ['USER', 'STORE', 'DELIVERY_PARTNER'],
            required: true,
            index: true
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        link: {
            type: String,
            default: '',
            trim: true
        },
        category: {
            type: String,
            default: 'broadcast',
            trim: true
        },
        source: {
            type: String,
            enum: ['ADMIN_BROADCAST', 'FSSAI_EXPIRY'],
            default: 'ADMIN_BROADCAST',
            index: true
        },
        broadcastId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BroadcastNotification',
            // No default: a notice that is not from a broadcast (ticket reply, FSSAI expiry) has no broadcastId at all, so the
            // sparse unique (broadcastId, owner) index skips it. A null default made every owner hold only one such notice.
            index: true
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: {
            type: Date,
            default: null
        },
        dismissedAt: {
            type: Date,
            default: null,
            index: true
        }
    },
    {
        collection: 'food_notifications',
        timestamps: true
    }
);

notificationSchema.index({ ownerType: 1, ownerId: 1, createdAt: -1 });
notificationSchema.index({ ownerType: 1, ownerId: 1, isRead: 1, dismissedAt: 1 });
// One copy of a broadcast per recipient. Partial, not sparse: a compound sparse index still covers every row that has
// ownerType / ownerId, which let each person hold only one notice that is not from a broadcast.
notificationSchema.index(
    { broadcastId: 1, ownerType: 1, ownerId: 1 },
    { name: 'broadcast_owner_unique', unique: true, partialFilterExpression: { broadcastId: { $exists: true } } }
);

export const FoodNotification = mongoose.model('FoodNotification', notificationSchema);

/** Older databases have the sparse version of that index under its default name; drop it once at start-up. */
export async function dropLegacyNotificationIndex() {
    try {
        await FoodNotification.collection.dropIndex('broadcastId_1_ownerType_1_ownerId_1');
    } catch {
        // not there (new database, or already dropped)
    }
    // the automatic index build may have been refused while the old index still held the same keys
    await FoodNotification.createIndexes().catch(() => {});
}
