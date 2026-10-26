import mongoose from 'mongoose';

// A support ticket raised by a store (customer tickets are FoodSupportTicket). Holds the fields the super-admin
// ticket list already reads; store-side complaint endpoints are still on the pending list.
const storeSupportTicketSchema = new mongoose.Schema(
    {
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', required: true, index: true },
        category: { type: String, trim: true, default: 'other' },
        issueType: { type: String, required: true, trim: true },
        subject: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        orderRef: { type: String, trim: true, default: '' },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open', index: true },
        adminResponse: { type: String, default: '' }
    },
    { collection: 'food_store_support_tickets', timestamps: true }
);

storeSupportTicketSchema.index({ storeId: 1, createdAt: -1 });

export const FoodStoreSupportTicket = mongoose.model('FoodStoreSupportTicket', storeSupportTicketSchema);
