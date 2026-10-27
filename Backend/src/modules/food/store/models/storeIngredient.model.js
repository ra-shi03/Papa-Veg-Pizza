import mongoose from 'mongoose';

// One ingredient (or packaging item) a store keeps in stock. Status (available / low_stock / out_of_stock)
// is derived from the numbers, never stored. `tracked` turns true at the first stock count, so a freshly
// created store does not raise alerts for things nobody has counted yet.
const storeIngredientSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        ingredientName: { type: String, required: true, trim: true, maxlength: 120 },
        nameKey: { type: String, required: true }, // lower-cased name, unique per store
        category: { type: String, default: 'Other', trim: true, maxlength: 60 },
        unit: { type: String, default: 'KG', trim: true, maxlength: 30 },
        currentStock: { type: Number, default: 0, min: 0 },
        minimumStock: { type: Number, default: 0, min: 0 },
        reorderLevel: { type: Number, default: 0, min: 0 },
        costPerUnit: { type: Number, default: 0, min: 0 },
        supplierId: { type: String, default: '', trim: true, maxlength: 60 },
        supplierName: { type: String, default: '', trim: true, maxlength: 120 },
        tracked: { type: Boolean, default: false },
        lastUpdatedBy: { type: String, default: '', trim: true }
    },
    { collection: 'food_store_ingredients', timestamps: true }
);

storeIngredientSchema.index({ storeId: 1, nameKey: 1 }, { unique: true });

export const StoreIngredient = mongoose.model('StoreIngredient', storeIngredientSchema);
