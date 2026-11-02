import { FoodBusinessSettings } from '../models/businessSettings.model.js';
import { isValidEmail, isValidPhone } from '../validators/businessSettings.validator.js';
import { ValidationError } from '../../../../core/auth/errors.js';

// The one business settings record: the only source of the business name and contact details. Super admin writes it;
// the apps read toPublicBusinessInfo through GET /food/admin/business-settings/public.

const PUBLIC_CACHE_MS = 60 * 1000;

// Values older versions saved as defaults: they were never this business's, so they read as empty
const OLD_DEFAULTS = new Set(['Appzeto', 'admin@appzeto.com', 'support@foodelo.com', '+91 1234567890', '24/7 Availability']);
const real = (value) => {
    const text = String(value ?? '').trim();
    return OLD_DEFAULTS.has(text) ? '' : text;
};

export const findBusinessSettings = () => FoodBusinessSettings.findOne().sort({ createdAt: 1 });

/** Display fields only: no ids, no audit fields, no storage references, nothing the apps do not show. */
export const toPublicBusinessInfo = (doc) => ({
    companyName: real(doc?.companyName),
    logo: { url: doc?.logo?.url || '' },
    favicon: { url: doc?.favicon?.url || '' },
    website: real(doc?.website),
    supportPhone: real(doc?.supportPhone),
    supportEmail: real(doc?.supportEmail),
    supportHours: real(doc?.supportHours),
    cateringPhone: real(doc?.cateringPhone),
    cateringEmail: real(doc?.cateringEmail),
    whatsappNumber: real(doc?.whatsappNumber),
    address: real(doc?.address),
    state: real(doc?.state),
    pincode: real(doc?.pincode),
    region: real(doc?.region),
    gstin: real(doc?.gstin),
    faqContactText: real(doc?.faqContactText),
    primaryColor: doc?.primaryColor || '',
    secondaryColor: doc?.secondaryColor || '',
    themeMode: doc?.themeMode || 'light',
});

let cached = null;
export const clearBusinessInfoCache = () => { cached = null; };

/** Read often by public pages, so kept for a minute; a save clears it at once on this instance. */
export async function getBusinessInfo() {
    if (cached && Date.now() - cached.at < PUBLIC_CACHE_MS) return cached.info;
    const info = toPublicBusinessInfo(await findBusinessSettings().lean());
    cached = { at: Date.now(), info };
    return info;
}

const assertContact = (label, value, isValid) => {
    if (value && !isValid(value)) throw new ValidationError(`${label} is not valid`);
};

/**
 * The bulk-order and support screens have their own inputs for these contact fields. They edit this record, so the
 * apps can never show two different numbers. `changes` holds only the fields the screen actually changed.
 */
export async function writeThroughBusinessContact(changes) {
    const entries = Object.entries(changes).filter(([, value]) => value !== undefined);
    if (!entries.length) return;
    const set = {};
    for (const [field, value] of entries) {
        const text = String(value ?? '').trim();
        if (/phone/i.test(field)) assertContact(field, text, isValidPhone);
        if (/email/i.test(field)) assertContact(field, text, isValidEmail);
        if (/[<>]/.test(text)) throw new ValidationError(`${field} cannot contain HTML`);
        set[field] = text;
    }
    const doc = (await findBusinessSettings()) || new FoodBusinessSettings();
    doc.set(set);
    await doc.save();
    clearBusinessInfoCache();
}
