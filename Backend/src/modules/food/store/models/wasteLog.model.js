import mongoose from 'mongoose';

// Spoiled / burnt / dropped ingredients. Reporting takes the quantity out of stock straight away; the
// manager then approves the write-off (or deletes a mistaken report, which puts the stock back).
const timelineSchema = new mongoose.Schema(
    {
        user: { type: String, default: '' },
        action: { type: String, default: '' },
        remarks: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const wasteLogSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', required: true },
        ingredientName: { type: String, default: '', trim: true },
        unit: { type: String, default: '', trim: true },
        quantity: { type: Number, required: true, min: 0.01 },
        wasteType: { type: String, enum: ['expired', 'burnt', 'damaged', 'spillage'], required: true },
        reason: { type: String, default: '', trim: true, maxlength: 600 },
        remarks: { type: String, default: '', trim: true, maxlength: 600 },
        estimatedLoss: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ['pending', 'approved', 'deleted'], default: 'pending', index: true },
        images: { type: [String], default: [] },
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        reportedByName: { type: String, default: '', trim: true },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        approvedByName: { type: String, default: '', trim: true },
        timeline: { type: [timelineSchema], default: [] }
    },
    { collection: 'food_waste_logs', timestamps: true }
);

wasteLogSchema.index({ storeId: 1, createdAt: -1 });

export const WasteLog = mongoose.model('WasteLog', wasteLogSchema);
