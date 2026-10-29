import mongoose from 'mongoose';

const amount = { type: Number, default: 0, min: 0 };

// One row of the customer app's Nutrition Information page, managed by the super admin.
const nutritionItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: '' },
        category: { type: String, trim: true, default: 'Pizzas', index: true },
        image: { type: String, trim: true, default: '' },
        productId: { type: String, trim: true, default: '' },
        servingSize: { type: String, trim: true, default: '' },
        calories: amount,
        totalFat: amount, // g
        satFat: amount, // g
        transFat: amount, // g
        cholesterol: amount, // mg
        sodium: amount, // mg
        carbs: amount, // g
        fiber: amount, // g
        sugars: amount, // g
        protein: amount, // g
        calcium: amount, // % daily value
        iron: amount, // % daily value
        allergens: [{ type: String, trim: true }],
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true, index: true }
    },
    { collection: 'food_nutrition_items', timestamps: true }
);

nutritionItemSchema.index({ isActive: 1, sortOrder: 1 });

// The page copy around the items (a single document).
const nutritionPageSchema = new mongoose.Schema(
    {
        headline: { type: String, trim: true, default: 'Nutrition & Allergens' },
        intro: { type: String, trim: true, default: 'Know what goes into every slice. Values are per serving.' },
        allergenNote: { type: String, trim: true, default: 'All items are prepared in a 100% vegetarian kitchen using shared equipment.' },
        disclaimer: { type: String, trim: true, default: 'Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.' }
    },
    { collection: 'food_nutrition_page', timestamps: true }
);

export const FoodNutritionItem = mongoose.models.FoodNutritionItem || mongoose.model('FoodNutritionItem', nutritionItemSchema);
export const FoodNutritionPage = mongoose.models.FoodNutritionPage || mongoose.model('FoodNutritionPage', nutritionPageSchema);
