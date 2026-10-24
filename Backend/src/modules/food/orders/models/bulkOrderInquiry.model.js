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
    status: {
      type: String,
      enum: ['new', 'in_progress', 'contacted', 'completed', 'rejected'],
      default: 'new'
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    collection: 'food_bulk_order_inquiries',
    timestamps: true
  }
);

export const BulkOrderInquiry = mongoose.model('BulkOrderInquiry', bulkOrderInquirySchema);

