import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
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

// Order changes are pushed over the socket ('order_event', sent to this store's room by the server from the signed
// token), so the lists refetch the moment something changes. The slow poll below is only a safety net for a
// dropped connection; it keeps the "live feed" indicator the screens already show.
export const LIVE_POLL_MS = 60000;

let shared = null; // one socket for every list on the page
const listeners = new Set();
function joinLiveFeed(onEvent, onState) {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("admin_accessToken") : null;
  if (!token) return () => {};
  if (!shared) {
    const url = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(url, { auth: { token }, transports: ["websocket"], reconnectionAttempts: 10 });
    shared = { socket, connected: false };
    socket.on("connect", () => { shared.connected = true; listeners.forEach((l) => l.onState(true)); });
    socket.on("disconnect", () => { shared.connected = false; listeners.forEach((l) => l.onState(false)); });
    socket.on("order_event", (event) => listeners.forEach((l) => l.onEvent(event)));
  }
  const l = { onEvent, onState };
  listeners.add(l);
  onState(shared.connected);
  return () => {
    listeners.delete(l);
    if (!listeners.size && shared) { shared.socket.disconnect(); shared = null; }
  };
}

export function useLiveIndicator(query) {
  const [connected, setConnected] = useState(false);
  const [socketUp, setSocketUp] = useState(false);
  const refetch = useRef(query.refetch);
  refetch.current = query.refetch;
  useEffect(() => joinLiveFeed(() => refetch.current?.(), setSocketUp), []);
  useEffect(() => {
    setConnected(socketUp || (!query.isError && query.isFetched));
  }, [socketUp, query.isError, query.isFetched, query.dataUpdatedAt]);
  return connected;
}
