import mongoose from 'mongoose';

const kitchenTaskSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
            index: true
        },
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodStore',
            required: true,
            index: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin',
            default: null,
            index: true
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodAdmin',
            default: null
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed'],
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
        }
    },
    {
        collection: 'food_kitchen_tasks',
        timestamps: true
    }
);

export const KitchenTask = mongoose.model('KitchenTask', kitchenTaskSchema);
