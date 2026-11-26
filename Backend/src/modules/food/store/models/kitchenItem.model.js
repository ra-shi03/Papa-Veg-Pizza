import mongoose from 'mongoose';

// One row per line item of an order that is in the kitchen. Order-level progress lives on the order
// (kitchen.stage); this tracks each pizza through the stations: prep board -> pizza station -> baking.
//
//   assigned -> dough_prep -> sauce -> toppings -> ready_for_baking -> baking -> baked
//
// The three station screens are different views of this one lifecycle (see kitchenItems.service.js).
export const ITEM_STAGES = ['assigned', 'dough_prep', 'sauce', 'toppings', 'ready_for_baking', 'baking', 'baked'];

const kitchenItemSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', required: true, index: true },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        index: { type: Number, required: true, min: 0 }, // position among the order's kitchen cards
        // Which order line this card belongs to (position in order.items). A combo has one card per pizza in it, so
        // several cards share a lineIndex. Cards made before combos have none: their index is the line.
        lineIndex: { type: Number, default: null, min: 0 },
        comboName: { type: String, default: '', trim: true },
        name: { type: String, default: '', trim: true },
        size: { type: String, default: '', trim: true },
        crust: { type: String, default: '', trim: true },
        toppings: { type: [String], default: [] },
        quantity: { type: Number, default: 1, min: 1 },

        stage: { type: String, enum: ITEM_STAGES, default: 'assigned', index: true },
        // A specific chef / baker chosen for this item; otherwise the order's pizza_chef / baking_chef slot applies.
        // chefStaffId / bakerStaffId are staff records; chefId / bakerId are User ids on cards from before kitchen staff
        // lost their logins (kept for history only).
        chefStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager', default: null },
        bakerStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager', default: null },
        chefId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        chefName: { type: String, default: '', trim: true },
        bakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        bakerName: { type: String, default: '', trim: true },

        prepStartedAt: { type: Date, default: null },
        assemblyCompletedAt: { type: Date, default: null },
        paused: { type: Boolean, default: false },
        pauseReason: { type: String, default: '', trim: true, maxlength: 200 },
        pauseNotes: { type: String, default: '', trim: true, maxlength: 500 },

        ovenId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenOven', default: null },
        temperature: { type: Number, default: 250, min: 0, max: 600 },
        expectedDuration: { type: Number, default: 8, min: 1, max: 120 }, // minutes in the oven
        bakeStartedAt: { type: Date, default: null },
        bakeCompletedAt: { type: Date, default: null },
        remarks: { type: String, default: '', trim: true, maxlength: 500 },

        rejected: { type: Boolean, default: false },
        rejectReason: { type: String, default: '', trim: true, maxlength: 300 }
    },
    { collection: 'food_kitchen_items', timestamps: true }
);

kitchenItemSchema.index({ orderId: 1, index: 1 }, { unique: true });
kitchenItemSchema.index({ storeId: 1, stage: 1 });

export const KitchenItem = mongoose.model('KitchenItem', kitchenItemSchema);
