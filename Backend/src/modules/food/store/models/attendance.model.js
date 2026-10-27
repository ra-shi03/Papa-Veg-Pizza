import mongoose from 'mongoose';

// One attendance record per staff member per day (the day the shift was started). Written by the staff member clocking
// in and out, or by the store manager marking it. storeId / franchiseId / userId come from the token or from the staff
// record, never from a request body.
const attendanceSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null, index: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager', required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        shiftId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreShift', default: null },
        date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },   // YYYY-MM-DD, store (server) local time
        checkInAt: { type: Date, default: null },
        checkOutAt: { type: Date, default: null },
        totalHours: { type: Number, default: 0, min: 0 },
        overtimeHours: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ['present', 'absent', 'half_day', 'leave'], default: 'present' },
        late: { type: Boolean, default: false },
        lateMinutes: { type: Number, default: 0, min: 0 },
        source: { type: String, enum: ['self', 'manager'], default: 'self' },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        markedByName: { type: String, default: '', trim: true },
        notes: { type: String, default: '', trim: true, maxlength: 300 },
    },
    { timestamps: true, collection: 'food_store_attendance' },
);

attendanceSchema.index({ storeId: 1, staffId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ storeId: 1, date: 1 });

export const StoreAttendance = mongoose.models.StoreAttendance || mongoose.model('StoreAttendance', attendanceSchema);
