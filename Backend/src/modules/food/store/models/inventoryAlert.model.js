import mongoose from 'mongoose';

// A low-stock alert. Raised automatically when a counted ingredient falls to its minimum; cleared
// automatically when stock is back above it, or by the manager with a note.
const inventoryAlertSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', required: true },
        ingredientName: { type: String, default: '', trim: true },
        alertType: { type: String, default: 'low_stock' },
        currentStock: { type: Number, default: 0, min: 0 },
        minimumStock: { type: Number, default: 0, min: 0 },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
        status: { type: String, enum: ['active', 'resolved'], default: 'active', index: true },
        resolvedBy: { type: String, default: '', trim: true },
        resolvedAt: { type: Date, default: null },
        resolutionNote: { type: String, default: '', trim: true, maxlength: 600 }
    },
    { collection: 'food_inventory_alerts', timestamps: true }
);

inventoryAlertSchema.index({ storeId: 1, ingredientId: 1, status: 1 });

export const InventoryAlert = mongoose.model('InventoryAlert', inventoryAlertSchema);
