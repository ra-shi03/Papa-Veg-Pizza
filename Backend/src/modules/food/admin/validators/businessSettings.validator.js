import { z } from 'zod';
import { ValidationError } from '../../../../core/auth/errors.js';

// One rule for every business contact field, also used when the bulk-order and support screens write through to them.
const NO_HTML = /[<>]/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const digitsIn = (value) => value.replace(/\D/g, '');
export const isValidPhone = (value) => /^\+?[0-9][0-9 ()-]*$/.test(value) && digitsIn(value).length >= 7 && digitsIn(value).length <= 15;
export const isValidEmail = (value) => EMAIL.test(value) && value.length <= 100;

const text = (label, max) => z.string({ invalid_type_error: `${label} must be text` })
    .trim()
    .max(max, `${label} is too long (max ${max} characters)`)
    .refine((v) => !NO_HTML.test(v), `${label} cannot contain HTML`);
// Contact fields may be cleared: an empty one is hidden in the apps
const phone = (label) => text(label, 25).refine((v) => !v || isValidPhone(v), `${label} is not a valid phone number`);
const email = (label) => text(label, 100).refine((v) => !v || isValidEmail(v), `${label} is not a valid email address`);
const color = (label) => z.string().trim().regex(/^#[0-9a-fA-F]{3,8}$/, `${label} must be a hex colour`);

const storeId = z.string().regex(/^[a-f0-9]{24}$/i, 'Choose a store from the list');

/** Theme Settings: the apps that can have their own colours / font / logo, and the fonts on offer (loaded in index.html). */
export const APP_THEME_KEYS = ['user_app', 'delivery_app', 'admin_app'];
export const THEME_FONTS = ["'Poppins', sans-serif", "'Inter', sans-serif", "'Outfit', sans-serif", 'system-ui, sans-serif'];

const trainDelivery = z.object({
    defaultStoreId: z.union([storeId, z.literal(''), z.null()]).optional(),
    stations: z.array(z.object({
        name: text('Station name', 80).refine((v) => v.length >= 2, 'Enter the station name'),
        code: text('Station code', 8).transform((v) => v.toUpperCase()).refine((v) => /^[A-Z0-9]{2,8}$/.test(v), 'Station code must be 2-8 letters or digits'),
        storeId,
    })).max(500, 'Too many stations').optional(),
}).refine((v) => new Set((v.stations || []).map((s) => s.code)).size === (v.stations || []).length, 'Each station code can appear only once');

const schema = z.object({
    companyName: text('Business name', 80).refine((v) => v.length >= 2, 'Business name must be at least 2 characters'),
    email: email('Email'),
    phoneCountryCode: text('Country code', 6),
    phoneNumber: phone('Phone'),
    website: text('Website', 200).refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), 'Website must start with http:// or https://'),
    supportPhone: phone('Support phone'),
    supportEmail: email('Support email'),
    supportHours: text('Support hours', 100),
    cateringPhone: phone('Catering phone'),
    cateringEmail: email('Catering email'),
    whatsappNumber: phone('WhatsApp number'),
    address: text('Address', 250),
    state: text('State', 50),
    pincode: text('Pincode', 10).refine((v) => !v || /^\d{4,10}$/.test(v), 'Pincode must be 4-10 digits'),
    region: text('Region', 50),
    gstin: text('GSTIN', 15).transform((v) => v.toUpperCase()).refine((v) => !v || GSTIN.test(v), 'GSTIN is not valid'),
    faqContactText: text('FAQ contact text', 500),
    primaryColor: color('Primary colour'),
    secondaryColor: color('Secondary colour'),
    accentColor: color('Accent colour'),
    themeMode: z.enum(['light', 'dark']),
    maintenanceMode: z.boolean(),
    onlinePaymentOnly: z.boolean(),
    maxCodAmount: z.coerce.number({ invalid_type_error: 'COD limit must be a number' }).min(0, 'COD limit cannot be negative').max(1000000, 'COD limit is too high'),
    customerRegistration: z.boolean(),
    storeRegistration: z.boolean(),
    deliveryRegistration: z.boolean(),
    fssai: text('FSSAI number', 20).refine((v) => !v || /^\d{14}$/.test(v), 'FSSAI number must be 14 digits'),
    appThemes: z.record(
        z.enum(APP_THEME_KEYS),
        z.object({
            primaryColor: z.union([color('Primary colour'), z.literal('')]),
            secondaryColor: z.union([color('Secondary colour'), z.literal('')]),
            fontFamily: z.union([z.enum(THEME_FONTS), z.literal('')]),
            logoUrl: text('Logo URL', 500).refine((v) => !v || /^https?:\/\/[^\s]+$/i.test(v), 'Logo must be an http(s) URL'),
        }).partial()
    ),
    trainDelivery,
}).partial();

/** The toggles Toggle Management can change (PATCH /business-settings/toggles accepts only these). */
export const TOGGLE_FIELDS = ['maintenanceMode', 'onlinePaymentOnly', 'maxCodAmount', 'customerRegistration', 'storeRegistration', 'deliveryRegistration'];

/** Only the fields above survive; everything else in the request is ignored. */
export function validateBusinessSettingsDto(body) {
    const result = schema.safeParse(body && typeof body === 'object' ? body : {});
    if (!result.success) throw new ValidationError(result.error.issues?.[0]?.message || 'Invalid business settings');
    return result.data;
}
