import mongoose from 'mongoose';

// How a pizza is made and what it uses (Recipe modal on the preparation board / pizza station). Matched to
// order items by name; the ingredient lines also tell a shortage which live orders it holds up.
const recipeSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        nameKey: { type: String, required: true },
        recipeCode: { type: String, default: '', trim: true, maxlength: 40 },
        image: { type: String, default: '', maxlength: 2000 },
        prepTime: { type: Number, default: 10, min: 0, max: 240 }, // minutes
        difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
        ingredients: {
            type: [{
                _id: false,
                ingredientId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreIngredient', default: null },
                name: { type: String, required: true, trim: true, maxlength: 120 },
                quantity: { type: Number, required: true, min: 0 },
                unit: { type: String, default: '', trim: true, maxlength: 30 }
            }],
            default: []
        },
        instructions: { type: [String], default: [] }
    },
    { collection: 'food_recipes', timestamps: true }
);

recipeSchema.index({ storeId: 1, nameKey: 1 }, { unique: true });

export const Recipe = mongoose.model('Recipe', recipeSchema);
