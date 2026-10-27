import mongoose from 'mongoose';

// A work shift of ONE store (Morning, Afternoon, Night ...). Staff are assigned to a shift by their StoreManager record id
// (the id the staff screens call "staffId"). storeId / franchiseId always come from the token, never from a request body.
const shiftSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null, index: true },
        shiftName: { type: String, required: true, trim: true, maxlength: 60 },
        // lower-case name: one shift name per store
        nameKey: { type: String, required: true },
        startTime: { type: String, required: true },   // "09:00 AM" (what the screens show)
        endTime: { type: String, required: true },
        startMinutes: { type: Number, required: true, min: 0, max: 1439 },   // minutes after midnight, for lateness and hours
        endMinutes: { type: Number, required: true, min: 0, max: 1439 },
        breakMinutes: { type: Number, default: 0, min: 0, max: 240 },
        maxStaff: { type: Number, default: 5, min: 1, max: 200 },
        assignedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StoreManager' }],
        status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
        description: { type: String, default: '', trim: true, maxlength: 300 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        createdByName: { type: String, default: '', trim: true },
    },
    { timestamps: true, collection: 'food_store_shifts' },
);

shiftSchema.index({ storeId: 1, nameKey: 1 }, { unique: true });

export const StoreShift = mongoose.models.StoreShift || mongoose.model('StoreShift', shiftSchema);
