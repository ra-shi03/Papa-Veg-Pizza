import mongoose from 'mongoose';

const categoryProductSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    trim: true
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
  }
}, { timestamps: true });

export const CategoryProduct = mongoose.models.CategoryProduct || mongoose.model('CategoryProduct', categoryProductSchema);
