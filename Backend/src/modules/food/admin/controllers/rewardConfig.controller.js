import { RewardConfig } from '../models/rewardConfig.model.js';

// Get global rewards configuration
export const getRewardConfig = async (req, res) => {
  try {
    let config = await RewardConfig.findOne();
    if (!config) {
      // Create default if it doesn't exist
      config = await RewardConfig.create({
        isEnabled: false,
        logoUrl: '',
        title: 'Earn Points to Unlock Free Treats!',
        subtitle1: '1 Order = 100 Points',
        subtitle2: 'Relish freebies at 600 points',
        buttonText: 'Enroll Now',
        termsText: 'By enrolling you agree to our',
        termsLinkText: 'Terms and Conditions',
        termsLink: '#'
      });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update global rewards configuration
export const updateRewardConfig = async (req, res) => {
  try {
    const updateData = req.body;
    let config = await RewardConfig.findOne();
    
    if (config) {
      config = await RewardConfig.findByIdAndUpdate(config._id, updateData, { new: true, runValidators: true });
    } else {
      config = await RewardConfig.create(updateData);
    }
    
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get public config for user app
export const getPublicRewardConfig = async (req, res) => {
  try {
    const config = await RewardConfig.findOne();
    // Return config if enabled, otherwise return null/disabled state
    if (!config || !config.isEnabled) {
      return res.status(200).json({ success: true, data: { isEnabled: false } });
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

