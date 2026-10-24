import { BulkOrderInquiry } from '../models/bulkOrderInquiry.model.js';
import { BulkOrderConfig } from '../models/bulkOrderConfig.model.js';
import { sendResponse } from '../../../../utils/response.js';

const DEFAULT_CONFIG = {
  virtualParty: {
    isActive: true,
    title: 'Virtual Pizza Party',
    bannerImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80',
    title1: 'WORK TOGETHER, EAT TOGETHER',
    description1: "As virtual parties have become the new way to bond and enjoy together, it's time to up these unique celebrations with a unique feast.",
    calloutText: "Introducing Papa Veg Pizza's Virtual Feast, a new way to place a bulk order for your virtual celebration and get it delivered in specially designed packages.",
    title2: 'CELEBRATIONS MADE EASY',
    description2: "Convert your work from home into party from home with Papa Veg Pizza's Virtual Feast. Order some good old favourites from Papa Veg Pizza and celebrate with your colleagues in a new and safer way.",
    featureImage: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80',
    corporateEmail: 'corporate.sales@papavegpizza.com',
    corporatePhone: '+91 9300990940',
    partySizeOptions: [
      'Corporate Gathering (20-50 people)',
      'Team Celebration (50-100 people)',
      'Virtual Annual Meet (100+ people)',
      'Family & Birthday Celebration',
      'College / School Event',
      'Other'
    ]
  },
  egiftVoucher: {
    isActive: true,
    title: 'E-Gift Voucher',
    bannerImage: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80',
    heading1: 'LAUNCH YOUR GIFTING WITH US NOW',
    subheading1: 'Get access to place order across Papa Veg Pizza stores in India via our app/website using E-Gift Voucher',
    feature1Title: 'Easy and secure ordering',
    feature1Desc: 'Place your E-Gift Voucher order with ease.',
    feature2Title: 'Customized to meet business needs',
    feature2Desc: 'Instant digital incentive with the flexibility of choosing the denominations.',
    feature3Title: 'Flexible delivery option',
    feature3Desc: 'Get your code delivered as an E-Gift card via e-mail.',
    heading2: 'SMALL GESTURES GO A LONG WAY',
    description2: "Ultimate gifting for corporate and businesses. The Papa Veg Pizza's E-Gift Voucher is a great solution when it comes to rewarding and recognizing employees, customers and supporters with a sophisticated gifting platform.",
    featureImage: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80',
    corporateEmail: 'corporate.sales@papavegpizza.com',
    corporatePhone: '+91 9300990940',
    denominationOptions: [
      '25 - 50 Vouchers',
      '50 - 100 Vouchers',
      '100 - 500 Vouchers',
      '500+ Corporate Vouchers',
      'Custom Bulk Denomination'
    ],
    redeemHeading: 'HOW TO REDEEM',
    redeemSubheading: 'Redeem only on Papa Veg Pizza App and Website',
    redeemSteps: [
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
  },
  contactPage: {
    feedbackHeading: "Have any feedback or queries? We'd love to hear from you. Write to us at",
    feedbackEmail: 'guestcare@papavegpizza.com',
    outletButtonText: 'FIND YOUR NEAREST OUTLET',
    outletButtonLink: '/food/user/delivery-location',
    outletHelpText: 'Try our delicious treats and satisfy hunger with Papa Veg Pizza.',
    locateLinkText: 'Locate Nearby Pizza Restaurants',
    locateLinkUrl: '/food/user/delivery-location',
    customerCareTitle: 'Papa Veg Pizza Customer Care Number',
    customerCareNumber: '1800-889-1234',
    corporateOfficeTitle: 'Papa Veg Pizza Corporate Office',
    companyName: 'Papa Veg Pizza Private Limited',
    addressLine1: '12/2 M.G. Road, Near Palasia Square',
    addressLine2: 'Indore - 452001, Madhya Pradesh, India',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=Rajasthan&t=&z=7&ie=UTF8&iwloc=&output=embed',
    mapExternalUrl: 'https://maps.google.com/?q=Rajasthan',
    facebookText: 'Visit our page on Facebook',
    facebookUrl: 'https://facebook.com/papavegpizza',
    googleText: 'Visit our page on Google',
    googleUrl: 'https://google.com/search?q=Papa+Veg+Pizza',
    instagramText: 'Visit our page on Instagram',
    instagramUrl: 'https://instagram.com/papavegpizza',
    twitterText: 'Follow us on twitter for latest updates',
    twitterUrl: 'https://twitter.com/papavegpizza'
  }
};

/** Public: Submit Bulk Order Inquiry */
export async function submitInquiryPublic(req, res, next) {
  try {
    const { name, organisation, phone, email, location, occasion, query, type, eventDate } = req.body || {};

    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, contact number, and email are required.'
      });
    }

    const inquiry = await BulkOrderInquiry.create({
      name: String(name).trim(),
      organisation: String(organisation || '').trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      location: String(location || '').trim(),
      eventDate: String(eventDate || '').trim(),
      occasion: String(occasion || eventDate || 'Date Selected').trim(),
      query: String(query || '').trim(),
      type: type || 'virtual_party',
      status: 'new'
    });

    return sendResponse(res, 201, 'Bulk order inquiry submitted successfully', inquiry);
  } catch (err) {
    next(err);
  }
}

