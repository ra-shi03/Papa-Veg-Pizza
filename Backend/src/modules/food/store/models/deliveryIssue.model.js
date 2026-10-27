import mongoose from 'mongoose';

// A delivery problem a store manager logs against an order (Delivery Issues screen): late, rider unreachable,
// wrong address, ... Resolving it can reassign the rider and record a refund request or a rider penalty note.
// Recording only: no money moves from here (finance is deferred).

const deliveryIssueSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true },
        orderRef: { type: String, default: '' },
        riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDeliveryPartner', default: null },
        riderName: { type: String, default: '' },
        issueType: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, default: '', trim: true, maxlength: 1000 },
        reportedBy: { type: String, default: 'Store Manager', trim: true, maxlength: 60 },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
        status: { type: String, enum: ['open', 'in_progress', 'resolved', 'escalated', 'closed'], default: 'open' },
        resolution: { type: String, default: '', trim: true, maxlength: 1000 },
        refundAmount: { type: Number, default: 0, min: 0 },
        refundRequestId: { type: mongoose.Schema.Types.ObjectId, default: null },
        penaltyAmount: { type: Number, default: 0, min: 0 },
        resolvedAt: { type: Date, default: null },
        createdById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    { collection: 'food_delivery_issues', timestamps: true }
);

deliveryIssueSchema.index({ storeId: 1, createdAt: -1 });

export const DeliveryIssue = mongoose.model('DeliveryIssue', deliveryIssueSchema);
