import mongoose from 'mongoose';

const personalDetailsSchema = new mongoose.Schema({
  address: { type: String, trim: true },
  emergencyContact: { type: String, trim: true },
  salary: { type: Number, min: 0 }
}, { _id: false });

const storeManagerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodUser',
    default: null,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  employeeCode: {
    type: String,
    required: [true, 'Employee code is required'],
    unique: true,
    trim: true,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Suspended', 'DELETED'],
    default: 'Active',
  },
  storeId: {
    type: String, // Kept simple
    required: false,
    trim: true
  },
  profileImage: {
    type: String,
    default: 'https://via.placeholder.com/150',
  },
  personalDetails: {
    type: personalDetailsSchema,
    default: () => ({})
  },
}, {
  timestamps: true,
});

export const StoreManager = mongoose.model('StoreManager', storeManagerSchema);
