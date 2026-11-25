// Super admin order screens (All Orders, Order Tracking): every value comes from the server (realOrders.js).
import { useState, useEffect } from 'react';
import * as real from './realOrders';
import { adminClient } from '@/services/api/axios';

// Filter options for the franchise / store / rider dropdowns, filled from the server when orders load
export const franchiseOptions = [];
export const storeOptions = [];
export const riderOptions = [];

const fillOptions = async () => {
  const options = await real.fetchFilterOptions().catch(() => null);
  if (!options) return;
  franchiseOptions.splice(0, franchiseOptions.length, ...options.franchises);
  storeOptions.splice(0, storeOptions.length, ...options.stores);
};

export const getKpiData = () => real.fetchAdminKpis();

export const getOrders = (filters = {}, page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc') =>
  real.fetchAdminOrders(filters, page, limit, sortBy, sortOrder).then(async (result) => {
    await fillOptions();
    return result;
  });

export const getOrderDetails = (orderId) => real.fetchAdminOrder(orderId);
export const getOrderStatusLogs = (orderId) => real.fetchAdminOrderLogs(orderId);
export const getOrderTracking = (orderId) => real.fetchAdminTracking(orderId);

export const getLiveOrders = (filters = {}, page = 1, limit = 5, sortBy = 'createdAt', sortOrder = 'desc') =>
  real.fetchLiveOrders(filters, page, limit, sortBy, sortOrder).then(async (result) => {
    await fillOptions();
    const riders = new Map();
    for (const o of result.orders) if (o.deliveryPartner?._id) riders.set(o.deliveryPartner._id, { _id: o.deliveryPartner._id, name: o.deliveryPartner.name });
    riderOptions.splice(0, riderOptions.length, ...riders.values());
    return result;
  });

export const getLiveOrderTracking = (orderId) => real.fetchLiveTracking(orderId);
export const getLiveEventsStream = (orderId) => real.fetchOrderEvents(orderId);
export const getRiderDetailsApi = (riderId) => real.fetchRiderDetails(riderId);
export const getCustomerDetailsApi = (customerId) => real.fetchCustomerDetails(customerId);

// Cancel, refund and delay alert (super admin; the server checks the order's state and pays money at most once)
const act = async (orderId, action, body) => {
  try {
    const res = await adminClient.post(`/food/admin/orders/${orderId}/${action}`, body);
    return { success: true, data: res?.data?.data };
  } catch (e) {
    throw new Error(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Could not reach the server');
  }
};
export const cancelOrderApi = (orderId, reason) => act(orderId, 'cancel', { reason });
export const initiateRefundApi = (orderId, amount, reason) => act(orderId, 'refund', { amount, reason });
export const postOrderDelayAlert = (orderId, target, message) => act(orderId, 'delay-alert', { target, message });

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
