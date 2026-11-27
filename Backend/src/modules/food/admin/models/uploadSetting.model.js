import mongoose from 'mongoose';

// Developer > Image Setting: where uploaded images are stored ('cloudinary' or 'local' = the server's disk).
const uploadSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'singleton', unique: true },
    imageUploadProvider: { type: String, enum: ['local', 'cloudinary'], default: 'cloudinary' },
    updatedBy: { type: String, default: '' },
  },
  { collection: 'admin_upload_settings', timestamps: true }
);

export const UploadSetting = mongoose.models.UploadSetting || mongoose.model('UploadSetting', uploadSettingSchema);
