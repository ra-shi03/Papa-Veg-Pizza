import mongoose from 'mongoose';

const kitchenTaskSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodOrder',
            required: true,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            required: true,
            index: true
        },
        // Staff accounts are User documents (the old 'FoodAdmin' ref pointed at a collection nobody writes to)
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        // 'supervisor' = oversees the whole order; 'staff' = one station (slot) of the order
        kind: {
            type: String,
            enum: ['supervisor', 'staff'],
            default: 'staff'
        },
        slot: {
            type: String,
            enum: ['pizza_chef', 'baking_chef', 'packaging_staff', null],
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'delayed'],
            default: 'pending',
            index: true
        },
        startedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        notes: {
            type: String,
            default: '',
            trim: true
        },
        completionNotes: { type: String, default: '', trim: true, maxlength: 1000 },
        proofImage: { type: String, default: '', maxlength: 2000 },
        delay: {
            reason: { type: String, default: '', trim: true, maxlength: 200 },
            remarks: { type: String, default: '', trim: true, maxlength: 1000 },
            minutes: { type: Number, default: 0 },
            reportedAt: { type: Date, default: null }
        },
        reassignRequest: {
            requested: { type: Boolean, default: false },
            reason: { type: String, default: '', trim: true, maxlength: 500 },
            preferredStaff: { type: String, default: '', trim: true, maxlength: 120 },
            requestedAt: { type: Date, default: null }
        }
    },
    {
        collection: 'food_kitchen_tasks',
        timestamps: true
    }
);

kitchenTaskSchema.index({ storeId: 1, assignedTo: 1, status: 1 });

export const KitchenTask = mongoose.model('KitchenTask', kitchenTaskSchema);
