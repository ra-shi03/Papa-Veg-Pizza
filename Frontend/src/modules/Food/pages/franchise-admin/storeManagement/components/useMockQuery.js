import { useState, useEffect, useCallback, useRef } from "react"

// Simple in-memory global query cache for revalidation
const globalQueryCache = new Map()

/**
 * Custom React Query-like hook useMockQuery
 * @param {string|Array} queryKey Unique key for the query (array of keys is serialized)
 * @param {Function} queryFn Axios-based function that returns a Promise resolving to a response
 * @param {Object} options Configuration parameters:
 *                         - enabled: boolean (default true)
 *                         - cacheTime: number of ms to consider data fresh (default 30000ms / 30s)
 *                         - refetchInterval: number of ms for background polling (disabled if undefined)
 *                         - onSuccess: callback on successful fetch
 *                         - onError: callback on error
 */
export function useMockQuery(queryKey, queryFn, options = {}) {
  const {
    enabled = true,
    cacheTime = 30000,
    refetchInterval,
    onSuccess,
    onError
  } = options

  // Serialize query key to ensure consistency
  const serializedKey = Array.isArray(queryKey)
    ? queryKey.map(k => (typeof k === "object" ? JSON.stringify(k) : String(k))).join("/")
    : String(queryKey)

  // Retrieve initial cache data if fresh
  const getCachedData = useCallback(() => {
    if (!cacheTime) return undefined
    const cached = globalQueryCache.get(serializedKey)
    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data
    }
    return undefined
  }, [serializedKey, cacheTime])

  const [data, setData] = useState(() => getCachedData())
  const [isLoading, setIsLoading] = useState(() => !getCachedData() && enabled)
  const [isRefetching, setIsRefetching] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState(null)

  // Use refs for callbacks to avoid re-triggering effects
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onSuccess, onError])

  // Track active fetch request
  const fetchCounter = useRef(0)

  const refetch = useCallback(async (isBackground = false) => {
    if (!enabled) return

    const currentFetchId = ++fetchCounter.current
    if (isBackground) {
      setIsRefetching(true)
    } else if (!getCachedData()) {
      setIsLoading(true)
    }

    setIsError(false)
    setError(null)

    try {
      const response = await queryFn()
      // Extract data safely depending on structure
      const payload = response?.data?.data !== undefined 
        ? response.data.data 
        : (response?.data !== undefined ? response.data : response)

      // Ensure we only apply results of the latest fetch
      if (currentFetchId === fetchCounter.current) {
        setData(payload)
        setIsLoading(false)
        setIsRefetching(false)
        
        if (cacheTime > 0) {
          globalQueryCache.set(serializedKey, {
            data: payload,
            timestamp: Date.now()
          })
        }

        if (onSuccessRef.current) {
          onSuccessRef.current(payload)
        }
      }
      return payload
    } catch (err) {
      if (currentFetchId === fetchCounter.current) {
        setIsError(true)
        setError(err?.response?.data?.message || err?.message || "Something went wrong")
        setIsLoading(false)
        setIsRefetching(false)

        if (onErrorRef.current) {
          onErrorRef.current(err)
        }
      }
      throw err
    }
  }, [serializedKey, queryFn, enabled, cacheTime, getCachedData])

  // Initial and reactive load on dependency changes
  useEffect(() => {
    if (!enabled) return

    const cachedVal = getCachedData()
    if (cachedVal !== undefined) {
      setData(cachedVal)
      setIsLoading(false)
      // Revalidate in background even if cache hit
      refetch(true)
    } else {
      refetch(false)
    }
  }, [serializedKey, enabled])

  // Polling setup
  useEffect(() => {
    if (!enabled || !refetchInterval) return

    const timer = setInterval(() => {
      refetch(true)
    }, refetchInterval)

    return () => clearInterval(timer)
  }, [serializedKey, enabled, refetchInterval, refetch])

  return {
    data,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch
  }
}
