import mongoose from 'mongoose';
import { FoodStore } from '../models/store.model.js';
import { StoreHours } from '../../franchise/models/storeHours.model.js';
import { StoreManager } from '../../franchise/models/storeManager.model.js';
import { isOpenAt, isManuallyClosed, windowOn, to12, to24, WEEK } from '../../franchise/services/storeHours.js';
import { ForbiddenError, NotFoundError } from '../../../../core/auth/errors.js';

// The store manager's Open / Closed switch (Store panel). Scope comes from the token: a manager reads and changes only their
// own store. "Closed" stops new customer orders right now; the weekly hours, holidays and the franchise admin's temporary
// closure stay as they are. Switching to Open reopens the store only when its hours (and any temporary closure) allow it.

const asRole = (user) => String(user?.role || '').trim().replace(/-/g, '_').toUpperCase();

async function myStore(user) {
  if (asRole(user) !== 'STORE_MANAGER') throw new ForbiddenError('Only the store manager can change the store status.');
  let storeId = user.storeId;
  if (!mongoose.isValidObjectId(String(storeId || '')) && user.userId) {
    const mgr = await StoreManager.findOne({ userId: user.userId }).select('storeId').lean();
    if (mgr?.storeId) storeId = mgr.storeId;
  }
  if (!mongoose.isValidObjectId(String(storeId || ''))) throw new ForbiddenError('No store is linked to your account.');
  const store = await FoodStore.findById(storeId).select('storeName franchiseId').lean();
  if (!store) throw new NotFoundError('Store not found');
  return store;
}

const view = (store, doc) => {
  const manuallyClosed = isManuallyClosed(doc);
  const withinHours = isOpenAt(doc);   // hours, holidays and any temporary closure
  const now = new Date();
  const todayWindow = windowOn(doc, now);
  let openTime = '10:00 AM';
  let closeTime = '11:00 PM';
  if (todayWindow?.open && todayWindow?.close && (todayWindow.open !== todayWindow.close || todayWindow.isClosed)) {
    openTime = to12(todayWindow.open);
    closeTime = to12(todayWindow.close);
  }
  const storeTiming = `${openTime} - ${closeTime}`;

  return {
    storeId: String(store._id),
    storeName: store.storeName,
    isOpen: !manuallyClosed && withinHours,   // what customers see right now
    switchOn: !manuallyClosed,                // the toggle: Store Open
    withinHours,
    manuallyClosed,
    closedBy: manuallyClosed ? doc?.manualClosure?.by || '' : '',
    closedAt: manuallyClosed ? doc?.manualClosure?.at || null : null,
    openTime,
    closeTime,
    storeTiming,
    opensAt: openTime,
  };
};

export async function getOpenStatus(user) {
  const store = await myStore(user);
  return view(store, await StoreHours.findOne({ storeId: store._id }).lean());
}

export async function setOpenStatus(user, input) {
  const store = await myStore(user);
  const by = (await StoreManager.findOne({ userId: new mongoose.Types.ObjectId(String(user.userId)), storeId: String(store._id) }).select('name').lean())?.name || 'Store Manager';

  const updateFields = {};
  if (typeof input === 'boolean') {
    const manualClosure = input ? { active: false, by: '', at: null } : { active: true, by, at: new Date() };
    updateFields.manualClosure = manualClosure;
  } else if (input && typeof input === 'object') {
    if (typeof input.open === 'boolean') {
      const manualClosure = input.open ? { active: false, by: '', at: null } : { active: true, by, at: new Date() };
      updateFields.manualClosure = manualClosure;
    }
    if (input.openTime && input.closeTime) {
      const open24 = to24(input.openTime, 'opening time');
      const close24 = to24(input.closeTime, 'closing time');
      const weekHours = Object.fromEntries(
        WEEK.map((d) => [d, { open: open24, close: close24, isClosed: false }])
      );
      updateFields.week = weekHours;
      updateFields.updatedBy = by;
    }
  }

  // A store with no hours record is open all day, so closing it creates a record with the default (open all day) hours.
  const doc = await StoreHours.findOneAndUpdate(
    { storeId: store._id },
    { $set: updateFields, $setOnInsert: { franchiseId: store.franchiseId } },
    { new: true, upsert: true },
  ).lean();
  return view(store, doc);
}
