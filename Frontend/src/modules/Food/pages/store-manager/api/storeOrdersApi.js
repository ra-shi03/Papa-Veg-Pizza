import { useEffect, useState } from "react";
import { adminClient } from "@/services/api/axios";

// `_isFallback` keeps the dev-only axios mock fallback from hiding real API errors.
const REAL = { _isFallback: true };
const BASE = "/food/store/orders";

const unwrap = (res) => res?.data?.data;

export const storeOrdersApi = {
  list: (view, params = {}) =>
    adminClient.get(BASE, { ...REAL, params: { view, ...params } }).then(unwrap),
  team: (role = "", q = "") =>
    adminClient.get(`${BASE}/team`, { ...REAL, params: { role, q } }).then(unwrap),
  accept: (orderId, payload) =>
    adminClient.patch(`${BASE}/${orderId}/accept`, payload, REAL).then(unwrap),
  reject: (orderId, payload) =>
    adminClient.patch(`${BASE}/${orderId}/reject`, payload, REAL).then(unwrap),
  assignStaff: (orderId, payload) =>
    adminClient.patch(`${BASE}/${orderId}/assign-staff`, payload, REAL).then(unwrap),
  stage: (orderId, stage) =>
    adminClient.patch(`${BASE}/${orderId}/stage`, { stage }, REAL).then(unwrap),
  priority: (orderId, priority) =>
    adminClient.patch(`${BASE}/${orderId}/priority`, { priority }, REAL).then(unwrap),
  pause: (orderId, payload) =>
    adminClient.patch(`${BASE}/${orderId}/pause`, payload, REAL).then(unwrap),
  delay: (orderId, payload) =>
    adminClient.patch(`${BASE}/${orderId}/delay`, payload, REAL).then(unwrap),
};

export const apiErrorMessage = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || "Something went wrong";

// Orders are polled; this keeps the "live feed" indicator the screens already show.
export const LIVE_POLL_MS = 8000;

export function useLiveIndicator(query) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    setConnected(!query.isError && query.isFetched);
  }, [query.isError, query.isFetched, query.dataUpdatedAt]);
  return connected;
}
