import mongoose from 'mongoose';

// Weekly opening hours, holidays and a temporary closure for one store. Times are "HH:MM" (24h, server local time).
// open === close means open all day; close < open means the store closes after midnight.
// A store without a record is open all day, every day (stores created before hours existed keep taking orders).

const daySchema = new mongoose.Schema(
    {
        open: { type: String, default: '00:00' },
        close: { type: String, default: '00:00' },
        isClosed: { type: Boolean, default: false }
    },
    { _id: false }
);

const weekFields = Object.fromEntries(
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [d, { type: daySchema, default: () => ({}) }])
);

const holidaySchema = new mongoose.Schema(
    {
        date: { type: String, required: true }, // YYYY-MM-DD
        reason: { type: String, default: '', trim: true, maxlength: 200 },
        isClosed: { type: Boolean, default: true },
        open: { type: String, default: '' },
        close: { type: String, default: '' }
    },
    { _id: false }
);

const closureSchema = new mongoose.Schema(
    {
        active: { type: Boolean, default: false },
        reason: { type: String, default: '', trim: true, maxlength: 300 },
        startDate: { type: String, default: '' }, // YYYY-MM-DD, empty = from now
        endDate: { type: String, default: '' }, // YYYY-MM-DD, empty = until reopened
        comments: { type: String, default: '', trim: true, maxlength: 1000 },
        by: { type: String, default: '' },
        at: { type: Date, default: null }
    },
    { _id: false }
);

const auditSchema = new mongoose.Schema(
    {
        updatedBy: { type: String, default: '' },
        action: { type: String, default: '' },
        date: { type: Date, default: Date.now },
        remarks: { type: String, default: '' }
    },
    { _id: false }
);

const storeHoursSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, unique: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', required: true, index: true },
        week: { type: new mongoose.Schema(weekFields, { _id: false }), default: () => ({}) },
        holidays: { type: [holidaySchema], default: [] },
        closure: { type: closureSchema, default: () => ({}) },
        auditLogs: { type: [auditSchema], default: [] },
        updatedBy: { type: String, default: '' }
    },
    { collection: 'food_store_hours', timestamps: true }
);

export const StoreHours = mongoose.model('StoreHours', storeHoursSchema);
