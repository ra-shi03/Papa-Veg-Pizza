import mongoose from 'mongoose';

const personalDetailsSchema = new mongoose.Schema({
  address: { type: String, trim: true },
  emergencyContact: { type: String, trim: true },
  emergencyContactName: { type: String, trim: true },
  emergencyContactRelation: { type: String, trim: true },
  gender: { type: String, trim: true },
  dateOfBirth: { type: String, trim: true },
  salary: { type: Number, min: 0 },
  salaryType: { type: String, trim: true, default: 'Monthly' },
  experience: { type: Number, default: 0 },
  shiftType: { type: String, trim: true },
  startTime: { type: String, trim: true },
  endTime: { type: String, trim: true },
  skills: { type: [String], default: [] },
  weeklyWorkingDays: { type: [String], default: [] }
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
  storeName: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    trim: true,
  },
  reportingManager: {
    type: String,
    trim: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
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
