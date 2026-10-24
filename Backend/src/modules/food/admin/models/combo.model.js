import mongoose from 'mongoose';

// One selectable option inside a "choice" component (e.g. Coke / Lahori Jeera)
const comboChoiceSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
        addonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Addon', default: null },
        name: { type: String, required: true, trim: true },
        size: { type: String, trim: true, default: '' }
    },
    { _id: true }
);

// A component of the meal. Fixed when `choices` is empty, otherwise the customer picks one choice.
const comboItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
        addonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Addon', default: null },
        name: { type: String, required: true, trim: true },
        size: { type: String, trim: true, default: '' },
        quantity: { type: Number, default: 1, min: 1 },
        unitPrice: { type: Number, default: 0, min: 0 },
        choices: { type: [comboChoiceSchema], default: [] }
    },
    { _id: true }
);

export const COMBO_TYPES = ['fixed', 'meal', 'bogo', 'seasonal', 'custom'];
export const COMBO_STATUSES = ['active', 'inactive', 'draft', 'scheduled', 'expired', 'archived'];
export const COMBO_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const comboSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        description: { type: String, trim: true, default: '' },
        image: { type: String, trim: true, default: '' },
        badge: { type: String, trim: true, default: '' },
        comboType: { type: String, enum: COMBO_TYPES, default: 'meal' },
        // Menu section the meal is listed under in the user app (e.g. Meal for 1 / Meal for 2)
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryProduct', default: null, index: true },
        items: { type: [comboItemSchema], default: [] },

        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, default: 0, min: 0 },
        discountType: { type: String, enum: ['fixed', 'percentage', 'flat'], default: 'fixed' },
        discountValue: { type: Number, default: 0, min: 0 },

        validFrom: { type: Date, default: null },
        validTo: { type: Date, default: null },
        weeklyRestrictions: [{ type: String, enum: COMBO_WEEKDAYS }],
        timeWindowStart: { type: String, trim: true, default: '' },
        timeWindowEnd: { type: String, trim: true, default: '' },

        applicabilityType: { type: String, enum: ['all', 'franchises', 'stores'], default: 'all' },
        applicableFranchises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise' }],
        applicableStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore' }],

        status: { type: String, enum: COMBO_STATUSES, default: 'active', index: true },
        sortOrder: { type: Number, default: 0 },
        createdBy: { type: String, trim: true, default: '' },
        updatedBy: { type: String, trim: true, default: '' }
    },
    {
        collection: 'food_combos',
        timestamps: true
    }
);

comboSchema.index({ status: 1, categoryId: 1, sortOrder: 1 });

export const FoodCombo = mongoose.model('FoodCombo', comboSchema);
