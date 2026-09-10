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
      const locationData = {
        locationConfirmed: true,
        selectedAddress: addressDetails
      }

      // Persist deliveryLocation structure
      try {
        localStorage.setItem("deliveryLocation", JSON.stringify(locationData))

        // Also set the legacy keys so existing components pick it up
        if (addressDetails.serviceType === "delivery") {
          localStorage.setItem("deliveryAddress", addressDetails.address)
          localStorage.setItem("activeService", "delivery")
        } else if (addressDetails.serviceType === "takeaway") {
          localStorage.setItem("takeawayHut", addressDetails.address)
          localStorage.setItem("activeService", "takeaway")
          localStorage.setItem("deliveryAddress", addressDetails.address)
        } else if (addressDetails.serviceType === "incar") {
          localStorage.setItem("carNumber", addressDetails.address)
          localStorage.setItem("activeService", "incar")
          localStorage.setItem("deliveryAddress", addressDetails.address)
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
