import { FoodBusinessSettings } from '../models/businessSettings.model.js';
import { isValidEmail, isValidPhone } from '../validators/businessSettings.validator.js';
import { ValidationError, ForbiddenError } from '../../../../core/auth/errors.js';
import { FoodStore } from '../../store/models/store.model.js';
import { loadMethods as loadOrderMethods, methodAllowedAt } from '../../settings/services/orderMethods.service.js';

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
    maintenanceMode: Boolean(doc?.maintenanceMode),
    // Toggle Management: the apps use these to hide what is switched off (the server enforces them too)
    maxCodAmount: Number(doc?.maxCodAmount) || 0,
    customerRegistration: doc?.customerRegistration !== false,
    storeRegistration: doc?.storeRegistration !== false,
    deliveryRegistration: doc?.deliveryRegistration !== false,
    fssai: real(doc?.fssai),
    // Theme Settings: per app colours / font / logo ({ user_app, delivery_app, admin_app })
    appThemes: doc?.appThemes instanceof Map ? Object.fromEntries(doc.appThemes) : (doc?.appThemes || {}),
});

const REGISTRATION = {
    customer: ['customerRegistration', 'New customer sign-ups are paused right now. Please try again later.'],
    store: ['storeRegistration', 'New stores cannot be registered right now. Please contact the head office.'],
    delivery: ['deliveryRegistration', 'New delivery partner sign-ups are paused right now. Please try again later.'],
};

/** Toggle Management: refuses a new customer / store / delivery partner while the super admin has that sign-up off. */
export async function assertRegistrationOpen(kind) {
    const [field, message] = REGISTRATION[kind];
    if ((await getBusinessInfo())[field] === false) throw new ForbiddenError(message);
}

/** True while the super admin has maintenance mode on: customer ordering is suspended. */
export const isMaintenanceMode = async () => Boolean((await getBusinessInfo()).maintenanceMode);

let cached = null;
let cachedStations = null;
export const clearBusinessInfoCache = () => { cached = null; cachedStations = null; };

/**
 * GET /food/train/stations: the stations a customer can pick, as { name, code } only: no store ids, no audit fields.
 * A station is listed when its store is approved and active. `available` is false when there is nothing to order from
 * (no such station and no usable default train store): the cart then says so before an order is placed.
 */
export async function getTrainStations() {
  if (cachedStations && Date.now() - cachedStations.at < PUBLIC_CACHE_MS) return cachedStations.info;
  const settings = await FoodBusinessSettings.findOne().sort({ createdAt: 1 }).select('trainDelivery').lean();
  const { stations = [], defaultStoreId = null } = settings?.trainDelivery || {};
  const ids = [...stations.map((s) => s.storeId), defaultStoreId].filter(Boolean);
  // A station counts only when its store is approved and active AND the super admin's "Delivery on Train" order
  // method is on for that store (all stores, its franchise, or the store itself).
  const trainMethod = (await loadOrderMethods()).find((m) => m.id === 'train');
  const usable = new Set(
    (await FoodStore.find({ _id: { $in: ids }, approvalStatus: 'Approved', isActive: { $ne: false } }).select('_id franchiseId').lean())
      .filter((s) => methodAllowedAt(trainMethod, s))
      .map((s) => String(s._id)),
  );
  const defaultAvailable = !!defaultStoreId && usable.has(String(defaultStoreId));
  const listed = stations.filter((s) => usable.has(String(s.storeId))).map(({ name, code }) => ({ name, code }));
  const info = { available: listed.length > 0 || defaultAvailable, defaultAvailable, stations: listed };
  cachedStations = { at: Date.now(), info };
  return info;
}

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
