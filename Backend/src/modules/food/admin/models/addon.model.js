import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true }, // e.g. topping, extra cheese, dip
  prices: [{
    size: { type: String, required: true }, // e.g. Small, Medium, Large, Regular, Default
    price: { type: Number, required: true, default: 0 }
  }],
  image: { type: String, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

export const Addon = mongoose.model('Addon', addonSchema);
