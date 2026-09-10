import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isSystemRole: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    collection: 'roles'
});

export const Role = mongoose.model('Role', roleSchema);
