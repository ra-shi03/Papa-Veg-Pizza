// Store Pricing Service Layer
// Persists and retrieves data from LocalStorage for store_products and product_price_history collections.

import { initialStores } from "../../storeManagement/mockStoresData.js";
import { mockCategories, initialProducts, initialStoreProducts, initialPriceHistory } from "../mockProducts.js";

// Load from LocalStorage or seed defaults
let storeProductsDb = JSON.parse(localStorage.getItem("pvp_store_products_db"));
let priceHistoryDb = JSON.parse(localStorage.getItem("pvp_price_history_db")) || [...initialPriceHistory];

const getProducts = () => {
  return JSON.parse(localStorage.getItem("pvp_products_db")) || [...initialProducts];
};

const getStores = () => {
  return JSON.parse(localStorage.getItem("mock_db_stores")) || [...initialStores];
};

// Initialize DB with seed data and default overrides
if (!storeProductsDb) {
  storeProductsDb = [...initialStoreProducts];
  
  const activeStores = getStores().filter(s => s.status === "Active" || s.status === "Closed");
  const products = getProducts();
  
  activeStores.forEach((store) => {
    products.forEach((prod) => {
      const exists = storeProductsDb.some(
        (sp) => sp.storeId === store._id && sp.productId === prod._id
      );
      if (!exists) {
        const base = prod.basePrice || 249;
        storeProductsDb.push({
          _id: `sp-${store._id}-${prod._id}`,
          storeId: store._id,
          productId: prod._id,
          smallPrice: Math.round(base * 0.6),
          mediumPrice: base,
          largePrice: Math.round(base * 1.6),
          deliveryPrice: Math.round(base * 1.1),
          takeawayPrice: Math.round(base * 0.95),
          dineInPrice: base,
          specialPrice: 0,
          startDate: "",
          endDate: "",
          availability: "AVAILABLE",
          status: "ACTIVE",
          updatedBy: "System Default",
          updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    });
  });
  localStorage.setItem("pvp_store_products_db", JSON.stringify(storeProductsDb));
}

const persistDb = () => {
  localStorage.setItem("pvp_store_products_db", JSON.stringify(storeProductsDb));
  localStorage.setItem("pvp_price_history_db", JSON.stringify(priceHistoryDb));
};

// Pub/Sub for React Query Invalidation
const queryListeners = new Set();

export const subscribeToPricingChanges = (listener) => {
  queryListeners.add(listener);
  return () => queryListeners.delete(listener);
};

export const notifyPricingChanges = () => {
  queryListeners.forEach((listener) => listener());
};

export const storePricingService = {
  // GET /store-pricing
  getStorePricing(filters = {}) {
    const stores = getStores();
    const products = getProducts();

    // Map each store product override to store/product details
    let result = storeProductsDb.map((sp) => {
      const storeObj = stores.find((s) => s._id === sp.storeId);
      const productObj = products.find((p) => p._id === sp.productId);
      const categoryObj = productObj ? mockCategories.find((c) => c._id === productObj.categoryId) : null;

      return {
        ...sp,
        storeName: storeObj ? storeObj.storeName : "Unknown Store",
        storeCode: storeObj ? storeObj.storeCode : "N/A",
        productName: productObj ? productObj.name : "Unknown Product",
        productSku: productObj ? productObj.sku : "N/A",
        productImage: productObj ? productObj.image : "",
        categoryName: categoryObj ? categoryObj.name : "Uncategorized",
        categoryId: productObj ? productObj.categoryId : ""
      };
    });

    // 1. Search Query (matches product name, SKU, or store name)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (sp) =>
          sp.productName.toLowerCase().includes(q) ||
          sp.productSku.toLowerCase().includes(q) ||
          sp.storeName.toLowerCase().includes(q) ||
          sp.storeCode.toLowerCase().includes(q)
      );
    }

    // 2. Store Filter
    if (filters.storeId && filters.storeId !== "all") {
      result = result.filter((sp) => sp.storeId === filters.storeId);
    }

    // 3. Category Filter
    if (filters.categoryId && filters.categoryId !== "all") {
      result = result.filter((sp) => sp.categoryId === filters.categoryId);
    }

    // 4. Product Type Filter
    if (filters.productType && filters.productType !== "all") {
      const prodsOfType = products.filter((p) => p.productType === filters.productType).map((p) => p._id);
      result = result.filter((sp) => prodsOfType.includes(sp.productId));
    }

    // 5. Availability Filter
    if (filters.availability && filters.availability !== "all") {
      result = result.filter((sp) => sp.availability === filters.availability);
    }

    // 6. Status Filter
    if (filters.status && filters.status !== "all") {
      result = result.filter((sp) => sp.status === filters.status);
    }

    // Sorting
    if (filters.sortBy) {
      const field = filters.sortBy;
      const order = filters.sortOrder === "desc" ? -1 : 1;
      result.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (typeof valA === "string") {
          return order * valA.localeCompare(valB);
        }
        return order * ((valA || 0) - (valB || 0));
      });
    } else {
      // Default: Store Name ASC, Product Name ASC
      result.sort((a, b) => {
        const storeComp = a.storeName.localeCompare(b.storeName);
        if (storeComp !== 0) return storeComp;
        return a.productName.localeCompare(b.productName);
      });
    }

    // Stats calculations
    const stats = {
      totalStoresCount: new Set(storeProductsDb.map((sp) => sp.storeId)).size,
      totalProductsCount: new Set(storeProductsDb.map((sp) => sp.productId)).size,
      customPricingCount: storeProductsDb.filter((sp) => {
        const prod = products.find((p) => p._id === sp.productId);
        if (!prod) return false;
        return sp.mediumPrice !== prod.basePrice;
      }).length,
      promotionalPricingCount: storeProductsDb.filter((sp) => sp.availability === "PROMOTION ACTIVE").length,
      unavailableProductsCount: storeProductsDb.filter((sp) => sp.availability === "UNAVAILABLE").length
    };

    // Pagination
    const totalCount = result.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = result.slice(startIndex, startIndex + limit);

    return {
      pricing: paginatedItems,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats
    };
  },

  // GET /store-pricing/:id
  getStorePricingById(id) {
    const item = storeProductsDb.find((sp) => sp._id === id);
    if (!item) throw new Error("Pricing override record not found");

    const store = getStores().find((s) => s._id === item.storeId);
    const product = getProducts().find((p) => p._id === item.productId);

    return {
      ...item,
      store,
      product
    };
  },

  // PUT /store-pricing/:id
  updateStorePricing(id, data) {
    const index = storeProductsDb.findIndex((sp) => sp._id === id);
    if (index === -1) throw new Error("Pricing override record not found");

    const oldRecord = storeProductsDb[index];
    const newRecord = {
      ...oldRecord,
      ...data,
      updatedBy: "Franchise Admin",
      updatedAt: new Date().toISOString()
    };

    const priceKeys = ["smallPrice", "mediumPrice", "largePrice", "deliveryPrice", "takeawayPrice", "dineInPrice", "specialPrice"];
    let changed = false;
    const oldPrices = {};
    const newPrices = {};

    priceKeys.forEach((key) => {
      if (oldRecord[key] !== newRecord[key]) {
        changed = true;
      }
      oldPrices[key] = oldRecord[key];
      newPrices[key] = newRecord[key];
    });

    if (changed) {
      priceHistoryDb.unshift({
        _id: `ph-${Date.now()}`,
        storeId: oldRecord.storeId,
        productId: oldRecord.productId,
        oldPrice: oldPrices,
        newPrice: newPrices,
        changedBy: "Franchise Admin",
        reason: data.reason || "Manual Override Update",
        createdAt: new Date().toISOString()
      });
    }

    storeProductsDb[index] = newRecord;
    persistDb();
    notifyPricingChanges();

    return newRecord;
  },

  // POST /bulk-price-update
  bulkPriceUpdate(payload) {
    const { categoryId, increaseType, value, applyTo, selectedStoreIds, selectedProductIds } = payload;
    const updateVal = Number(value);
    
    if (isNaN(updateVal) || updateVal < 0) throw new Error("Invalid update value");

    const products = getProducts();
    let targetProductIds = selectedProductIds || [];
    
    if (categoryId && categoryId !== "all" && targetProductIds.length === 0) {
      targetProductIds = products.filter(p => p.categoryId === categoryId).map(p => p._id);
    } else if (targetProductIds.length === 0) {
      targetProductIds = products.map(p => p._id);
    }

    let targetStoreIds = selectedStoreIds || [];
    if (applyTo === "ALL_STORES") {
      targetStoreIds = getStores().map(s => s._id);
    }

    let affectedCount = 0;

    storeProductsDb = storeProductsDb.map((sp) => {
      if (!targetStoreIds.includes(sp.storeId) || !targetProductIds.includes(sp.productId)) {
        return sp;
      }

      affectedCount++;
      const oldPrices = {
        smallPrice: sp.smallPrice,
        mediumPrice: sp.mediumPrice,
        largePrice: sp.largePrice
      };

      const calculateNewPrice = (oldPrice) => {
        if (increaseType === "PERCENTAGE") {
          return Math.round(oldPrice * (1 + updateVal / 100));
        }
        return oldPrice + updateVal;
      };

      const newRecord = {
        ...sp,
        smallPrice: calculateNewPrice(sp.smallPrice),
        mediumPrice: calculateNewPrice(sp.mediumPrice),
        largePrice: calculateNewPrice(sp.largePrice),
        deliveryPrice: calculateNewPrice(sp.deliveryPrice),
        takeawayPrice: calculateNewPrice(sp.takeawayPrice),
        dineInPrice: calculateNewPrice(sp.dineInPrice),
        updatedBy: "Franchise Admin (Bulk)",
        updatedAt: new Date().toISOString()
      };

      priceHistoryDb.unshift({
        _id: `ph-bulk-${Date.now()}-${sp._id}`,
        storeId: sp.storeId,
        productId: sp.productId,
        oldPrice: oldPrices,
        newPrice: {
          smallPrice: newRecord.smallPrice,
          mediumPrice: newRecord.mediumPrice,
          largePrice: newRecord.largePrice
        },
        changedBy: "Franchise Admin (Bulk)",
        reason: `Bulk Update: +${value}${increaseType === "PERCENTAGE" ? "%" : " ₹"}`,
        createdAt: new Date().toISOString()
      });

      return newRecord;
    });

    persistDb();
    notifyPricingChanges();
    return { success: true, affectedCount };
  },

  // POST /copy-pricing
  copyPricing(payload) {
    const { sourceStoreId, destinationStoreIds, selectedProductIds, copyAllProducts } = payload;

    if (!sourceStoreId) throw new Error("Source store is required");
    if (!destinationStoreIds || destinationStoreIds.length === 0) throw new Error("Select at least one destination store");

    const sourcePricing = storeProductsDb.filter((sp) => sp.storeId === sourceStoreId);
    let affectedProductsCount = 0;

    destinationStoreIds.forEach((destStoreId) => {
      sourcePricing.forEach((srcSp) => {
        if (!copyAllProducts && selectedProductIds && !selectedProductIds.includes(srcSp.productId)) {
          return;
        }

        affectedProductsCount++;
        const destIndex = storeProductsDb.findIndex(
          (sp) => sp.storeId === destStoreId && sp.productId === srcSp.productId
        );

        const newOverride = {
          smallPrice: srcSp.smallPrice,
          mediumPrice: srcSp.mediumPrice,
          largePrice: srcSp.largePrice,
          deliveryPrice: srcSp.deliveryPrice,
          takeawayPrice: srcSp.takeawayPrice,
          dineInPrice: srcSp.dineInPrice,
          specialPrice: srcSp.specialPrice,
          startDate: srcSp.startDate,
          endDate: srcSp.endDate,
          availability: srcSp.availability,
          status: srcSp.status,
          updatedBy: "Franchise Admin (Copied)",
          updatedAt: new Date().toISOString()
        };

        if (destIndex !== -1) {
          const oldRecord = storeProductsDb[destIndex];
          priceHistoryDb.unshift({
            _id: `ph-copy-${Date.now()}-${destStoreId}-${srcSp.productId}`,
            storeId: destStoreId,
            productId: srcSp.productId,
            oldPrice: { smallPrice: oldRecord.smallPrice, mediumPrice: oldRecord.mediumPrice, largePrice: oldRecord.largePrice },
            newPrice: { smallPrice: newOverride.smallPrice, mediumPrice: newOverride.mediumPrice, largePrice: newOverride.largePrice },
            changedBy: "Franchise Admin (Copied)",
            reason: `Copied from Store: ${sourceStoreId}`,
            createdAt: new Date().toISOString()
          });

          storeProductsDb[destIndex] = {
            ...oldRecord,
            ...newOverride
          };
        } else {
          storeProductsDb.push({
            _id: `sp-${destStoreId}-${srcSp.productId}`,
            storeId: destStoreId,
            productId: srcSp.productId,
            ...newOverride
          });
        }
      });
    });

    persistDb();
    notifyPricingChanges();
    return { success: true, affectedStoresCount: destinationStoreIds.length, affectedProductsCount };
  },

  // GET /price-history/:productId
  getPriceHistory(productId, filters = {}) {
    let result = priceHistoryDb.filter((ph) => ph.productId === productId);

    if (filters.storeId && filters.storeId !== "all") {
      result = result.filter((ph) => ph.storeId === filters.storeId);
    }

    const stores = getStores();
    const products = getProducts();

    const mapped = result.map((ph) => {
      const storeObj = stores.find((s) => s._id === ph.storeId);
      const productObj = products.find((p) => p._id === ph.productId);

      return {
        ...ph,
        storeName: storeObj ? storeObj.storeName : "Unknown Store",
        productName: productObj ? productObj.name : "Unknown Product"
      };
    });

    const totalCount = mapped.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const startIndex = (page - 1) * limit;
    const paginated = mapped.slice(startIndex, startIndex + limit);

    return {
      history: paginated,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  // PUT /store-pricing/bulk-action
  applyBulkAction(pricingIds, action, payload = {}) {
    storeProductsDb = storeProductsDb.map((sp) => {
      if (!pricingIds.includes(sp._id)) return sp;

      const updated = {
        ...sp,
        updatedBy: "Franchise Admin (Bulk Action)",
        updatedAt: new Date().toISOString()
      };

      if (action === "ENABLE") {
        updated.status = "ACTIVE";
      } else if (action === "DISABLE") {
        updated.status = "INACTIVE";
      } else if (action === "MARK_UNAVAILABLE") {
        updated.availability = "UNAVAILABLE";
      } else if (action === "ACTIVATE_PROMOTION") {
        updated.availability = "PROMOTION ACTIVE";
        updated.startDate = payload.startDate || new Date().toISOString().split("T")[0];
        updated.endDate = payload.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      } else if (action === "DELETE_RULES") {
        const prod = getProducts().find((p) => p._id === sp.productId);
        if (prod) {
          const base = prod.basePrice || 249;
          updated.smallPrice = Math.round(base * 0.6);
          updated.mediumPrice = base;
          updated.largePrice = Math.round(base * 1.6);
          updated.deliveryPrice = Math.round(base * 1.1);
          updated.takeawayPrice = Math.round(base * 0.95);
          updated.dineInPrice = base;
          updated.specialPrice = 0;
          updated.startDate = "";
          updated.endDate = "";
          updated.availability = "AVAILABLE";
          updated.status = "ACTIVE";
        }
      }

      return updated;
    });

    persistDb();
    notifyPricingChanges();
    return { success: true };
  }
};
