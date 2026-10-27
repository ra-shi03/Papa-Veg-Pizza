import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: { type: String, enum: ['order', 'store', 'other'], required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null },
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', default: null },
        issueType: { type: String, required: true, trim: true },
        description: { type: String, default: '', trim: true },
        status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open', index: true },
        adminResponse: { type: String, default: '' },
        // Store side of a complaint (store manager screens): how urgent it is, photos from the customer,
        // the manager's replies and the final resolution.
        priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium', index: true },
        images: { type: [String], default: [] },
        responses: {
            type: [{
                _id: false,
                message: { type: String, required: true, trim: true, maxlength: 1000 },
                byName: { type: String, default: '', trim: true },
                byRole: { type: String, default: '', trim: true },
                at: { type: Date, default: Date.now }
            }],
            default: []
        },
        resolution: {
            type: new mongoose.Schema({
                actionTaken: { type: String, default: '', trim: true, maxlength: 500 },
                resolvedBy: { type: String, default: '', trim: true },
                resolvedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
                refundAmount: { type: Number, default: 0, min: 0 }, // promised to the customer; paid out by finance, not here
                replacementOrderId: { type: String, default: '', trim: true, maxlength: 60 },
                couponIssued: { type: String, default: '', trim: true, maxlength: 40 },
                evidenceImage: { type: String, default: '', maxlength: 2000 },
                resolvedAt: { type: Date, default: null }
            }, { _id: false }),
            default: undefined
        }
    },
    { collection: 'food_support_tickets', timestamps: true }
);

supportTicketSchema.index({ userId: 1, createdAt: -1 });
supportTicketSchema.index({ storeId: 1, createdAt: -1 });

export const FoodSupportTicket = mongoose.model('FoodSupportTicket', supportTicketSchema);
