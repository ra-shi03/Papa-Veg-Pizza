import mongoose from 'mongoose';

const rewardFaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });

const rewardProductOverrideSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String },
  image: { type: String },
  description: { type: String },
  originalPrice: { type: Number, default: 0 },
  requiredPoints: { type: Number, default: 600 },
  isVeg: { type: Boolean, default: true },
  size: { type: String, default: 'Regular' },
  crust: { type: String, default: 'New Hand Tossed' },
  sortOrder: { type: Number, default: 0 }
}, { _id: false });

const rewardConfigSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: true
  },
  showVegFilter: {
    type: Boolean,
    default: true
  },
  showNonVegFilter: {
    type: Boolean,
    default: true
  },
  showSortFilter: {
    type: Boolean,
    default: true
  },
  programName: {
    type: String,
    default: 'Cheesy Rewards'
  },
  logoUrl: {
    type: String,
    default: ''
  },
  title: {
    type: String,
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
  orderPointsTitle: {
    type: String,
    default: '1 Order = 100 Points'
  },
  orderPointsSubtitle: {
    type: String,
    default: 'On every order above ₹349'
  },
  freeItemsTitle: {
    type: String,
    default: 'Unlock Free Items'
  },
  freeItemsSubtitle: {
    type: String,
    default: 'Starting at 600 Points'
  },
  minOrderAmount: {
    type: Number,
    default: 349
  },
  pointsPerOrder: {
    type: Number,
    default: 100
  },
  defaultPointsRequired: {
    type: Number,
    default: 600
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
  },
  faqs: {
    type: [rewardFaqSchema],
    default: [
      {
        question: 'How do I earn points in the Rewards program?',
        answer: 'You earn 100 points on every delivered order above ₹349 placed via the Papa Veg Pizza app or website.'
      },
      {
        question: 'How do I unlock and redeem free items?',
        answer: 'Once you accumulate 600 points, all eligible reward items unlock automatically. You can add any unlocked reward product to your cart during checkout for ₹0.'
      },
      {
        question: 'Do my points expire?',
        answer: 'Points remain valid for 12 months from the date they are credited to your account.'
      },
      {
        question: 'Can I combine free reward items with discount coupons?',
        answer: 'Yes! You can apply active promo codes along with your redeemed reward treats on eligible orders.'
      }
    ]
  },
  terms: {
    type: [String],
    default: [
      'Enrollment in the Rewards Program is free for all registered customers.',
      'Points are credited within 24 hours of successful order delivery.',
      'Orders below the minimum threshold (₹349) do not qualify for point accrual.',
      'Reward products are subject to daily kitchen availability and stock.',
      'Papa Veg Pizza reserves the right to modify point rules and redemption criteria at any time.'
    ]
  },
  rewardProducts: {
    type: [rewardProductOverrideSchema],
    default: []
  }
}, { timestamps: true });

export const RewardConfig = mongoose.models.RewardConfig || mongoose.model('RewardConfig', rewardConfigSchema);
