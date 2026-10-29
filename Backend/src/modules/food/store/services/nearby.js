import { FoodStore } from '../models/store.model.js';
import { FoodZone } from '../../admin/models/zone.model.js';

// Who counts as "near" a store, for the store panel's rider and customer lists. One rule for both:
//   1. a person with saved coordinates is near when they are within NEARBY_RADIUS_KM (default 10) of the store's
//      coordinates; a store without coordinates uses its zone polygon instead;
//   2. a person without coordinates is near when their saved city equals the store's city or its zone's name /
//      service location, or a part of those (the name in brackets, the comma-separated parts: "North India (Delhi)"
//      also matches "Delhi"); case-insensitive, spaces trimmed and collapsed;
//   3. anyone else is not near.
// Only saved records are read (the store, its zone, the person's stored location); nothing from the request.

const EARTH_KM = 6378.1;
const DEFAULT_RADIUS_KM = 10;

/** Radius in km, read at call time so a changed env applies without a restart of the module. */
export function nearbyRadiusKm() {
  const n = Number(process.env.NEARBY_RADIUS_KM);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RADIUS_KM;
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (v) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase();

/** "North India (Delhi)" -> ["north india (delhi)", "delhi", "north india"]; "Indore, MP" -> ["indore, mp", "indore", "mp"]. */
export function areaNames(value) {
  const whole = norm(value);
  if (!whole) return [];
  const inBrackets = [...whole.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
  const outside = whole.replace(/\([^)]*\)/g, ' ');
  const parts = [...inBrackets, outside].flatMap((t) => t.split(/[,/]/)).map(norm).filter((t) => t.length >= 3);
  return [...new Set([whole, ...parts])];
}
const hasPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

/** The store's saved position, zone polygon and area names: what the nearby filters are built from. */
export async function storeArea(storeOrId) {
  const id = storeOrId?._id || storeOrId;
  const store = await FoodStore.findById(id).select('latitude longitude city zoneId').lean();
  if (!store) return { center: null, polygon: null, labels: [] };
  const zone = store.zoneId
    ? await FoodZone.findOne({ _id: store.zoneId, isActive: { $ne: false } }).select('name zoneName serviceLocation coordinates').lean()
    : null;
  const ring = (zone?.coordinates || []).filter((c) => hasPoint(c.latitude, c.longitude)).map((c) => [c.longitude, c.latitude]);
  if (ring.length >= 3 && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) ring.push(ring[0]);
  const labels = [...new Set([store.city, zone?.name, zone?.zoneName, zone?.serviceLocation].flatMap(areaNames))];
  return {
    center: hasPoint(store.latitude, store.longitude) ? [store.longitude, store.latitude] : null,
    polygon: ring.length >= 4 ? { type: 'Polygon', coordinates: [ring] } : null,
    labels,
  };
}

/** Distance in km from the store's centre to a [lng, lat] point, or null. */
export function distanceKm(area, coords) {
  if (!area.center || !Array.isArray(coords) || !hasPoint(coords[1], coords[0])) return null;
  const rad = (d) => (d * Math.PI) / 180;
  const [lng1, lat1] = area.center;
  const [lng2, lat2] = coords;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

const within = (area) => (area.center
  ? { $geoWithin: { $centerSphere: [area.center, nearbyRadiusKm() / EARTH_KM] } }
  : area.polygon ? { $geoWithin: { $geometry: area.polygon } } : null);

const noCoords = (path) => ({ $or: [{ [`${path}.coordinates`]: { $exists: false } }, { [`${path}.coordinates`]: { $size: 0 } }, { [`${path}.coordinates`]: [0, 0] }] });
const cityIn = (area) => ({ $in: area.labels.map((l) => new RegExp(`^\\s*${l.split(' ').map(escapeRegex).join('\\s+')}\\s*$`, 'i')) });

/**
 * Mongo filter for people near the store, for a collection with one GeoJSON point (`point`) and a city (`city`).
 * Matches nothing when the store has no position, zone or city.
 */
export function nearbyFilter(area, { point, city }) {
  const or = [];
  const geo = within(area);
  if (geo) or.push({ [point]: geo });
  if (area.labels.length) or.push({ $and: [noCoords(point), { [city]: cityIn(area) }] });
  return or.length ? { $or: or } : { _id: { $exists: false } };
}

/**
 * The same rule for people with a list of saved addresses (`list`, each with `point` and `city`): near when any
 * address is near.
 */
export function nearbyAddressFilter(area, { list, point, city }) {
  const or = [];
  const geo = within(area);
  if (geo) or.push({ [`${list}.${point}`]: geo });
  if (area.labels.length) {
    or.push({
      [list]: {
        $elemMatch: {
          $and: [
            { $or: [{ [`${point}.coordinates`]: { $exists: false } }, { [`${point}.coordinates`]: { $size: 0 } }, { [`${point}.coordinates`]: [0, 0] }] },
            { [city]: cityIn(area) },
          ],
        },
      },
    });
  }
  return or.length ? { $or: or } : { _id: { $exists: false } };
}
