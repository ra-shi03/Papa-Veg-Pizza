import mongoose from 'mongoose';

const categoryProductSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  badge: {
    type: String,
    trim: true,
    default: ''
  },
  icon: {
    type: String,
    trim: true
  },
  borderColor: {
    type: String,
    trim: true,
    default: '#E4E4E7'
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  type: {
    type: String,
    enum: ['Category', 'Product'],
    default: 'Category'
  },
  sort: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export const CategoryProduct = mongoose.models.CategoryProduct || mongoose.model('CategoryProduct', categoryProductSchema);
