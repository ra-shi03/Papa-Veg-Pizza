import mongoose from 'mongoose';

// In-app notifications for the My Tasks screens: task assigned, delay reported, reassignment...
const taskNotificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true },
        taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'KitchenTask', default: null },
        type: {
            type: String,
            enum: ['task_assigned', 'task_delayed', 'reassign_requested', 'task_reassigned'],
            required: true
        },
        title: { type: String, required: true, trim: true },
        message: { type: String, default: '', trim: true },
        isRead: { type: Boolean, default: false }
    },
    { collection: 'food_task_notifications', timestamps: true }
);

taskNotificationSchema.index({ userId: 1, createdAt: -1 });

export const TaskNotification = mongoose.model('TaskNotification', taskNotificationSchema);
