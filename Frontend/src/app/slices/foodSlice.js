import { createSlice } from '@reduxjs/toolkit'

const findCartItemIndex = (items, id, storeId) =>
  items.findIndex(
    (item) =>
      item.id === id &&
      (storeId == null || item.storeId === storeId)
  )

const initialState = {
  // Cart: food delivery items
  cart: {
    items: [], // [{ id, storeId, name, price, quantity, ... }]
  },
  // Stores list / selected (for UI state, not full catalog)
  stores: {
    list: [],
    selectedStoreId: null,
  },
  // User's food orders (summary for UI; full data from API)
  orders: {
    list: [],
    activeOrderId: null,
  },
  // Zone & address (minimize zone/address API calls; home/cart/checkout read from here)
  zoneId: null,
  selectedAddressId: null,
  // Order tracking cache: { [orderId]: { order, tracking } } – Firebase listener updates this
  orderTrackingByOrderId: {},
}

const foodSlice = createSlice({
  name: 'food',
  initialState,
  reducers: {
    // —— Cart ——
    addToCart(state, action) {
      const { id, storeId, quantity = 1, ...rest } = action.payload || {}
      if (!id) return
      const items = state.cart.items
      const idx = findCartItemIndex(items, id, storeId)
      if (idx === -1) {
        state.cart.items.push({ id, storeId, quantity, ...rest })
      } else {
        state.cart.items[idx].quantity += quantity
      }
    },
    removeFromCart(state, action) {
      const { id, storeId } = action.payload || {}
      state.cart.items = state.cart.items.filter(
        (item) =>
          !(
            item.id === id &&
            (storeId == null || item.storeId === storeId)
          )
      )
    },
    clearCart(state) {
      state.cart.items = []
    },
    setCart(state, action) {
      state.cart.items = Array.isArray(action.payload) ? action.payload : []
    },

    // —— Stores ——
    setStoresList(state, action) {
      state.stores.list = Array.isArray(action.payload)
        ? action.payload
        : []
    },
    setSelectedStore(state, action) {
      state.stores.selectedStoreId = action.payload ?? null
    },

    // —— Orders ——
    setOrdersList(state, action) {
      state.orders.list = Array.isArray(action.payload) ? action.payload : []
    },
    setActiveOrderId(state, action) {
      state.orders.activeOrderId = action.payload ?? null
    },

    setZoneId(state, action) {
      state.zoneId = action.payload ?? null
    },
    setSelectedAddressId(state, action) {
      state.selectedAddressId = action.payload ?? null
    },
    setOrderTracking(state, action) {
      const { orderId, order, tracking } = action.payload || {}
      if (!orderId) return
      state.orderTrackingByOrderId[orderId] = { order, tracking }
    },
    clearOrderTracking(state, action) {
      const orderId = action.payload
      if (orderId) delete state.orderTrackingByOrderId[orderId]
    },

    // Reset entire food slice (e.g. on logout)
    resetFood(state) {
      state.cart.items = []
      state.stores.list = []
      state.stores.selectedStoreId = null
      state.orders.list = []
      state.orders.activeOrderId = null
      state.zoneId = null
      state.selectedAddressId = null
      state.orderTrackingByOrderId = {}
    },
  },
})

export const {
  addToCart,
  removeFromCart,
  clearCart,
  setCart,
  setStoresList,
  setSelectedStore,
  setOrdersList,
  setActiveOrderId,
  setZoneId,
  setSelectedAddressId,
  setOrderTracking,
  clearOrderTracking,
  resetFood,
} = foodSlice.actions
export default foodSlice.reducer
