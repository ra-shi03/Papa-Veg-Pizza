import mongoose from 'mongoose';
import { FoodOrder } from '../../orders/models/order.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { sendPushNotification } from '../../../../core/notifications/firebase.service.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { logger } from '../../../../utils/logger.js';
import { FoodStoreDelayAlertSettings } from '../models/storeDelayAlertSettings.model.js';

// System Settings > Store Delay Alerts (ported from the Jharkhand Rasoi "Restaurant Delay Alerts").
// Admins register this browser / phone as an alert device; when a store has not accepted an order within
// `delayMinutes`, the selected devices get a push notification. Jharkhand schedules one queued job per order; Papa Veg
// runs without the job queue, so a sweep once a minute (sweepStoreDelayAlerts, started in server.js) does the same.

const ADMIN_LINK = '/food/superadmin/orders';
const UNACCEPTED = ['created', 'confirmed']; // placed, the store has not started it
const SCHEDULED_LEAD_MS = 15 * 60 * 1000; // a scheduled order is due for acceptance 15 minutes before its slot

const normalizeDevicePlatform = (value) => {
  const platform = String(value || '').toLowerCase();
  return ['ios', 'android', 'web'].includes(platform) ? platform : 'unknown';
};

const serializeSettings = (settings) => ({
  enabled: Boolean(settings?.enabled),
  delayMinutes: Number(settings?.delayMinutes || 5),
  devices: (settings?.devices || []).map((device) => ({
    id: String(device._id),
    name: device.name,
    platform: device.platform,
    devicePlatform: device.devicePlatform,
    deviceId: device.deviceId || '',
    adminId: String(device.adminId),
    selected: Boolean(device.selected),
    isActive: Boolean(device.isActive),
    lastSeenAt: device.lastSeenAt,
  })),
});

