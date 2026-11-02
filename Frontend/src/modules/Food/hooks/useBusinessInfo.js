import { useEffect, useState } from "react"
import { getCachedSettings, loadBusinessSettings } from "@food/utils/businessSettings"

/** The business name and contact details from the super admin's settings. A field that is empty is hidden by the caller. */
export const useBusinessInfo = () => {
  const [info, setInfo] = useState(() => getCachedSettings() || {})

  useEffect(() => {
    let current = true
    loadBusinessSettings().then((settings) => {
      if (current && settings) setInfo(settings)
    })
    return () => {
      current = false
    }
  }, [])

  return info
}
