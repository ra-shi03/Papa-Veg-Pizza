import {
  mockAddons,
  mockAddonGroups,
  mockInventoryItems,
  mockProductAddonAssignments,
  initialProducts,
  mockCategories
} from "./mockProducts";

const ADDONS_STORAGE_KEY = "mock_db_addons";
const GROUPS_STORAGE_KEY = "mock_db_addon_groups";
const ASSIGNMENTS_STORAGE_KEY = "mock_db_addon_assignments";
const INVENTORY_STORAGE_KEY = "mock_db_inventory";

// In-memory data variables
let addons = [];
let addonGroups = [];
let assignments = [];
let inventoryItems = [];

// Initialize databases from localStorage
try {
  const cachedAddons = localStorage.getItem(ADDONS_STORAGE_KEY);
  addons = cachedAddons ? JSON.parse(cachedAddons) : [...mockAddons];
  if (!cachedAddons) localStorage.setItem(ADDONS_STORAGE_KEY, JSON.stringify(addons));

  const cachedGroups = localStorage.getItem(GROUPS_STORAGE_KEY);
  addonGroups = cachedGroups ? JSON.parse(cachedGroups) : [...mockAddonGroups];
  if (!cachedGroups) localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(addonGroups));

  const cachedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
  assignments = cachedAssignments ? JSON.parse(cachedAssignments) : [...mockProductAddonAssignments];
  if (!cachedAssignments) localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));

  const cachedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
  inventoryItems = cachedInventory ? JSON.parse(cachedInventory) : [...mockInventoryItems];
  if (!cachedInventory) localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryItems));
} catch (e) {
  addons = [...mockAddons];
  addonGroups = [...mockAddonGroups];
  assignments = [...mockProductAddonAssignments];
  inventoryItems = [...mockInventoryItems];
}

const saveToStorage = () => {
  try {
    localStorage.setItem(ADDONS_STORAGE_KEY, JSON.stringify(addons));
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(addonGroups));
    localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventoryItems));
  } catch (err) {
    console.error("Failed to persist addons database", err);
  }
};

// Pub-sub systems for react-query updates
const addonListeners = new Set();
export function subscribeToAddonChanges(callback) {
  addonListeners.add(callback);
  return () => addonListeners.delete(callback);
}
function notifyAddonListeners() {
  addonListeners.forEach((cb) => cb());
}

const groupListeners = new Set();
export function subscribeToGroupChanges(callback) {
  groupListeners.add(callback);
  return () => groupListeners.delete(callback);
}
function notifyGroupListeners() {
  groupListeners.forEach((cb) => cb());
}