/** Public: Get Bulk Order Dynamic Config */
export async function getConfigPublic(req, res, next) {
  try {
    let config = await BulkOrderConfig.findOne().lean();
    if (!config) {
      config = await BulkOrderConfig.create(DEFAULT_CONFIG);
      config = config.toObject ? config.toObject() : config;
    } else {
      const mergedEgift = { ...DEFAULT_CONFIG.egiftVoucher, ...(config.egiftVoucher || {}) };
      if (!mergedEgift.redeemSteps || mergedEgift.redeemSteps.length === 0) {
        mergedEgift.redeemSteps = DEFAULT_CONFIG.egiftVoucher.redeemSteps;
      }
      config = {
        ...DEFAULT_CONFIG,
        ...config,
        virtualParty: { ...DEFAULT_CONFIG.virtualParty, ...(config.virtualParty || {}) },
        egiftVoucher: mergedEgift,
        contactPage: { ...DEFAULT_CONFIG.contactPage, ...(config.contactPage || {}) }
      };
    }
    return sendResponse(res, 200, 'Bulk order configuration retrieved', config);
  } catch (err) {
    next(err);
  }
}

/** Admin: List Inquiries */
export async function listInquiriesAdmin(req, res, next) {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { organisation: regex },
        { phone: regex },
        { email: regex },
        { location: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [inquiries, total] = await Promise.all([
      BulkOrderInquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      BulkOrderInquiry.countDocuments(filter)
    ]);

    // Statistics counts
    const [newCount, inProgressCount, completedCount] = await Promise.all([
      BulkOrderInquiry.countDocuments({ status: 'new' }),
      BulkOrderInquiry.countDocuments({ status: 'in_progress' }),
      BulkOrderInquiry.countDocuments({ status: 'completed' })
    ]);

    return sendResponse(res, 200, 'Bulk order inquiries retrieved', {
      inquiries,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      stats: {
        total,
        newCount,
        inProgressCount,
        completedCount
      }
    });
  } catch (err) {
    next(err);
  }
}

/** Admin: Update Inquiry Status / Notes */
export async function updateInquiryStatusAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateFields = {};
    if (status) updateFields.status = status;
    if (adminNotes !== undefined) updateFields.adminNotes = adminNotes;

    const updated = await BulkOrderInquiry.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    return sendResponse(res, 200, 'Inquiry updated successfully', updated);
  } catch (err) {
    next(err);
  }
}

/** Admin: Delete Inquiry */
export async function deleteInquiryAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const deleted = await BulkOrderInquiry.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    return sendResponse(res, 200, 'Inquiry deleted successfully', { id });
  } catch (err) {
    next(err);
  }
}

/** Admin: Update Bulk Order Configuration (Dynamic CMS) */
export async function updateConfigAdmin(req, res, next) {
  try {
    const payload = req.body;
    let config = await BulkOrderConfig.findOne();

    if (!config) {
      config = await BulkOrderConfig.create({
        ...DEFAULT_CONFIG,
        ...payload
      });
    } else {
      config = await BulkOrderConfig.findByIdAndUpdate(
        config._id,
        { $set: payload },
        { new: true, runValidators: true }
      );
    }

    return sendResponse(res, 200, 'Bulk order configuration updated successfully', config);
  } catch (err) {
    next(err);
  }
}

