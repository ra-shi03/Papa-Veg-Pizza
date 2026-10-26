import mongoose from 'mongoose';

// A delayed order escalated to a manager / supervisor (Delayed Orders screen).
const kitchenEscalationSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true, index: true },
        severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
        reason: { type: String, default: '', trim: true, maxlength: 500 },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        notes: { type: String, default: '', trim: true, maxlength: 1000 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
    },
    { collection: 'food_kitchen_escalations', timestamps: true }
);

export const KitchenEscalation = mongoose.model('KitchenEscalation', kitchenEscalationSchema);
