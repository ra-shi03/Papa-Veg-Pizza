import mongoose from 'mongoose';

// Developer > Env Managements: an environment value set from the admin, overriding the server's .env. Always stored
// encrypted (utils/secretBox.js). Only the keys in services/envSettings.service.js EDITABLE can be stored.
const envSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: String, required: true }, // sealed
    updatedBy: { type: String, default: '' },
  },
  { collection: 'admin_env_settings', timestamps: true }
);

export const EnvSetting = mongoose.models.EnvSetting || mongoose.model('EnvSetting', envSettingSchema);
