import mongoose from 'mongoose';

// A kitchen supervisor / kitchen staff member asks for leave; the store manager of their store accepts or rejects it.
// An accepted request becomes 'leave' attendance records, one per day (see leaveRequests.service.js).
export const LEAVE_CATEGORIES = ['Sick', 'Personal', 'Emergency', 'Vacation', 'Other'];

const leaveRequestSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        staffName: { type: String, trim: true, default: '' },
        role: { type: String, trim: true, default: '' },
        category: { type: String, enum: LEAVE_CATEGORIES, required: true },
        startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        endDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
        days: { type: Number, required: true, min: 1 },
        reason: { type: String, required: true, trim: true, maxlength: 300 },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending', index: true },
        decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        decidedByName: { type: String, trim: true, default: '' },
        decidedAt: { type: Date, default: null },
        rejectionReason: { type: String, trim: true, default: '', maxlength: 300 },
        skippedDays: { type: [String], default: [] },
    },
    { timestamps: true, collection: 'food_leave_requests' },
);

leaveRequestSchema.index({ storeId: 1, status: 1, createdAt: -1 });

export const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema);
