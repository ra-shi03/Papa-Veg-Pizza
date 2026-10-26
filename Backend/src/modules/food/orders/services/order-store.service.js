import { FoodStore } from '../../store/models/store.model.js';
import { FoodZone } from '../../admin/models/zone.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { haversineKm } from './order.helpers.js';

const ORDERABLE = { approvalStatus: 'Approved', isActive: { $ne: false } };
const STORE_FIELDS = 'storeName code phone franchiseId zoneId address city state pincode latitude longitude';

const withLocation = (store) => {
  if (!store) return store;
  const hasPoint = Number.isFinite(store.latitude) && Number.isFinite(store.longitude);
  return { ...store, location: hasPoint ? { type: 'Point', coordinates: [store.longitude, store.latitude] } : undefined };
};

// Ray casting; zone coordinates are [{ latitude, longitude }].
const insidePolygon = (lat, lng, polygon = []) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if ((a.longitude > lng) !== (b.longitude > lng) &&
      lat < ((b.latitude - a.latitude) * (lng - a.longitude)) / (b.longitude - a.longitude) + a.latitude) {
      inside = !inside;
    }
  }
  return inside;
};

// Store that can take orders right now (approved + active) with a GeoJSON `location` for distance maths.
export async function getOrderableStore(storeId) {
  const store = await FoodStore.findOne({ _id: storeId, ...ORDERABLE }).select(STORE_FIELDS).lean();
  if (!store) throw new ValidationError('Store not accepting orders');
  return withLocation(store);
}

// Nearest orderable store to a delivery point. Stores whose zone contains the point win; with a single
// store (or no coordinates) it simply falls back to the first orderable store.
export async function resolveStoreForLocation(lat, lng) {
  const stores = (await FoodStore.find(ORDERABLE).select(STORE_FIELDS).lean()).map(withLocation);
  if (stores.length === 0) throw new ValidationError('No store is available right now');

  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);
  let pool = stores;
  if (hasPoint) {
    const zoneIds = [...new Set(stores.map((s) => s.zoneId && String(s.zoneId)).filter(Boolean))];
    if (zoneIds.length) {
      const zones = await FoodZone.find({ _id: { $in: zoneIds }, isActive: true }).select('coordinates').lean();
      const matching = new Set(zones.filter((z) => insidePolygon(lat, lng, z.coordinates)).map((z) => String(z._id)));
      const inZone = stores.filter((s) => s.zoneId && matching.has(String(s.zoneId)));
      if (inZone.length) pool = inZone;
    }
  }

  const ranked = pool
    .map((store) => ({
      store,
      distanceKm: hasPoint && store.location
        ? haversineKm(lat, lng, store.latitude, store.longitude)
        : null,
    }))
    .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  return ranked[0];
}
