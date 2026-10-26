import mongoose from 'mongoose';

// A problem reported from the baking / pizza stations (overcooked, wrong topping, oven fault, ...).
const kitchenIssueSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenItem', default: null },
        issueType: { type: String, required: true, trim: true, maxlength: 80 },
        severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
        remarks: { type: String, default: '', trim: true, maxlength: 1000 },
        image: { type: String, default: '', maxlength: 2000 },
        notifyManager: { type: Boolean, default: false },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { collection: 'food_kitchen_issues', timestamps: true }
);

kitchenIssueSchema.index({ storeId: 1, createdAt: -1 });

export const KitchenIssue = mongoose.model('KitchenIssue', kitchenIssueSchema);
