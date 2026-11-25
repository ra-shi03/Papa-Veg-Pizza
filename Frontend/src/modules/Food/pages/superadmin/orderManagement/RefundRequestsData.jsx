// Refund requests screen, on the server's refunds (/food/admin/refunds): customers' refund requests and automatic ones.
// Approving pays the recorded amount (to the wallet or back through the gateway); the server never pays one twice.
import { useState, useEffect } from 'react';
import { adminClient } from '@/services/api/axios';

export const refundActivityLogs = [];

const STATUS = { pending: 'requested', processing: 'processing', processed: 'completed', rejected: 'rejected', failed: 'failed' };
const cache = new Map();

const toRefund = (r) => {
  const gatewayName = r.refundTo === 'gateway' ? 'Razorpay' : 'Wallet';
  const history = [{ status: 'requested', timestamp: r.createdAt, updatedBy: r.requestedBy || 'SYSTEM', role: r.requestedBy || 'SYSTEM', remarks: r.reason || '' }];
  if (r.processedAt) history.push({ status: STATUS[r.status] || r.status, timestamp: r.processedAt, updatedBy: 'Super Admin', role: 'ADMIN', remarks: r.rejectionReason || '' });
  const refund = {
    _id: String(r._id),
    refundNumber: `RF-${String(r._id).slice(-6).toUpperCase()}`,
    orderId: String(r.orderId),
    orderNumber: r.order?.orderNumber || String(r.orderId),
    customerName: r.customer?.name || 'Customer',
    customer: r.customer || {},
    order: r.order || { items: [] },
    refundAmount: Number(r.amount) || 0,
    reason: r.reason || '',
    status: STATUS[r.status] || r.status,
    gatewayName,
    gateway: gatewayName,
    paymentMethod: r.order?.paymentMethod || '',
    payment: { ...(r.payment || {}), gatewayName, availableBalance: Number(r.amount) || 0 },
    rejectionReason: r.rejectionReason || '',
    createdAt: r.createdAt,
    history,
  };
  cache.set(refund._id, refund);
  return refund;
};

const message = (e) => new Error(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Could not reach the server');

export async function getRefundRequests() {
  const all = [];
  for (let page = 1; page <= 10; page += 1) {   // newest first, 100 a page
    const data = (await adminClient.get('/food/admin/refunds', { params: { page, limit: 100 } }))?.data?.data || {};
    all.push(...(data.refunds || []).map(toRefund));
    if (page >= (data.totalPages || 1)) break;
  }
  return all;
}

export async function getRefundDetails(id) {
  if (!cache.has(id)) await getRefundRequests();
  if (!cache.has(id)) throw new Error('Refund request not found');
  return cache.get(id);
}

async function answer(id, action, body) {
  try {
    const res = (await adminClient.post(`/food/admin/refunds/${id}/${action}`, body))?.data?.data?.refund || {};
    const refund = { ...cache.get(id), status: STATUS[res.status] || (action === 'reject' ? 'rejected' : 'completed') };
    cache.set(id, refund);
    return { success: true, refund };
  } catch (e) {
    throw message(e);
  }
}

export async function approveRefund(id, amount) {
  const asked = cache.get(id)?.refundAmount;
  // the server pays the amount on the request; a different figure needs a new request from the customer
  if (asked != null && Number(amount) !== asked) throw new Error(`This request can only be paid in full (₹${asked}).`);
  return answer(id, 'approve', {});
}

export const rejectRefund = (id, reason, remarks) => answer(id, 'reject', { reason: [reason, remarks].filter(Boolean).join(' - ') });

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
