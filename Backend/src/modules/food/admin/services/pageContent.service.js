import { getBusinessInfo, writeThroughBusinessContact } from './businessSettings.service.js';
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
        // Phone and email are served from the business settings (withBusinessContact)
        phone: '',
        email: '',
        hours: 'Support Hours: 10:00 AM – 11:30 PM Everyday'
    }
};

/** The support page's phone and email always come from the business settings, never a value saved on this page. */
const withBusinessContact = (data, info) => ({
    ...data,
    description: info.faqContactText || data.description,
    contactInfo: { ...data.contactInfo, phone: info.supportPhone, email: info.supportEmail },
    phone: info.supportPhone,
    email: info.supportEmail,
});

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
# Welcome and Acceptance
- These Terms & Conditions apply when you browse, order or pay through the Papa Veg Pizza app and website.
- By creating an account or placing an order you agree to these terms, our **Privacy Policy**, **Cancellation Policy**, **Refund Policy** and **Shipping Policy**.
- If you do not agree, please do not use the app.

# Your Account
- You must be 18 or older, or use the app under the supervision of a parent or guardian.
- You sign in with your mobile number and a one-time password (OTP). Never share your OTP with anyone.
- Keep your name, phone number and addresses correct. We are not responsible for orders that fail because of wrong details.
- You are responsible for everything done through your account. Tell us at once if you think it has been misused.

# 100% Vegetarian Promise
- Every item on our menu is 100% vegetarian.
- Our kitchens use shared equipment, so traces of gluten, dairy, nuts, soy or mustard may be present in any item.
- Allergen and nutrition details are shown on the **Nutrition Information** page. If you have a serious allergy, please check it before you order.

# Menu, Prices and Availability
- Prices and availability are set by the store that will prepare your order and can differ between stores.
- Photos are for illustration. Toppings, colour and presentation may vary slightly.
- Prices, offers and menu items can change without notice. The price shown in your cart when you place the order is the price you pay.
- If an item is unavailable after you order, the store may contact you, replace it or remove it, and you pay only for what is served.

# Placing an Order
- An order is confirmed only after the store accepts it. A store may decline an order if it is busy, closed or cannot reach your address.
- Check your cart, address and phone number before paying. The bill shows the food total, every fee and tax, and any discount.
- You can follow your order from the kitchen to your door in **My Orders**.

# Fees, Taxes and Charges
- Besides the food, an order can include a handling charge, platform fee, packaging fee, delivery fee and GST.
- Delivery fee depends on the distance from the store. Free delivery applies above the order value shown in your cart.
- Every charge that applies to you is listed in the cart and on your bill before you pay. A charge that is not shown is not applied.

# Payments
- You can pay with the methods offered at checkout. Online payments are processed by secure third-party payment gateways.
- We do not store your full card number, CVV or UPI PIN.
- If money is deducted but your order is not placed, it is returned to the same payment source automatically, usually within 3 to 5 working days.

# Delivery and Pickup
- Delivery times are estimates. Traffic, weather, festivals and peak hours can cause delays.
- Share the **delivery code** only with the delivery partner when the order is handed over. The delivery partner may take a photo at handover as proof of delivery.
- If we cannot reach you or no one is available at the address, the order may be marked delivered or cancelled, and the cancellation rules apply.
- For pickup orders, collect your order from the store at the time shown. Orders left uncollected may be cancelled.

# Cancellations and Refunds
- You can cancel free of charge within the cancellation window shown when you place the order. After that window, a cancellation fee may be kept from prepaid orders. Cash orders are never charged a cancellation fee.
- Once the kitchen has started preparing your order, it may not be possible to cancel it.
- Your order follows the cancellation rules that were shown when you placed it.
- Approved refunds go back to the original payment source within 3 to 5 working days.

# Quality Issues
- If something is missing, wrong or not as fresh as it should be, report it from **Help and Support** within 15 minutes of delivery, with photos.
- After checking, we may offer a replacement, store credit or a refund.

# Bulk and Party Orders
- Bulk and party orders are sent as a request. The store checks it, confirms the items, price and timing, and then you pay to confirm.
- Bulk orders need advance notice. Menu, price and timing are confirmed by the store, not by the request form.
- Cancellation and refund terms for a bulk order are shown when the store confirms it.

# Coupons, Offers and Rewards
- A coupon or offer can be used only as described in it: eligible items, minimum order, validity and usage limits.
- Unless stated otherwise, one coupon can be used per order and coupons cannot be combined.
- Reward codes give the item named in the reward. They have no cash value.
- We may withdraw an offer, and cancel benefits, if we find misuse, fake accounts or repeated abuse.

# Wallet and Referrals
- Wallet balance can be used to pay for orders in the app. It cannot be transferred to another account.
- Referral rewards are given only for genuine new customers who complete the required first order.

# Acceptable Use
- Do not misuse the app, place fake or prank orders, abuse our delivery partners or store staff, or try to break or copy our systems.
- We may suspend or close an account that breaks these terms.

# Privacy and Your Data
- We use your phone number, address and location to take, prepare and deliver your orders and to improve the service.
- We do not sell your personal data. Read the **Privacy Policy** to see what we collect and the choices you have.
- You can ask to delete your account from the Account section of the app.

# Our Responsibility
- We take care to prepare and deliver food safely, but we are not responsible for delays or failures caused by events outside our control.
- To the extent the law allows, our liability for any order is limited to the amount you paid for it.

# Changes to These Terms
- We may update these terms from time to time. The date at the top of this page shows when they were last changed.
- If you keep using the app after a change, you accept the updated terms.

# Contact Us
- Questions about these terms or an order? Open **Help and Support** in the app and we will get back to you.
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
                    title: 'Terms & Conditions',
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
        return { key: k, data: withBusinessContact(normalizeSupportForResponse(doc?.support || null), await getBusinessInfo()) };
    }

    if (!doc) return { key: k, data: null };
    if (k === 'about') {
        const about = normalizeAboutForResponse(doc.about || null);
        // Never the old template's name: the business name when none of its own was saved
        if (about && (!about.appName || about.appName === 'Foodelo')) about.appName = (await getBusinessInfo()).companyName;
        return { key: k, data: about };
    }
    const normalized = normalizeLegalForResponse(doc.legal || null);
    if ((k === 'terms' || k === 'terms_user') && (!normalized || !normalized.content || normalized.content.trim().length < 50)) {
        return {
            key: k,
            data: {
                title: normalized?.title || 'Terms & Conditions',
                content: DEFAULT_TERMS_CONTENT,
                updatedAt: doc.updatedAt
            }
        };
    }
    return { key: k, data: normalized ? { ...normalized, updatedAt: doc.updatedAt } : normalized };
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
    // The screen's phone and email inputs edit the business settings
    const sentPhone = payload?.contactInfo?.phone ?? payload?.phone;
    const sentEmail = payload?.contactInfo?.email ?? payload?.email;
    const phone = decodeHtmlEntities(String(sentPhone ?? '')).trim();
    const email = decodeHtmlEntities(String(sentEmail ?? '')).trim();
    await writeThroughBusinessContact({
        supportPhone: sentPhone === undefined ? undefined : phone,
        supportEmail: sentEmail === undefined ? undefined : email,
    });
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

    return { key: 'support', data: withBusinessContact(normalizeSupportForResponse(doc?.support || null), await getBusinessInfo()) };
};


