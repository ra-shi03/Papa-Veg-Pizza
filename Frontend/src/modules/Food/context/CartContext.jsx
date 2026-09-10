// src/context/cart-context.jsx
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import { buildCartLineId } from "@food/utils/foodVariants"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


// Default cart context value to prevent errors during initial render
const defaultCartContext = {
  _isProvider: false, // Flag to identify if this is from the actual provider
  cart: [],
  items: [],
  itemCount: 0,
  total: 0,
  lastAddEvent: null,
  lastRemoveEvent: null,
  addToCart: () => {
    debugWarn('CartProvider not available - addToCart called');
  },
  removeFromCart: () => {
    debugWarn('CartProvider not available - removeFromCart called');
  },
  updateQuantity: () => {
    debugWarn('CartProvider not available - updateQuantity called');
  },
  getCartCount: () => 0,
  isInCart: () => false,
  getCartItem: () => null,
  clearCart: () => {
    debugWarn('CartProvider not available - clearCart called');
  },
  cleanCartForStore: () => {
    debugWarn('CartProvider not available - cleanCartForStore called');
  },
  replaceCart: () => {
    debugWarn('CartProvider not available - replaceCart called');
  },
}

const CartContext = createContext(defaultCartContext)

const normalizeCartData = (rawCart) => {
  if (!Array.isArray(rawCart)) return []

  return rawCart
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const parsedQuantity = Number(item.quantity)
      const parsedPrice = Number(item.price)
      const normalizedStoreName =
        typeof item.store === "string"
          ? item.store
          : typeof item.store?.name === "string"
            ? item.store.name
            : ""

      const normalizedStoreId =
        item.storeId ||
        item.store_id ||
        item.store?._id ||
        item.store?.storeId ||
        null

      const normalizedImage =
        item.image ||
        item.imageUrl ||
        item.product?.imageUrl ||
        item.product?.image ||
        ""

      const baseItemId =
        item.itemId ||
        item.productId ||
        item.foodId ||
        item.baseItemId ||
        item.menuItemId ||
        item.id ||
        item._id ||
        `cart-item-${index}`

      const variantId = item.variantId || item.variant?._id || item.variant?.id || ""
      const variantName =
        typeof item.variantName === "string"
          ? item.variantName
          : typeof item.variant?.name === "string"
            ? item.variant.name
            : ""
      const parsedVariantPrice = Number(
        item.variantPrice ?? item.variant?.price ?? item.price,
      )
      const lineItemId =
        item.lineItemId ||
        item.cartLineId ||
        buildCartLineId(baseItemId, variantId)

      return {
        ...item,
        id: lineItemId,
        lineItemId,
        itemId: String(baseItemId),
        productId: String(baseItemId),
        variantId: variantId ? String(variantId) : "",
        variantName,
        variantPrice: Number.isFinite(parsedVariantPrice) ? parsedVariantPrice : 0,
        name: item.name || item.product?.name || "Item",
        quantity:
          Number.isFinite(parsedQuantity) && parsedQuantity > 0
            ? Math.floor(parsedQuantity)
            : 1,
        price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
        store: normalizedStoreName,
        storeId: normalizedStoreId,
        image: normalizedImage,
        imageUrl: normalizedImage,
      }
    })
}

const resolveCartEntryId = (items, itemId, variantId = "") => {
  const normalizedItemId = String(itemId || "")
  const safeItems = Array.isArray(items) ? items : []

  const directMatch = safeItems.find((item) => item.id === normalizedItemId)
  if (directMatch) return directMatch.id

  const preferredId = buildCartLineId(normalizedItemId, variantId)

  const exactMatch = safeItems.find((item) => item.id === preferredId)
  if (exactMatch) return exactMatch.id

  if (!variantId) {
    const legacyBaseMatch = safeItems.find(
      (item) =>
        String(item.itemId || item.productId || item.id || "") === normalizedItemId &&
        !String(item.variantId || "").trim(),
    )
    if (legacyBaseMatch) return legacyBaseMatch.id
  }

  return preferredId
}

