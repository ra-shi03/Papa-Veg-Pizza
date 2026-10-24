import { FoodPageContent } from '../models/pageContent.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';

const normalizeKey = (key) => String(key || '').trim().toLowerCase();

const decodeHtmlEntities = (value) => {
    if (value === null || value === undefined) return value;
    let s = String(value);
    if (!s.includes('&')) return s;
    return s
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'");
};

const normalizeLegalForResponse = (legal) => {
    if (!legal || typeof legal !== 'object') return legal;
    const title = legal.title ?? '';
    const content = decodeHtmlEntities(legal.content ?? '');
    return { ...legal, title, content };
};

const normalizeAboutForResponse = (about) => {
    if (!about || typeof about !== 'object') return about;
    return {
        ...about,
        appName: decodeHtmlEntities(about.appName ?? ''),
        version: decodeHtmlEntities(about.version ?? ''),
        description: decodeHtmlEntities(about.description ?? ''),
        logo: decodeHtmlEntities(about.logo ?? '')
    };
};

export const DEFAULT_SUPPORT_DATA = {
    title: 'Customer Support',
    description: 'Have an issue with your order or questions about our menu? Get in touch directly:',
    contactInfo: {
        phone: '+91 9300990940',
        email: 'papafoodcorporation@gmail.com',
        hours: 'Support Hours: 10:00 AM – 11:30 PM Everyday'
    }
};

const normalizeSupportForResponse = (support) => {
    if (!support || typeof support !== 'object') {
        return {
            ...DEFAULT_SUPPORT_DATA,
            phone: DEFAULT_SUPPORT_DATA.contactInfo.phone,
            email: DEFAULT_SUPPORT_DATA.contactInfo.email,
            hours: DEFAULT_SUPPORT_DATA.contactInfo.hours
        };
    }
    const phone = decodeHtmlEntities(support.contactInfo?.phone || support.phone || DEFAULT_SUPPORT_DATA.contactInfo.phone);
    const email = decodeHtmlEntities(support.contactInfo?.email || support.email || DEFAULT_SUPPORT_DATA.contactInfo.email);
    const hours = decodeHtmlEntities(support.contactInfo?.hours || support.hours || DEFAULT_SUPPORT_DATA.contactInfo.hours);
    const title = decodeHtmlEntities(support.title || DEFAULT_SUPPORT_DATA.title);
    const description = decodeHtmlEntities(support.description || DEFAULT_SUPPORT_DATA.description);

    return {
        title,
        description,
        contactInfo: {
            phone,
            email,
            hours
        },
        phone,
        email,
        hours
    };
};

