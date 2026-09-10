import { useLocationStore } from "@food/store/locationStore"

export function useLocationGuard() {
  const { locationConfirmed, openLocationModal } = useLocationStore()

  const checkLocation = (callback, message = "Please confirm your delivery location to continue ordering.", onCancel = null) => {
    if (!locationConfirmed) {
      openLocationModal(callback, message, onCancel)
      return false
    }
    if (callback) {
      callback()
    }
    return true
  }

  return checkLocation
}
