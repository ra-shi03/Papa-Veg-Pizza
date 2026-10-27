import mongoose from 'mongoose';

// Kitchen -> store room: "give me N of this ingredient". The manager approves a quantity and then fulfils it,
// which takes it out of stock. The My Tasks "request ingredient" modal creates the same document, so there
// is one source of truth for ingredient requests.
const stockRequestSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        requestNo: { type: String, required: true },
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', default: null },
        ingredientName: { type: String, required: true, trim: true, maxlength: 120 },
        unit: { type: String, default: '', trim: true, maxlength: 30 },
        requestedQty: { type: Number, required: true, min: 0.01 },
        approvedQty: { type: Number, default: 0, min: 0 },
        deliveredQty: { type: Number, default: 0, min: 0 },
        urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
        reason: { type: String, default: '', trim: true, maxlength: 500 },
        remarks: { type: String, default: '', trim: true, maxlength: 600 },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'fulfilled'], default: 'pending', index: true },
        source: { type: String, enum: ['inventory', 'my_tasks'], default: 'inventory' },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenTask', default: null },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        requestedByName: { type: String, default: '', trim: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        approvedByName: { type: String, default: '', trim: true },
        approvedAt: { type: Date, default: null },
        fulfilledAt: { type: Date, default: null }
    },
    { collection: 'food_stock_requests', timestamps: true }
);

stockRequestSchema.index({ storeId: 1, requestNo: 1 }, { unique: true });
stockRequestSchema.index({ storeId: 1, createdAt: -1 });

export const StockRequest = mongoose.model('StockRequest', stockRequestSchema);
