import mongoose from 'mongoose';

const bulkOrderInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    organisation: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    location: {
      type: String,
      trim: true,
      default: ''
    },
    eventDate: {
      type: String,
      trim: true,
      default: ''
    },
    occasion: {
      type: String,
      trim: true,
      default: 'Corporate Gathering (20-50 people)'
    },
    query: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['virtual_party', 'bulk_catering', 'egift_voucher'],
      default: 'virtual_party'
    },
    // new -> confirmed -> preparing -> ready -> completed, or rejected / cancelled. in_progress and contacted are the
    // older statuses of inquiries made before stores handled them.
    status: {
      type: String,
      enum: ['new', 'confirmed', 'preparing', 'ready', 'completed', 'rejected', 'cancelled', 'in_progress', 'contacted'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    // The bulk order a customer places at a store (virtual party): the store confirms, prepares and hands it over.
    reference: { type: String, unique: true, sparse: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore', default: null, index: true },
    franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise', default: null, index: true },
    fulfilment: { type: String, enum: ['takeaway', 'delivery'], default: 'takeaway' },
    address: {
      street: { type: String, trim: true, default: '' },
      landmark: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' }
    },
    partySize: { type: String, trim: true, default: '' },
    eventTime: { type: String, trim: true, default: '' },
    // What the customer picked, priced at the store's own prices when they sent it
    items: [
      {
        _id: false,
        itemId: { type: String, default: '' },
        name: { type: String, default: '' },
        size: { type: String, default: '' },
        crust: { type: String, default: '' },
        price: { type: Number, min: 0, default: 0 },
        quantity: { type: Number, min: 1, default: 1 }
      }
    ],
    estimatedTotal: { type: Number, min: 0, default: null },
    quotedAmount: { type: Number, min: 0, default: null },
    storeNote: { type: String, trim: true, default: '' },
    reasonText: { type: String, trim: true, default: '' },
    history: [
      {
        _id: false,
        status: String,
        at: { type: Date, default: Date.now },
        byRole: { type: String, default: '' },
        byId: { type: String, default: '' },
        note: { type: String, default: '' }
      }
    ]
  },
  {
    collection: 'food_bulk_order_inquiries',
    timestamps: true
  }
);

export const BulkOrderInquiry = mongoose.model('BulkOrderInquiry', bulkOrderInquirySchema);

