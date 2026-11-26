import mongoose from 'mongoose';
import { payoutAccountSchema } from '../../payouts/models/payoutAccount.schema.js';

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

// What the person wants to be alerted about (profile > Notifications). Only these keys, only booleans.
const notificationPrefsSchema = new mongoose.Schema({
  orderAlerts: { type: Boolean, default: true },
  inventoryAlerts: { type: Boolean, default: true },
  shiftAlerts: { type: Boolean, default: false },
  complaintAlerts: { type: Boolean, default: true },
  dailyReports: { type: Boolean, default: true },
  smsAlerts: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true }
}, { _id: false });

const storeManagerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  // Required for store managers (they sign in). Kitchen staff have no login (docs/kitchen-staff-removal.md), so theirs is
  // optional; the index is unique only among records that have one (scripts/convert-kitchen-staff.js rebuilds it).
  email: {
    type: String,
    required: [function () { return this.staffKind !== 'kitchen_staff'; }, 'Email is required'],
    lowercase: true,
    trim: true,
  },
  // 'kitchen_staff' = a record the store manager runs (no login). Records made before this field existed are recognised
  // by their KITCHEN_STAFF role link (store/services/kitchenStaffDirectory.js).
  staffKind: {
    type: String,
    enum: ['kitchen_staff'],
    default: undefined,
    index: true,
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
    enum: ['Active', 'On Leave', 'Suspended', 'Pending Approval', 'Rejected', 'DELETED'],
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
  // A kitchen staff member the store manager adds waits as 'Pending Approval' until the franchise admin decides
  approval: {
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedByName: { type: String, trim: true, default: '' },
    decidedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: '' },
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
  notificationPrefs: {
    type: notificationPrefsSchema,
    default: () => ({})
  },
  // Where this staff member's salary is paid (My salary page). Bank details: never returned unless asked for.
  payoutAccount: { type: payoutAccountSchema, default: undefined, select: false },
}, {
  timestamps: true,
});

// One email per person, but kitchen staff may have none: unique only where an email is set.
storeManagerSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });

export const StoreManager = mongoose.model('StoreManager', storeManagerSchema);

/**
 * The email index used to be unique over every record (a missing email counted as one shared value, so a second staff
 * member without an email was refused). Replaces it with the partial one above. Safe to run on every start.
 */
export async function fixStaffEmailIndex() {
  try {
    const indexes = await StoreManager.collection.indexes();
    const old = indexes.find((ix) => ix.name === 'email_1' && !ix.partialFilterExpression);
    if (old) await StoreManager.collection.dropIndex('email_1');
  } catch {
    // no collection yet (new database)
  }
  await StoreManager.createIndexes().catch(() => {});
}
