import { useEffect, useState } from "react"
import apiClient from "@/services/api/axios"

/** The stations a customer can pick (name and code) and whether train delivery is available at all. null while loading. */
export const useTrainStations = (enabled = true) => {
  const [info, setInfo] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let current = true
    apiClient.get("/food/train/stations", { _isFallback: true })
      .then((res) => {
        if (current) setInfo(res?.data?.data || { available: false, defaultAvailable: false, stations: [] })
      })
      .catch(() => {
        if (current) setFailed(true)
      })
    return () => {
      current = false
    }
  }, [enabled])

  return { info, failed }
}
