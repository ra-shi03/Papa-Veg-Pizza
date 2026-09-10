import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocationStore } from "@food/store/locationStore"

export default function LocationRequiredGuard({ children }) {
  const navigate = useNavigate()
  const { locationConfirmed, openLocationModal } = useLocationStore()

  useEffect(() => {
    if (!locationConfirmed) {
      openLocationModal(
        null,
        "Please confirm your delivery location to continue ordering.",
        () => {
          navigate('/food/user')
        }
      )
    }
  }, [locationConfirmed, openLocationModal, navigate])

  if (!locationConfirmed) {
    return null
  }

  return children
}