export const DEFAULT_TERMS_CONTENT = `
# Everyday Value Offers
- Offer applicable only on purchase of every 2 pizzas from Everyday Value Offers Section.
- Everyday Value Offer is applicable only Regular and Medium size Pizzas.
- Everyday Value Offer does not apply to Pizza Mania OR Combos.
- Offer is applicable on Papa Veg's own ordering channels (apps, mobile and desktop ordering site and in-store ordering), but not applicable on Aggregators.
- Offer cannot be combined with any other offer/coupons.
- Pizza Customisation or Crust Upgrade will be charged extra.
- Everyday Value pricing is excluding any taxes or delivery charges.
- For Delivery Charges, refer Delivery charges T&C.

# Order Delivery
- Minimum order value for delivery may vary depending on the delivery location and time of ordering.
- Delivery time guarantees are subject to weather conditions, traffic restrictions, and peak operational hours.
- In case of unforeseen delays, our customer care executive will contact you with updated delivery estimates.
- Delivery orders will be dispatched from the nearest operational outlet.

# Menu
- All menu items are 100% pure vegetarian and prepared in hygienic, certified kitchens.
- Prices, availability, and menu offerings are subject to change without prior notice.
- Visual representations of products on the app are for illustrative purposes; actual presentation may vary slightly.

# NONG (No Onion No Garlic) Pizza T&C
- NONG pizzas are prepared strictly without onion and garlic ingredients for our Jain and observant customers.
- Prepared using dedicated utensils, prep areas, and separate sauce bases.
- Select pizzas and sides can be customized as NONG upon request during ordering.

# Modify / Cancel the Online Order
- Orders can only be modified or cancelled within 60 seconds of placement.
- Once the kitchen starts baking your order, cancellations and modifications cannot be entertained.
- In the event of a cancellation accepted by the system, refunds will be initiated to the original payment source within 3-5 business days.

# Service Guarantee
- We are committed to serving oven-hot, fresh vegetarian pizzas.
- Any service deficiency must be reported within 15 minutes of receiving the order along with photos.
- Validated complaints are eligible for replacements, store credits, or refund per company policy.

# Delivery Charges
- Free delivery applies on orders above the specified threshold value in your zone.
- Delivery fee and surge charges (if applicable during rain or high demand) are displayed transparently at checkout.
- Government taxes (GST) are applicable on delivery and handling fees.

# Late Night Delivery
- Late night orders (post 11:00 PM) are serviced by designated late-night operational kitchens.
- Limited menu and delivery zones apply during late night operational hours.
- Late night delivery convenience fee may apply as displayed during checkout.

# Cashback or Discount on Payment page:
- Bank offers, wallet cashbacks, and instant discounts are subject to the partnering payment gateway's terms.
- Cashbacks will be credited directly by the respective bank or wallet provider within their standard turnaround time.
- Papa Veg Pizza is not liable for delayed credits or cashbacks managed by third-party payment gateways.

# T & C for E Gift Card
- E-Gift Cards can be redeemed across the Papa Veg Pizza app and official website.
- E-Gift Cards are valid for 1 year from the date of issuance and cannot be reloaded.
- Multiple gift vouchers can be combined during checkout as per platform limits.

# T & C for Gift Card
- Physical gift cards must have an intact scratch-off PIN for redemption.
- Gift cards cannot be exchanged for cash or transferred to bank accounts.
- Balance inquiries can be made online via the Gift Card balance check section.

# Domino's Wallet
- Wallet credits can be used for 100% order payments without restriction.
- Wallet balances are non-transferable and cannot be withdrawn to external bank accounts.
- Promotional wallet credits may carry an expiry date as communicated during campaigns.

# EDV Mix & Match
- Mix & Match combinations apply to any two qualifying pizzas in the Everyday Value category.
- Both pizzas must be of the same size tier (Regular or Medium) to qualify for EDV pricing.
- Crust upgrades and extra toppings will be billed over and above the combo base rate.

# Pizzas at 49
- Special promotional pricing of ₹49 applies only to select single-topping personal pizzas.
- Valid for dine-in and takeaway; delivery requires minimum order cart threshold.
- Limit of 4 promotional items per user account per day.

# IRCTC
- Deliveries on trains are coordinated based on real-time train tracking and PNR status.
- Orders must be booked at least 45 minutes prior to the scheduled arrival at the delivery station.
- If the train is cancelled or diverted, full automated refund will be processed to the original payment mode.

# Information Security
- Customer personal and transactional data is encrypted using 256-bit SSL encryption.
- We do not store full credit/debit card numbers or CVVs on our servers.
- For privacy inquiries, please review our comprehensive Privacy Policy.
`.trim();

export const getPublicPageByKey = async (key) => {
    const k = normalizeKey(key);
    let doc = await FoodPageContent.findOne({ key: k }).lean();

    // Auto-seed default terms if none exists
    if (!doc && (k === 'terms' || k === 'terms_user')) {
        try {
            doc = await FoodPageContent.create({
                key: k,
                legal: {
                    title: 'Disclaimer',
                    content: DEFAULT_TERMS_CONTENT
                },
                updatedByRole: 'SYSTEM'
            });
            doc = doc.toObject ? doc.toObject() : doc;
        } catch (_) {}
    }

    if (k === 'support') {
        if (!doc) {
            try {
                doc = await FoodPageContent.create({
                    key: 'support',
                    support: DEFAULT_SUPPORT_DATA,
                    updatedByRole: 'SYSTEM'
                });
                doc = doc.toObject ? doc.toObject() : doc;
            } catch (_) {}
        }
        return { key: k, data: normalizeSupportForResponse(doc?.support || null) };
    }

    if (!doc) return { key: k, data: null };
    if (k === 'about') return { key: k, data: normalizeAboutForResponse(doc.about || null) };
    const normalized = normalizeLegalForResponse(doc.legal || null);
    if ((k === 'terms' || k === 'terms_user') && (!normalized || !normalized.content || normalized.content.trim().length < 50)) {
        return {
            key: k,
            data: {
                title: normalized?.title || 'Disclaimer',
                content: DEFAULT_TERMS_CONTENT
            }
        };
    }
    return { key: k, data: normalized };
};

