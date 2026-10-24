import mongoose from 'mongoose';

const bulkOrderConfigSchema = new mongoose.Schema(
  {
    virtualParty: {
      isActive: { type: Boolean, default: true },
      title: { type: String, default: 'Virtual Pizza Party' },
      bannerImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80'
      },
      title1: { type: String, default: 'WORK TOGETHER, EAT TOGETHER' },
      description1: {
        type: String,
        default: "As virtual parties have become the new way to bond and enjoy together, it's time to up these unique celebrations with a unique feast."
      },
      calloutText: {
        type: String,
        default: "Introducing Papa Veg Pizza's Virtual Feast, a new way to place a bulk order for your virtual celebration and get it delivered in specially designed packages."
      },
      title2: { type: String, default: 'CELEBRATIONS MADE EASY' },
      description2: {
        type: String,
        default: "Convert your work from home into party from home with Papa Veg Pizza's Virtual Feast. Order some good old favourites from Papa Veg Pizza and celebrate with your colleagues in a new and safer way."
      },
      featureImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80'
      },
      corporateEmail: { type: String, default: 'corporate.sales@papavegpizza.com' },
      corporatePhone: { type: String, default: '+91 9300990940' },
      partySizeOptions: {
        type: [String],
        default: [
          'Corporate Gathering (20-50 people)',
          'Team Celebration (50-100 people)',
          'Virtual Annual Meet (100+ people)',
          'Family & Birthday Celebration',
          'College / School Event',
          'Other'
        ]
      }
    },
    egiftVoucher: {
      isActive: { type: Boolean, default: true },
      title: { type: String, default: 'E-Gift Voucher' },
      bannerImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80'
      },
      heading1: { type: String, default: 'LAUNCH YOUR GIFTING WITH US NOW' },
      subheading1: {
        type: String,
        default: 'Get access to place order across Papa Veg Pizza stores in India via our app/website using E-Gift Voucher'
      },
      feature1Title: { type: String, default: 'Easy and secure ordering' },
      feature1Desc: { type: String, default: 'Place your E-Gift Voucher order with ease.' },
      feature2Title: { type: String, default: 'Customized to meet business needs' },
      feature2Desc: {
        type: String,
        default: 'Instant digital incentive with the flexibility of choosing the denominations.'
      },
      feature3Title: { type: String, default: 'Flexible delivery option' },
      feature3Desc: { type: String, default: 'Get your code delivered as an E-Gift card via e-mail.' },
      heading2: { type: String, default: 'SMALL GESTURES GO A LONG WAY' },
      description2: {
        type: String,
        default: "Ultimate gifting for corporate and businesses. The Papa Veg Pizza's E-Gift Voucher is a great solution when it comes to rewarding and recognizing employees, customers and supporters with a sophisticated gifting platform."
      },
      featureImage: {
        type: String,
        default: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80'
      },
      corporateEmail: { type: String, default: 'corporate.sales@papavegpizza.com' },
      corporatePhone: { type: String, default: '+91 9300990940' },
      denominationOptions: {
        type: [String],
        default: [
          '25 - 50 Vouchers',
          '50 - 100 Vouchers',
          '100 - 500 Vouchers',
          '500+ Corporate Vouchers',
          'Custom Bulk Denomination'
        ]
      },
      redeemHeading: {
        type: String,
        default: 'HOW TO REDEEM'
      },
      redeemSubheading: {
        type: String,
        default: 'Redeem only on Papa Veg Pizza App and Website'
      },
      redeemSteps: {
        type: [
          {
            stepNumber: { type: Number, default: 1 },
            title: { type: String, default: '' },
            description: { type: String, default: '' },
            icon: { type: String, default: 'check' }
          }
        ],
        default: [
          {
            stepNumber: 1,
            title: 'Place Order',
            description: 'Open Papa Veg Pizza App or visit papavegpizza.com. Add products to your cart and proceed to pay.',
            icon: 'cart'
          },
          {
            stepNumber: 2,
            title: 'Payment Method',
            description: 'Change the Payment Mode to Gift Card / eVoucher option.',
            icon: 'card'
          },
          {
            stepNumber: 3,
            title: 'e-Voucher / Gift Card Number',
            description: 'Enter your 16 digit eVoucher number and Submit.',
            icon: 'ticket'
          },
          {
            stepNumber: 4,
            title: 'Make Payment',
            description: 'To pay the balance (if any) use cash or online payment modes.',
            icon: 'wallet'
          },
          {
            stepNumber: 5,
            title: 'Enter Pin',
            description: 'Enter voucher PIN and Submit.',
            icon: 'lock'
          },
          {
            stepNumber: 6,
            title: 'Check Your Final Payment',
            description: 'Review your order and click on Pay Now.',
            icon: 'check'
          }
        ]
      }
    },
    contactPage: {
      feedbackHeading: {
        type: String,
        default: "Have any feedback or queries? We'd love to hear from you. Write to us at"
      },
      feedbackEmail: {
        type: String,
        default: 'guestcare@papavegpizza.com'
      },
      outletButtonText: {
        type: String,
        default: 'FIND YOUR NEAREST OUTLET'
      },
      outletButtonLink: {
        type: String,
        default: '/food/user/delivery-location'
      },
      outletHelpText: {
        type: String,
        default: 'Try our delicious treats and satisfy hunger with Papa Veg Pizza.'
      },
      locateLinkText: {
        type: String,
        default: 'Locate Nearby Pizza Restaurants'
      },
      locateLinkUrl: {
        type: String,
        default: '/food/user/delivery-location'
      },
      customerCareTitle: {
        type: String,
        default: 'Papa Veg Pizza Customer Care Number'
      },
      customerCareNumber: {
        type: String,
        default: '1800-889-1234'
      },
      corporateOfficeTitle: {
        type: String,
        default: 'Papa Veg Pizza Corporate Office'
      },
      companyName: {
        type: String,
        default: 'Papa Veg Pizza Private Limited'
      },
      addressLine1: {
        type: String,
        default: '12/2 M.G. Road, Near Palasia Square'
      },
      addressLine2: {
        type: String,
        default: 'Indore - 452001, Madhya Pradesh, India'
      },
      mapEmbedUrl: {
        type: String,
        default: 'https://maps.google.com/maps?q=Rajasthan&t=&z=7&ie=UTF8&iwloc=&output=embed'
      },
      mapExternalUrl: {
        type: String,
        default: 'https://maps.google.com/?q=Rajasthan'
      },
      facebookText: {
        type: String,
        default: 'Visit our page on Facebook'
      },
      facebookUrl: {
        type: String,
        default: 'https://facebook.com/papavegpizza'
      },
      googleText: {
        type: String,
        default: 'Visit our page on Google'
      },
      googleUrl: {
        type: String,
        default: 'https://google.com/search?q=Papa+Veg+Pizza'
      },
      instagramText: {
        type: String,
        default: 'Visit our page on Instagram'
      },
      instagramUrl: {
        type: String,
        default: 'https://instagram.com/papavegpizza'
      },
      twitterText: {
        type: String,
        default: 'Follow us on twitter for latest updates'
      },
      twitterUrl: {
        type: String,
        default: 'https://twitter.com/papavegpizza'
      }
    }
  },
  {
    collection: 'food_bulk_order_configs',
    timestamps: true
  }
);

export const BulkOrderConfig = mongoose.model('BulkOrderConfig', bulkOrderConfigSchema);