export function CartProvider({ children }) {
  // Safe init (works with SSR and bad JSON)
  const [cart, setCart] = useState(() => {
    if (typeof window === "undefined") return []
    try {
      const saved = localStorage.getItem("cart")
      const parsed = saved ? JSON.parse(saved) : []
      return normalizeCartData(parsed)
    } catch {
      return []
    }
  })

  // Track last add event for animation
  const [lastAddEvent, setLastAddEvent] = useState(null)
  // Track last remove event for animation
  const [lastRemoveEvent, setLastRemoveEvent] = useState(null)

  // Persist to localStorage whenever cart changes
  useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem("cart", JSON.stringify(normalizeCartData(cart)))
      } else {
        localStorage.removeItem("cart")
      }
    } catch {
      // ignore storage errors (private mode, quota, etc.)
    }
  }, [cart])

  const addToCart = (item, sourcePosition = null) => {
    const safeCart = normalizeCartData(cart)
    if (safeCart.length > 0) {
      const firstItemStoreId = safeCart[0]?.storeId
      const firstItemStoreName = safeCart[0]?.store
      const newItemStoreId = item?.storeId
      const newItemStoreName = item?.store
      const normalizeName = (name) => (name ? String(name).trim().toLowerCase() : '')

      const firstStoreNameNormalized = normalizeName(firstItemStoreName)
      const newStoreNameNormalized = normalizeName(newItemStoreName)
      const hasNameMismatch =
        firstStoreNameNormalized &&
        newStoreNameNormalized &&
        firstStoreNameNormalized !== newStoreNameNormalized

      const hasIdMismatch =
        !firstStoreNameNormalized &&
        !newStoreNameNormalized &&
        firstItemStoreId &&
        newItemStoreId &&
        String(firstItemStoreId) !== String(newItemStoreId)

      if (hasNameMismatch || hasIdMismatch) {
        const message = `Cart already contains items from "${firstItemStoreName || 'another store'}". Please clear cart or complete order first.`
        return { ok: false, error: message, code: 'STORE_MISMATCH' }
      }
    }

    if (!item?.storeId && !item?.store) {
      return {
        ok: false,
        error: 'Item is missing store information. Please refresh the page.',
        code: 'MISSING_STORE'
      }
    }

    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      // CRITICAL: Validate store consistency
      // If cart already has items, ensure new item belongs to the same store
      if (safePrev.length > 0) {
        const firstItemStoreId = safePrev[0]?.storeId;
        const firstItemStoreName = safePrev[0]?.store;
        const newItemStoreId = item?.storeId;
        const newItemStoreName = item?.store;
        
        // Normalize store names for comparison (trim and case-insensitive)
        const normalizeName = (name) => name ? name.trim().toLowerCase() : '';
        const firstStoreNameNormalized = normalizeName(firstItemStoreName);
        const newStoreNameNormalized = normalizeName(newItemStoreName);
        
        // Check store name first (more reliable than IDs which can have different formats)
        // If names match, allow it even if IDs differ (same store, different ID format)
        if (firstStoreNameNormalized && newStoreNameNormalized) {
          if (firstStoreNameNormalized !== newStoreNameNormalized) {
            debugError('❌ Cannot add item: Store name mismatch!', {
              cartStoreId: firstItemStoreId,
              cartStoreName: firstItemStoreName,
              newItemStoreId: newItemStoreId,
              newItemStoreName: newItemStoreName
            });
            return safePrev;
          }
          // Names match - allow it (even if IDs differ, it's the same store)
        } else if (firstItemStoreId && newItemStoreId) {
          // If names are not available, fallback to ID comparison
          if (firstItemStoreId !== newItemStoreId) {
            debugError('❌ Cannot add item: Cart contains items from different store!', {
              cartStoreId: firstItemStoreId,
              cartStoreName: firstItemStoreName,
              newItemStoreId: newItemStoreId,
              newItemStoreName: newItemStoreName
            });
            return safePrev;
          }
        }
      }
      
      const existing = safePrev.find((i) => i.id === item.id)
      if (existing) {
        // Set last add event for animation when incrementing existing item
        if (sourcePosition) {
          setLastAddEvent({
            product: {
              id: item.id,
              name: item.name,
              imageUrl: item.image || item.imageUrl,
            },
            sourcePosition,
          })
          // Clear after animation completes (increased delay)
          setTimeout(() => setLastAddEvent(null), 1500)
        }
        return safePrev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      
      // Validate item has required store info
      if (!item.storeId && !item.store) {
        debugError('❌ Cannot add item: Missing store information!', item);
        return safePrev;
      }
      
      const newItem = { ...item, quantity: 1 }
      
      // Set last add event for animation if sourcePosition is provided
      if (sourcePosition) {
        setLastAddEvent({
          product: {
            id: item.id,
            name: item.name,
            imageUrl: item.image || item.imageUrl,
          },
          sourcePosition,
        })
        // Clear after animation completes (increased delay to allow full animation)
        setTimeout(() => setLastAddEvent(null), 1500)
      }
      
      return [...safePrev, newItem]
    })

    return { ok: true }
  }

  const removeFromCart = (itemId, sourcePosition = null, productInfo = null) => {
    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      const resolvedItemId = resolveCartEntryId(safePrev, itemId)
      const itemToRemove = safePrev.find((i) => i.id === resolvedItemId)
      if (itemToRemove && sourcePosition && productInfo) {
        // Set last remove event for animation
        setLastRemoveEvent({
          product: {
            id: productInfo.id || itemToRemove.id,
            name: productInfo.name || itemToRemove.name,
            imageUrl: productInfo.imageUrl || productInfo.image || itemToRemove.image || itemToRemove.imageUrl,
          },
          sourcePosition,
        })
        // Clear after animation completes
        setTimeout(() => setLastRemoveEvent(null), 1500)
      }
      return safePrev.filter((i) => i.id !== resolvedItemId)
    })
  }

  const updateQuantity = (itemId, quantity, sourcePosition = null, productInfo = null) => {
    const safeCart = normalizeCartData(cart)
    const resolvedItemId = resolveCartEntryId(safeCart, itemId)
    if (quantity <= 0) {
      setCart((prev) => {
        const safePrev = normalizeCartData(prev)
        const itemToRemove = safePrev.find((i) => i.id === resolvedItemId)
        if (itemToRemove && sourcePosition && productInfo) {
          // Set last remove event for animation
          setLastRemoveEvent({
            product: {
              id: productInfo.id || itemToRemove.id,
              name: productInfo.name || itemToRemove.name,
              imageUrl: productInfo.imageUrl || productInfo.image || itemToRemove.image || itemToRemove.imageUrl,
            },
            sourcePosition,
          })
          // Clear after animation completes
          setTimeout(() => setLastRemoveEvent(null), 1500)
        }
        return safePrev.filter((i) => i.id !== resolvedItemId)
      })
      return
    }
    
    // When quantity decreases (but not to 0), also trigger removal animation
    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      const existingItem = safePrev.find((i) => i.id === resolvedItemId)
      if (existingItem && quantity < existingItem.quantity && sourcePosition && productInfo) {
        // Set last remove event for animation when decreasing quantity
        setLastRemoveEvent({
          product: {
            id: productInfo.id || existingItem.id,
            name: productInfo.name || existingItem.name,
            imageUrl: productInfo.imageUrl || productInfo.image || existingItem.image || existingItem.imageUrl,
          },
          sourcePosition,
        })
        // Clear after animation completes
        setTimeout(() => setLastRemoveEvent(null), 1500)
      }
      return safePrev.map((i) => (i.id === resolvedItemId ? { ...i, quantity } : i))
    })
  }

  const getCartCount = () =>
    normalizeCartData(cart).reduce((total, item) => total + (item.quantity || 0), 0)

  const isInCart = (itemId, variantId = "") => {
    const safeCart = normalizeCartData(cart)
    const resolvedItemId = resolveCartEntryId(safeCart, itemId, variantId)
    return safeCart.some((i) => i.id === resolvedItemId)
  }

  const getCartItem = (itemId, variantId = "") => {
    const safeCart = normalizeCartData(cart)
    const resolvedItemId = resolveCartEntryId(safeCart, itemId, variantId)
    return safeCart.find((i) => i.id === resolvedItemId) || null
  }

  const clearCart = () => setCart([])

  const replaceCart = useCallback((items) => {
    const normalizedItems = normalizeCartData(items).filter((item) => {
      const quantity = Number(item?.quantity)
      return item?.id && (item?.storeId || item?.store) && Number.isFinite(quantity) && quantity > 0
    })

    setCart(normalizedItems)
    return { ok: true, count: normalizedItems.length }
  }, [])

  // Clean cart to remove items from different stores
  // Keeps only items from the specified store
  const cleanCartForStore = (storeId, storeName) => {
    setCart((prev) => {
      const safePrev = normalizeCartData(prev)
      if (safePrev.length === 0) return safePrev;
      
      // Normalize store name for comparison
      const normalizeName = (name) => name ? name.trim().toLowerCase() : '';
      const targetStoreNameNormalized = normalizeName(storeName);
      
      // Filter cart to keep only items from the target store
      const cleanedCart = safePrev.filter((item) => {
        const itemStoreId = item?.storeId;
        const itemStoreName = item?.store;
        const itemStoreNameNormalized = normalizeName(itemStoreName);
        
        // Check by store name first (more reliable)
        if (targetStoreNameNormalized && itemStoreNameNormalized) {
          return itemStoreNameNormalized === targetStoreNameNormalized;
        }
        // Fallback to ID comparison
        if (storeId && itemStoreId) {
          return itemStoreId === storeId || 
                 itemStoreId === storeId.toString() ||
                 itemStoreId.toString() === storeId;
        }
        // If no match, remove item
        return false;
      });
      
      if (cleanedCart.length !== safePrev.length) {
        debugWarn('🧹 Cleaned cart: Removed items from different stores', {
          before: safePrev.length,
          after: cleanedCart.length,
          removed: safePrev.length - cleanedCart.length
        });
      }
      
      return cleanedCart;
    });
  }

  // Validate and clean cart on mount/load to prevent multiple store items
  // This runs only once on initial load to clean up any corrupted cart data from localStorage
  useEffect(() => {
    const safeCart = normalizeCartData(cart)
    if (safeCart.length !== cart.length) {
      setCart(safeCart)
      return
    }
    if (safeCart.length === 0) return;
    
    // Get unique store IDs and names
    const storeIds = safeCart.map(item => item.storeId).filter(Boolean);
    const storeNames = safeCart.map(item => item.store).filter(Boolean);
    const uniqueStoreIds = [...new Set(storeIds)];
    const uniqueStoreNames = [...new Set(storeNames)];
    
    // Normalize store names for comparison
    const normalizeName = (name) => name ? name.trim().toLowerCase() : '';
    const uniqueStoreNamesNormalized = uniqueStoreNames.map(normalizeName);
    const uniqueStoreNamesSet = new Set(uniqueStoreNamesNormalized);
    
    // Check if cart has items from multiple stores
    if (uniqueStoreIds.length > 1 || uniqueStoreNamesSet.size > 1) {
      debugWarn('⚠️ Cart contains items from multiple stores. Cleaning cart...', {
        storeIds: uniqueStoreIds,
        storeNames: uniqueStoreNames
      });
      
      // Keep items from the first store (most recent or first in cart)
      const firstStoreId = uniqueStoreIds[0];
      const firstStoreName = uniqueStoreNames[0];
      
      setCart((prev) => {
        const safePrev = normalizeCartData(prev)
        const normalizeName = (name) => name ? name.trim().toLowerCase() : '';
        const firstStoreNameNormalized = normalizeName(firstStoreName);
        
        return safePrev.filter((item) => {
          const itemStoreId = item?.storeId;
          const itemStoreName = item?.store;
          const itemStoreNameNormalized = normalizeName(itemStoreName);
          
          // Check by store name first
          if (firstStoreNameNormalized && itemStoreNameNormalized) {
            return itemStoreNameNormalized === firstStoreNameNormalized;
          }
          // Fallback to ID comparison
          if (firstStoreId && itemStoreId) {
            return itemStoreId === firstStoreId || 
                   itemStoreId === firstStoreId.toString() ||
                   itemStoreId.toString() === firstStoreId;
          }
          return false;
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount to clean up localStorage data

  // Transform cart to match AddToCartAnimation expected structure
  const cartForAnimation = useMemo(() => {
    const safeCart = normalizeCartData(cart)
    const items = safeCart.map(item => ({
      product: {
        id: item.id,
        name: item.name,
        imageUrl: item.image || item.imageUrl,
      },
      quantity: item.quantity || 1,
    }))
    
    const itemCount = safeCart.reduce((total, item) => total + (item.quantity || 0), 0)
    const total = safeCart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
    
    return {
      items,
      itemCount,
      total,
    }
  }, [cart])

  const value = useMemo(
    () => ({
      _isProvider: true, // Flag to identify this is from the actual provider
      // Keep original cart array for backward compatibility
      cart,
      // Add animation-compatible structure
      items: cartForAnimation.items,
      itemCount: cartForAnimation.itemCount,
      total: cartForAnimation.total,
      lastAddEvent,
      lastRemoveEvent,
      addToCart,
      removeFromCart,
      updateQuantity,
      getCartCount,
      isInCart,
      getCartItem,
      clearCart,
      cleanCartForStore,
      replaceCart,
    }),
    [cart, cartForAnimation, lastAddEvent, lastRemoveEvent]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  // Check if context is from the actual provider by checking the _isProvider flag
  if (!context || context._isProvider !== true) {
    // In development, log a warning but don't throw to prevent crashes
    if (process.env.NODE_ENV === 'development') {
      debugWarn('⚠️ useCart called outside CartProvider. Using default values.');
      debugWarn('💡 Make sure the component is rendered inside UserLayout which provides CartProvider.');
    }
    // Return default context instead of throwing
    return defaultCartContext
  }
  return context
}

