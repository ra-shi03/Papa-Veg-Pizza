import { authKey } from "@/shared/utils/authNamespace";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { adminClient } from "@/services/api/axios";

// `_isFallback` keeps the dev-only axios fallback from hiding real API errors.
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
  // Completed Orders -> Reorder: lines = [{ index, quantity }] of the old order; the server prices it today (COD)
  reorder: (orderId, lines) =>
    adminClient.post(`${BASE}/${orderId}/reorder`, { lines }, REAL).then((res) => res?.data),
  reopen: (orderId, payload) =>
    adminClient.patch(`${BASE}/${orderId}/reopen`, payload, REAL).then(unwrap),
  // Rider hand-off, escalation and refunds live in the delivery and kitchen modules
  availableRiders: () =>
    adminClient.get("/store/delivery/available-riders", REAL).then(unwrap),
  assignRider: (orderId, riderId) =>
    adminClient.post("/store/delivery/assign", { orderId, riderId }, REAL).then(unwrap),
  confirmPickup: (orderId, payload) =>
    adminClient.patch(`/store/orders/${orderId}/pickup`, payload, REAL).then(unwrap),
  escalate: (orderId, payload) =>
    adminClient.post(`/food/store/kitchen/orders/${orderId}/escalate`, payload, REAL).then(unwrap),
  requestRefund: (orderId, payload) =>
    adminClient.post(`/store/orders/${orderId}/refund`, payload, REAL).then(unwrap),
  refunds: (orderId) =>
    adminClient.get(`/store/orders/${orderId}/refunds`, REAL).then(unwrap),
};

export const apiErrorMessage = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || "Something went wrong";

// Order changes are pushed over the socket ('order_event', sent to this store's room by the server from the signed
// token), so the lists refetch the moment something changes. The slow poll below is only a safety net for a
// dropped connection; it keeps the "live feed" indicator the screens already show.
export const LIVE_POLL_MS = 60000;

// ONE signed-in socket for the whole store panel (order lists, kitchen stations, delivery screens). The server puts it in
// this store's room from the signed token, so it only ever receives this store's events.
let shared = null;
let users = 0;           // feeds + screen hooks holding the socket
const listeners = new Set();
function acquire() {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem(authKey("admin", "accessToken")) : null;
  if (!token) return null;
  if (!shared) {
    const url = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(url, { auth: { token }, transports: ["websocket"], reconnectionAttempts: Infinity, reconnectionDelayMax: 10000 });
    shared = { socket, connected: false };
    socket.on("connect", () => { shared.connected = true; listeners.forEach((l) => l.onState(true)); });
    socket.on("disconnect", () => { if (shared) shared.connected = false; listeners.forEach((l) => l.onState(false)); });
    socket.on("order_event", (event) => listeners.forEach((l) => l.onEvent(event)));
    socket.on("store_event", (event) => listeners.forEach((l) => l.onEvent(event)));
  }
  users += 1;
  return shared;
}
function release() {
  users = Math.max(0, users - 1);
  if (!users && shared) { shared.socket.disconnect(); shared = null; }
}
function joinLiveFeed(onEvent, onState) {
  const s = acquire();
  if (!s) return () => {};
  const l = { onEvent, onState };
  listeners.add(l);
  onState(s.connected);
  return () => { listeners.delete(l); release(); };
}

/**
 * For screen hooks that listen to named events ("delivery:issue-created", "store:assignment-success", ...): a handle on the
 * shared signed-in socket. on(event, fn) subscribes (a "connect" handler runs at once when already connected);
 * disconnect() unsubscribes everything this handle added and lets the shared socket close when nobody needs it.
 */
export function storeSocket() {
  const s = acquire();
  const added = [];
  let released = false;
  return {
    on(event, fn) {
      if (!s) return this;
      s.socket.on(event, fn);
      added.push([event, fn]);
      if (event === "connect" && s.connected) fn();
      return this;
    },
    off(event, fn) { s?.socket.off(event, fn); return this; },
    emit(...args) { s?.socket.emit(...args); return this; },
    disconnect() {
      if (released) return;
      released = true;
      for (const [event, fn] of added) s?.socket.off(event, fn);
      if (s) release();
    },
    close() { this.disconnect(); },
  };
}

/** Calls onEvent for every order_event of this store (the same shared socket the order lists use). */
export function useOrderEvents(onEvent) {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  useEffect(() => joinLiveFeed((event) => handler.current?.(event), () => {}), []);
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

/**
 * Mounted once by the store panel layout: every order_event / store_event of this store refreshes whatever is on screen
 * right away (only the queries in use are refetched, and a burst of events becomes one refresh). The screens' own
 * slow polls stay as a safety net for a dropped connection.
 */
export function useStoreLiveRefresh() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let timer = null;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => queryClient.invalidateQueries({ refetchType: "active" }), 400);
    };
    const leave = joinLiveFeed(refresh, () => {});
    return () => { clearTimeout(timer); leave(); };
  }, [queryClient]);
}
