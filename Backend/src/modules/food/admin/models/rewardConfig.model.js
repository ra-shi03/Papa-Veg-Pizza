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

// One row of the "How it works" list on the user rewards page; `highlight` is appended to the title in the accent colour.
const howItWorksStepSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  highlight: { type: String, default: '' },
  description: { type: String, default: '' },
  note: { type: String, default: '' },
  iconUrl: { type: String, default: '' }
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
  quitLinkText: {
    type: String,
    default: 'I want to quit this program'
  },
  quitModalTitle: {
    type: String,
    default: 'Quit Cheesy Rewards?'
  },
  quitModalDescription: {
    type: String,
    default: "All your points and progress will be removed. You'll need to enrol again to start earning rewards."
  },
  quitStayButtonText: {
    type: String,
    default: 'Stay'
  },
  quitConfirmButtonText: {
    type: String,
    default: 'Quit Anyway'
  },
  quitLoadingText: {
    type: String,
    default: 'Leaving Cheesy Rewards...'
  },
  enrollLoadingText: {
    type: String,
    default: 'Enrolling for Cheesy Rewards...'
  },
  welcomeModalTitle: {
    type: String,
    default: 'Welcome to Cheesy Rewards!'
  },
  welcomeModalSubtitle: {
    type: String,
    default: 'Place your order to earn Reward points'
  },
  welcomeModalButtonText: {
    type: String,
    default: 'Order Now'
  },
  // ── User app: Cheesy Rewards tab ──
  rewardsHeadline: {
    type: String,
    default: 'Your Cheesy Rewards'
  },
  rewardsSubheadline: {
    type: String,
    default: 'Collect Points to get Free Pizzas!'
  },
  pointsCardTitle: {
    type: String,
    default: 'Your Points'
  },
  orderButtonText: {
    type: String,
    default: 'Order & Get points'
  },
  rewardsCardTitle: {
    type: String,
    default: 'Your Rewards'
  },
  freeRewardLabel: {
    type: String,
    default: 'Free Pizza'
  },
  redeemButtonText: {
    type: String,
    default: 'Redeem'
  },
  redeemSheetTitle: {
    type: String,
    default: 'Choose your Free Pizza'
  },
  rewardImageUrl: {
    type: String,
    default: ''
  },
  howItWorksTitle: {
    type: String,
    default: 'How it works'
  },
  howItWorksSteps: {
    type: [howItWorksStepSchema],
    default: [
      {
        title: '1 Order =',
        highlight: '100 Points',
        description: 'Earn 100 points on every eligible order of ₹349 or more',
        note: 'Points are credited once your order is delivered'
      },
      {
        title: '600 points =',
        highlight: 'FREE REGULAR PIZZA',
        description: 'Redeem 600 points for a Free Regular Pizza',
        note: ''
      }
    ]
  },
  faqTitle: {
    type: String,
    default: 'Frequently Asked Questions'
  },
  termsTitle: {
    type: String,
    default: 'Terms & Conditions'
  },
  // ── User app: Wallet tab + Refund Points history ──
  walletTabLabel: {
    type: String,
    default: 'Wallet'
  },
  walletPointsLabel: {
    type: String,
    default: 'Points'
  },
  walletConversionText: {
    type: String,
    default: '1 Point = 1 Rupee'
  },
  walletHeroImageUrl: {
    type: String,
    default: ''
  },
  refundCardTitle: {
    type: String,
    default: 'Refund Points'
  },
  refundCardSubtitle: {
    type: String,
    default: 'Use this to pay for your next order. Unrestricted Usage.'
  },
  earnedColumnLabel: {
    type: String,
    default: 'Earned'
  },
  usedColumnLabel: {
    type: String,
    default: 'Used'
  },
  walletEmptyText: {
    type: String,
    default: 'No transactions yet'
  },
  walletFaqs: {
    type: [rewardFaqSchema],
    default: [
      {
        question: 'How can I use Papa Veg Wallet?',
        answer: 'Your Refund Points can be used to pay for your next order on the Papa Veg Pizza app. 1 Point = ₹1.'
      },
      {
        question: 'How can I check my wallet history?',
        answer: 'Open Rewards & Wallet, go to the Wallet tab and tap the Refund Points card to see every credit and debit with its date.'
      },
      {
        question: 'Does the money in my wallet have any validity?',
        answer: 'Refund Points do not expire. They stay in your wallet until you use them.'
      },
      {
        question: 'How can I earn money in the Wallet?',
        answer: 'When an order is cancelled or refunded to your wallet, the refund amount is credited here as Refund Points.'
      },
      {
        question: 'Can I add Money into the Wallet?',
        answer: 'No, money cannot be added to the wallet directly. Only refunds and promotional credits are added to it.'
      },
      {
        question: 'Can I choose not to use the Wallet?',
        answer: 'Yes. Using your wallet balance is optional, and unused points stay in your wallet.'
      }
    ]
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
