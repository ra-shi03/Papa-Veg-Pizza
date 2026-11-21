import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
    {
        deliveryPartnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodDeliveryPartner',
            required: true,
            index: true
        },
        ticketId: {
            type: String,
            unique: true,
            sparse: true
        },
        subject: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        category: {
            type: String,
            enum: ['payment', 'account', 'technical', 'order', 'other'],
            default: 'other'
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium'
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open'
        },
        adminResponse: { type: String },
        respondedAt: { type: Date },
        // Who handles it: the rider's store and franchise when the ticket is raised (riderTickets.service.js)
        storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', default: null, index: true },
        franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null, index: true },
        handledBy: {
            role: { type: String, default: '' },
            userId: { type: mongoose.Schema.Types.ObjectId, default: null },
            name: { type: String, default: '' },
            at: { type: Date, default: null }
        },
        activity: [{
            _id: false,
            at: { type: Date, default: Date.now },
            byRole: { type: String, default: '' },
            byName: { type: String, default: '' },
            status: { type: String, default: '' },
            note: { type: String, default: '' }
        }]
    },
    { collection: 'food_delivery_support_tickets', timestamps: true }
);

supportTicketSchema.index({ deliveryPartnerId: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

export const DeliverySupportTicket = mongoose.model('DeliverySupportTicket', supportTicketSchema);