export const getAdminPageByKey = async (key) => getPublicPageByKey(key);

export const upsertLegalPage = async (key, payload, updatedBy) => {
    const k = normalizeKey(key);
    const allowedKeys = [
        'terms', 'terms_user', 'terms_store', 'terms_delivery',
        'privacy', 'privacy_user', 'privacy_store', 'privacy_delivery',
        'refund', 'shipping', 'cancellation'
    ];
    if (!allowedKeys.includes(k)) {
        throw new ValidationError('Invalid page key');
    }
    const title = String(payload?.title || '').trim();
    const content = decodeHtmlEntities(String(payload?.content || '')).trim();

    const doc = await FoodPageContent.findOneAndUpdate(
        { key: k },
        {
            $set: {
                key: k,
                legal: { title, content },
                about: undefined,
                updatedBy: updatedBy || null,
                updatedByRole: 'ADMIN'
            }
        },
        { upsert: true, new: true }
    ).lean();

    return { key: k, data: normalizeLegalForResponse(doc?.legal || null) };
};

export const upsertAboutPage = async (payload, updatedBy) => {
    const appName = decodeHtmlEntities(String(payload?.appName || '')).trim() || 'Appzeto Food';
    const version = decodeHtmlEntities(String(payload?.version || '')).trim() || '1.0.0';
    const description = decodeHtmlEntities(String(payload?.description || '')).trim();
    const logo = decodeHtmlEntities(String(payload?.logo || '')).trim();
    const features = Array.isArray(payload?.features) ? payload.features : [];
    const stats = Array.isArray(payload?.stats) ? payload.stats : [];

    const normalizedFeatures = features.map((f, idx) => ({
        icon: String(f?.icon || 'Heart'),
        title: String(f?.title || ''),
        description: String(f?.description || ''),
        color: String(f?.color || ''),
        bgColor: String(f?.bgColor || ''),
        order: Number.isFinite(Number(f?.order)) ? Number(f.order) : idx
    }));

    const doc = await FoodPageContent.findOneAndUpdate(
        { key: 'about' },
        {
            $set: {
                key: 'about',
                about: { appName, version, description, logo, features: normalizedFeatures, stats },
                legal: undefined,
                updatedBy: updatedBy || null,
                updatedByRole: 'ADMIN'
            }
        },
        { upsert: true, new: true }
    ).lean();

    return { key: 'about', data: normalizeAboutForResponse(doc?.about || null) };
};

export const upsertSupportPage = async (payload, updatedBy) => {
    const title = decodeHtmlEntities(String(payload?.title || '')).trim() || DEFAULT_SUPPORT_DATA.title;
    const description = decodeHtmlEntities(String(payload?.description || '')).trim() || DEFAULT_SUPPORT_DATA.description;
    const phone = decodeHtmlEntities(String(payload?.contactInfo?.phone ?? payload?.phone ?? '')).trim() || DEFAULT_SUPPORT_DATA.contactInfo.phone;
    const email = decodeHtmlEntities(String(payload?.contactInfo?.email ?? payload?.email ?? '')).trim() || DEFAULT_SUPPORT_DATA.contactInfo.email;
    const hours = decodeHtmlEntities(String(payload?.contactInfo?.hours ?? payload?.hours ?? '')).trim() || DEFAULT_SUPPORT_DATA.contactInfo.hours;

    const doc = await FoodPageContent.findOneAndUpdate(
        { key: 'support' },
        {
            $set: {
                key: 'support',
                support: {
                    title,
                    description,
                    contactInfo: {
                        phone,
                        email,
                        hours
                    }
                },
                legal: undefined,
                about: undefined,
                updatedBy: updatedBy || null,
                updatedByRole: 'ADMIN'
            }
        },
        { upsert: true, new: true }
    ).lean();

    return { key: 'support', data: normalizeSupportForResponse(doc?.support || null) };
};


