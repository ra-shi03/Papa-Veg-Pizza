import mongoose from 'mongoose';

// A supervisor's quality sign-off on a finished order (My Tasks -> Quality Check).
const qualityCheckSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true, index: true },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenTask', default: null },
        checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        temperature: { type: Number, default: null, min: 0, max: 400 },
        toppingsCorrect: { type: Boolean, default: true },
        crustCorrect: { type: Boolean, default: true },
        remarks: { type: String, default: '', trim: true, maxlength: 1000 }
    },
    { collection: 'food_quality_checks', timestamps: true }
);

qualityCheckSchema.index({ storeId: 1, createdAt: -1 });

export const QualityCheck = mongoose.model('QualityCheck', qualityCheckSchema);
