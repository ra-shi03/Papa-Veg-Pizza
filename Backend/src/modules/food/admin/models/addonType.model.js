import mongoose from 'mongoose';

const addonTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  description: { type: String, default: '', trim: true },
  icon: { type: String, default: 'Tag' }, // Disc, Sparkles, Droplets, Flame, Layers, Tag, etc.
  color: { type: String, default: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  sortOrder: { type: Number, default: 0 },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export const AddonType = mongoose.model('AddonType', addonTypeSchema);