async function getSettingsDocument() {
  return FoodStoreDelayAlertSettings.findOneAndUpdate(
    { key: 'global' },
    { $setOnInsert: { key: 'global', enabled: false, delayMinutes: 5, devices: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

export async function getStoreDelayAlertSettings() {
  return serializeSettings(await getSettingsDocument());
}

export async function updateStoreDelayAlertSettings({ enabled, delayMinutes, selectedDeviceIds }) {
  const settings = await getSettingsDocument();
  const selectedIds = new Set((selectedDeviceIds || []).map(String));
  if (enabled && selectedDeviceIds !== undefined && selectedIds.size === 0) {
    throw new ValidationError('Select at least one notification device before enabling alerts.');
  }
  if (enabled !== undefined) settings.enabled = Boolean(enabled);
  if (delayMinutes !== undefined) settings.delayMinutes = Math.min(60, Math.max(1, Math.trunc(Number(delayMinutes) || 5)));
  if (selectedDeviceIds !== undefined) {
    settings.devices.forEach((device) => {
      device.selected = device.isActive && selectedIds.has(String(device._id));
    });
  }
  await settings.save();
  return serializeSettings(settings);
}

export async function registerStoreDelayAlertDevice(adminId, payload = {}) {
  if (!mongoose.Types.ObjectId.isValid(String(adminId || ''))) throw new ValidationError('Sign in again to register this device.');
  const token = String(payload.token || '').trim();
  const name = String(payload.name || '').trim().slice(0, 50);
  if (!token) throw new ValidationError('FCM token is required.');
  if (!name) throw new ValidationError('Device name is required.');
  const platform = payload.platform === 'mobile' ? 'mobile' : 'web';
  const deviceId = String(payload.deviceId || '').trim();
  const settings = await getSettingsDocument();
  let device = settings.devices.find((item) =>
    item.token === token || (deviceId && item.deviceId === deviceId && String(item.adminId) === String(adminId)),
  );
  if (device) {
    device.name = name;
    device.token = token;
    device.platform = platform;
    device.devicePlatform = normalizeDevicePlatform(payload.devicePlatform);
    device.deviceId = deviceId || device.deviceId || '';
    device.adminId = adminId;
    device.isActive = true;
    device.lastSeenAt = new Date();
  } else {
    settings.devices.push({
      name,
      token,
      platform,
      devicePlatform: normalizeDevicePlatform(payload.devicePlatform),
      deviceId,
      adminId,
      // the first device is selected straight away
      selected: settings.devices.filter((item) => item.isActive).length === 0,
      isActive: true,
      lastSeenAt: new Date(),
    });
    device = settings.devices[settings.devices.length - 1];
  }
  await settings.save();
  return { settings: serializeSettings(settings), deviceId: String(device._id) };
}

export async function removeStoreDelayAlertDevice(deviceId) {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) throw new ValidationError('Invalid device id.');
  const settings = await getSettingsDocument();
  const device = settings.devices.id(deviceId);
  if (!device) throw new ValidationError('Device not found.');
  const hasSelectedRemaining = settings.devices.some(
    (item) => String(item._id) !== String(deviceId) && item.selected && item.isActive,
  );
  device.deleteOne();
  // no device left to alert: alerts switch off rather than firing into nothing
  if (!hasSelectedRemaining) settings.enabled = false;
  await settings.save();
  return serializeSettings(settings);
}

export async function testStoreDelayAlertDevice(deviceId, delaySeconds = 0) {
  if (!mongoose.Types.ObjectId.isValid(deviceId)) throw new ValidationError('Invalid device id.');
  const settings = await getSettingsDocument();
  const device = settings.devices.id(deviceId);
  if (!device || !device.isActive) throw new ValidationError('Active device not found.');
  const safeDelaySeconds = Math.min(10, Math.max(0, Math.trunc(Number(delaySeconds) || 0)));
  if (safeDelaySeconds > 0) await new Promise((resolve) => setTimeout(resolve, safeDelaySeconds * 1000));
  const response = await sendPushNotification([device.token], {
    title: 'Store delay alert test',
    body: `Test notification sent to ${device.name}.`,
    dataOnly: false,
    data: { type: 'store_delay_alert_test', link: '/food/superadmin/system/store-delay-alerts' },
  });
  if (!response.successCount) throw new ValidationError(response.results?.[0]?.error || 'Test notification could not be delivered.');
  return response;
}

/** When the store's time to accept an order started: placing it, or 15 minutes before the slot of a scheduled order. */
const responseWindowStart = (order) => {
  const placed = new Date(order.createdAt).getTime();
  const slot = order.scheduledAt ? new Date(order.scheduledAt).getTime() : 0;
  return slot - SCHEDULED_LEAD_MS > placed ? slot - SCHEDULED_LEAD_MS : placed;
};

/**
 * Once a minute: every paid (or pay-on-delivery) order that its store has not accepted within the delay is reported to
 * the selected devices, once. Claiming an order (storeDelayAlertAt) is atomic, so with several server processes each
 * order is still reported only one time.
 */
export async function sweepStoreDelayAlerts() {
  const settings = await FoodStoreDelayAlertSettings.findOne({ key: 'global' });
  if (!settings?.enabled) return { skipped: 'disabled' };
  const devices = settings.devices.filter((device) => device.selected && device.isActive && device.token);
  if (!devices.length) return { skipped: 'no_selected_devices' };

  const delayMs = Math.max(1, Number(settings.delayMinutes || 5)) * 60 * 1000;
  const now = Date.now();
  const candidates = await FoodOrder.find({
    orderStatus: { $in: UNACCEPTED },
    'kitchen.acceptedAt': null,
    storeDelayAlertAt: null,
    createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
    // an online order the customer has not paid yet is not the store's to accept
    $or: [{ 'payment.method': { $in: ['cash', 'wallet', 'razorpay_qr'] } }, { 'payment.status': { $in: ['paid', 'authorized'] } }],
  })
    .select('_id order_id storeId createdAt scheduledAt')
    .limit(200)
    .lean();
  const due = candidates.filter((order) => responseWindowStart(order) + delayMs <= now);
  if (!due.length) return { alerted: 0 };

  const stores = await FoodStore.find({ _id: { $in: due.map((o) => o.storeId) } }).select('storeName').lean();
  const storeName = new Map(stores.map((s) => [String(s._id), s.storeName]));
  const invalidTokens = new Set();
  let alerted = 0;

  for (const order of due) {
    const claimed = await FoodOrder.updateOne({ _id: order._id, storeDelayAlertAt: null }, { $set: { storeDelayAlertAt: new Date() } });
    if (!claimed.modifiedCount) continue; // another process reported it
    const name = storeName.get(String(order.storeId)) || 'A store';
    const response = await sendPushNotification(devices.map((device) => device.token), {
      title: 'Store is not responding',
      body: `${name} has not accepted order #${order.order_id || order._id} within ${settings.delayMinutes} minutes.`,
      dataOnly: false,
      data: { type: 'store_response_delay', orderId: String(order._id), storeId: String(order.storeId || ''), link: ADMIN_LINK },
    });
    (response.results || []).filter((r) => !r.ok && r.remove).forEach((r) => invalidTokens.add(r.token));
    alerted += 1;
  }

  // Devices whose token Firebase rejected for good are switched off (the admin can register them again)
  if (invalidTokens.size) {
    settings.devices.forEach((device) => {
      if (invalidTokens.has(device.token)) {
        device.isActive = false;
        device.selected = false;
      }
    });
    await settings.save();
    logger.warn(`Store delay alerts: ${invalidTokens.size} device token(s) rejected and switched off`);
  }
  return { alerted };
}
