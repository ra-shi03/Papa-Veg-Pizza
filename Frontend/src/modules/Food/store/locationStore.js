import { create } from 'zustand'

const parseSavedLocation = () => {
  if (typeof window === 'undefined') return { locationConfirmed: false, selectedAddress: null }
  try {
    const saved = localStorage.getItem("deliveryLocation")
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        locationConfirmed: !!parsed.locationConfirmed,
        selectedAddress: parsed.selectedAddress || null
      }
    }
  } catch (e) {
    console.error("Error reading deliveryLocation", e)
  }
  return {
    locationConfirmed: false,
    selectedAddress: null
  }
}

export const useLocationStore = create((set, get) => {
  const initial = parseSavedLocation()

  return {
    locationConfirmed: initial.locationConfirmed,
    selectedAddress: initial.selectedAddress,
    isModalOpen: false,
    modalMessage: "Please confirm your delivery location to continue ordering.",
    pendingAction: null,
    onCancelAction: null,

    clearLocation: () => {
      try {
        localStorage.removeItem("deliveryLocation")
        localStorage.removeItem("deliveryAddress")
        localStorage.removeItem("activeService")
        localStorage.removeItem("takeawayHut")
        localStorage.removeItem("carNumber")
        localStorage.removeItem("pickupStore")
      } catch (e) {
        // ignore
      }
      set({
        locationConfirmed: false,
        selectedAddress: null
      })
    },

    openLocationModal: (callback = null, message = "Please confirm your delivery location to continue ordering.", onCancel = null) => {
      set({
        isModalOpen: true,
        modalMessage: message,
        pendingAction: () => callback, // Store as function returning the callback to prevent execution on set
        onCancelAction: () => onCancel // Store as function returning the callback
      })
    },

    closeLocationModal: () => {
      const onCancel = get().onCancelAction
      set({
        isModalOpen: false,
        pendingAction: null,
        onCancelAction: null
      })
      if (onCancel && typeof onCancel === 'function') {
        const actualCancel = onCancel()
        if (actualCancel && typeof actualCancel === 'function') {
          actualCancel()
        }
      }
    },

    confirmLocation: (addressDetails) => {
      const pending = get().pendingAction
      const service = addressDetails.serviceType || "delivery"
      const isPickup = service !== "delivery" && service !== "train"
      const locationData = {
        locationConfirmed: true,
        selectedAddress: addressDetails
      }

      try {
        if (isPickup) {
          // Collected at a store: the customer's delivery point stays as it is. The chosen store and the service are kept apart.
          localStorage.setItem("activeService", service)
          localStorage.setItem("pickupStore", JSON.stringify({ id: addressDetails.storeId || "", name: addressDetails.storeName || "", service }))
          if (service === "takeaway") localStorage.setItem("takeawayHut", addressDetails.storeName || addressDetails.address || "")
          if (service === "incar") localStorage.setItem("carNumber", addressDetails.address || "")
        } else {
          localStorage.setItem("deliveryLocation", JSON.stringify(locationData))
          // Delivery on a train has no map point: the journey text is the address
          localStorage.setItem("deliveryAddress", addressDetails.address)
          localStorage.setItem("activeService", service)
          localStorage.removeItem("pickupStore")
        }
      } catch (e) {
        // ignore localStorage errors
      }

      set({
        locationConfirmed: true,
        selectedAddress: addressDetails,
        isModalOpen: false,
        pendingAction: null,
        onCancelAction: null
      })

      // Dispatch event for existing elements to sync
      window.dispatchEvent(new Event("cartUpdated"))

      if (pending && typeof pending === 'function') {
        const actualPending = pending()
        if (actualPending && typeof actualPending === 'function') {
          setTimeout(() => {
            try {
              actualPending()
            } catch (e) {
              console.error("Error executing pending action:", e)
            }
          }, 100)
        }
      }
    }
  }
})