export const addonService = {
  // GET all inventory items (reusable dropdown mapping)
  getInventoryItems: async () => {
    return { success: true, data: inventoryItems };
  },

  // GET /addons
  getAddons: async (params = {}) => {
    // Artificial latency for skeletons
    await new Promise((resolve) => setTimeout(resolve, 380));

    const {
      search = "",
      status = "",
      type = "",
      groupId = "",
      inventoryItemId = "",
      page = 1,
      limit = 10,
      sortBy = "name",
      sortOrder = "asc"
    } = params;

    let filtered = [...addons];

    // Filter by search query
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (a) => a.name.toLowerCase().includes(q) || (a.description && a.description.toLowerCase().includes(q))
      );
    }

    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((a) => a.status === status);
    }

    // Filter by type
    if (type && type !== "all") {
      filtered = filtered.filter((a) => a.type === type);
    }

    // Filter by group
    if (groupId && groupId !== "all") {
      const group = addonGroups.find((g) => g._id === groupId);
      if (group) {
        filtered = filtered.filter((a) => group.addonIds.includes(a._id));
      } else {
        filtered = [];
      }
    }

    // Filter by inventory mapping status
    if (inventoryItemId && inventoryItemId !== "all") {
      if (inventoryItemId === "MAPPED") {
        filtered = filtered.filter((a) => !!a.inventoryItemId);
      } else if (inventoryItemId === "UNMAPPED") {
        filtered = filtered.filter((a) => !a.inventoryItemId);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Map relationships (groups, inventory details)
    const mapped = filtered.map((a) => {
      const inv = inventoryItems.find((i) => i._id === a.inventoryItemId);
      
      // Dynamic stock status calculation
      let stockStatus = "IN STOCK";
      let currentStock = null;
      if (inv) {
        currentStock = inv.currentStock;
        if (inv.currentStock === 0) {
          stockStatus = "OUT OF STOCK";
        } else if (inv.currentStock <= inv.lowStockWarning) {
          stockStatus = "LOW STOCK";
        }
      }

      // Find groups that contain this addon
      const matchedGroups = addonGroups
        .filter((g) => g.addonIds.includes(a._id))
        .map((g) => g.name);

      // Find total assigned products count
      const assignedCount = assignments.filter((asg) => asg.addonIds.includes(a._id)).length;

      return {
        ...a,
        groupNames: matchedGroups,
        inventoryItemName: inv ? inv.name : "Unmapped",
        stockStatus,
        currentStock,
        assignedCount
      };
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedAddons = mapped.slice(startIndex, startIndex + Number(limit));

    return {
      success: true,
      addons: paginatedAddons,
      totalCount: filtered.length
    };
  },

  // GET /addons/:id (Details drawer)
  getAddonDetails: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 250));

    const addon = addons.find((a) => a._id === id);
    if (!addon) throw new Error("Add-on not found");

    // Fetch mapped inventory details
    const inventory = inventoryItems.find((inv) => inv._id === addon.inventoryItemId);

    // Fetch associated groups
    const associatedGroups = addonGroups
      .filter((g) => g.addonIds.includes(addon._id))
      .map((g) => ({
        _id: g._id,
        name: g.name,
        selectionType: g.selectionType,
        minSelection: g.minSelection,
        maxSelection: g.maxSelection,
        isRequired: g.isRequired
      }));

    // Fetch assigned products details
    const assignedProducts = assignments
      .filter((asg) => asg.addonIds.includes(addon._id))
      .map((asg) => {
        const prod = initialProducts.find((p) => p._id === asg.productId);
        const cat = prod ? mockCategories.find((c) => c._id === prod.categoryId) : null;
        return prod ? {
          _id: prod._id,
          name: prod.name,
          image: prod.image,
          category: cat ? cat.name : "General",
          assignedDate: asg.createdAt
        } : null;
      })
      .filter(Boolean);

    return {
      success: true,
      data: {
        ...addon,
        inventory,
        groups: associatedGroups,
        assignedProducts
      }
    };
  },

  // POST /addons
  createAddon: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newAddon = {
      _id: `add-${Date.now()}`,
      franchiseId: "FRAN-001",
      name: data.name,
      type: data.type,
      image: data.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
      description: data.description || "",
      price: Number(data.price),
      inventoryItemId: data.inventoryItemId || null,
      status: data.status || "ACTIVE",
      createdAt: new Date().toISOString()
    };

    addons.push(newAddon);
    saveToStorage();
    notifyAddonListeners();

    return { success: true, data: newAddon };
  },

  // PUT /addons/:id
  updateAddon: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = addons.findIndex((a) => a._id === id);
    if (index === -1) throw new Error("Add-on not found");

    addons[index] = {
      ...addons[index],
      name: data.name,
      type: data.type,
      image: data.image || addons[index].image,
      description: data.description ?? addons[index].description,
      price: Number(data.price),
      inventoryItemId: data.inventoryItemId || null,
      status: data.status || addons[index].status
    };

    saveToStorage();
    notifyAddonListeners();

    return { success: true, data: addons[index] };
  },

  // DELETE /addons/:id
  deleteAddon: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 250));

    addons = addons.filter((a) => a._id !== id);

    // Cascade: Remove addon ID from groups
    addonGroups = addonGroups.map((group) => ({
      ...group,
      addonIds: group.addonIds.filter((aid) => aid !== id)
    }));

    // Cascade: Remove addon ID from product assignments
    assignments = assignments.map((asg) => ({
      ...asg,
      addonIds: asg.addonIds.filter((aid) => aid !== id)
    }));

    saveToStorage();
    notifyAddonListeners();
    notifyGroupListeners();

    return { success: true, message: "Add-on deleted successfully" };
  },

  // GET /addon-groups
  getAddonGroups: async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: addonGroups };
  },

  // POST /addon-groups
  createAddonGroup: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const newGroup = {
      _id: `grp-${Date.now()}`,
      franchiseId: "FRAN-001",
      name: data.name,
      selectionType: data.selectionType || "SINGLE",
      minSelection: Number(data.minSelection ?? 0),
      maxSelection: Number(data.maxSelection ?? 1),
      isRequired: Boolean(data.isRequired),
      addonIds: data.addonIds || []
    };

    addonGroups.push(newGroup);
    saveToStorage();
    notifyGroupListeners();

    return { success: true, data: newGroup };
  },

  // GET products assignment mapping
  getAssignedProducts: async (addonId) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = initialProducts.map((p) => {
      const isAssigned = assignments.some((asg) => asg.productId === p._id && asg.addonIds.includes(addonId));
      const cat = mockCategories.find((c) => c._id === p.categoryId);
      const currentAddonsList = assignments.find((asg) => asg.productId === p._id)?.addonIds || [];
      const currentAddonsNames = addons.filter((a) => currentAddonsList.includes(a._id)).map((a) => a.name);

      return {
        _id: p._id,
        name: p.name,
        image: p.image,
        category: cat ? cat.name : "Uncategorized",
        categoryId: p.categoryId,
        isAssigned,
        currentAddons: currentAddonsNames,
        status: p.status
      };
    });

    return { success: true, data: result };
  },

  // ASSIGN products to addon
  assignProductsToAddon: async (addonId, productIds) => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    // Clear existing assignments for this addonId in the specified list (or all if modifying)
    // and re-apply assignments.
    // For each productId in the catalog:
    initialProducts.forEach((p) => {
      const isSelected = productIds.includes(p._id);
      let asgIndex = assignments.findIndex((asg) => asg.productId === p._id);

      if (asgIndex === -1) {
        // Create new assignment entry
        if (isSelected) {
          assignments.push({
            _id: `asgn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            productId: p._id,
            addonIds: [addonId],
            createdAt: new Date().toISOString()
          });
        }
      } else {
        // Modify existing assignment entry
        const hasAddon = assignments[asgIndex].addonIds.includes(addonId);
        if (isSelected && !hasAddon) {
          assignments[asgIndex].addonIds.push(addonId);
        } else if (!isSelected && hasAddon) {
          assignments[asgIndex].addonIds = assignments[asgIndex].addonIds.filter((aid) => aid !== addonId);
        }
      }
    });

    saveToStorage();
    notifyAddonListeners();

    return { success: true, message: "Products assigned successfully!" };
  },

  // BULK Actions
  bulkAddonActions: async (ids, action, payload = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("No add-on IDs specified");
    }

    if (action === "DELETE") {
      addons = addons.filter((a) => !ids.includes(a._id));
      
      // Cascade removes
      addonGroups = addonGroups.map((g) => ({
        ...g,
        addonIds: g.addonIds.filter((aid) => !ids.includes(aid))
      }));
      assignments = assignments.map((asg) => ({
        ...asg,
        addonIds: asg.addonIds.filter((aid) => !ids.includes(aid))
      }));
    } else if (action === "ENABLE") {
      addons = addons.map((a) => ids.includes(a._id) ? { ...a, status: "ACTIVE" } : a);
    } else if (action === "DISABLE") {
      addons = addons.map((a) => ids.includes(a._id) ? { ...a, status: "INACTIVE" } : a);
    } else if (action === "ASSIGN_GROUP") {
      const { groupId } = payload;
      if (!groupId) throw new Error("No target Group ID specified");
      addonGroups = addonGroups.map((g) => {
        if (g._id === groupId) {
          // Merge unique add-on IDs
          const merged = Array.from(new Set([...g.addonIds, ...ids]));
          return { ...g, addonIds: merged };
        }
        return g;
      });
    }

    saveToStorage();
    notifyAddonListeners();
    notifyGroupListeners();

    return { success: true, message: "Bulk operation executed successfully" };
  }
};
