import mongoose from 'mongoose';

const rewardConfigSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true
  },
  logoUrl: {
    type: String,
    required: true,
    default: '' // Will store the Cloudinary/uploaded image URL
  },
  title: {
    type: String,
    required: true,
    default: 'Earn Points to Unlock Free Treats!'
  },
  subtitle1: {
    type: String,
    default: '1 Order = 100 Points'
  },
  subtitle2: {
    type: String,
    default: 'Relish freebies at 600 points'
  },
  buttonText: {
    type: String,
    default: 'Enroll Now'
  },
  termsText: {
    type: String,
    default: 'By enrolling you agree to our'
  },
  termsLinkText: {
    type: String,
    default: 'Terms and Conditions'
  },
  termsLink: {
    type: String,
    default: '#'
  }
}, { timestamps: true });

export const RewardConfig = mongoose.models.RewardConfig || mongoose.model('RewardConfig', rewardConfigSchema);

