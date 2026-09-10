import { mockCategories, initialProducts } from "./mockProducts";

// Local storage key for persistent categories db
const STORAGE_KEY = "mock_db_categories";

// Initialize in-memory categories
let categories = [];
try {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    categories = JSON.parse(cached).map((c) => ({
      ...c,
      _id: c._id || c.id || `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      id: c.id || c._id
    }));
    // Save migrated data back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } else {
    categories = [...mockCategories];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }
} catch (_) {
  categories = [...mockCategories];
}

const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (e) {
    console.error("Failed to persist categories database", e);
  }
};

// Pub-sub system for React Query cache invalidations
const listeners = new Set();
export function subscribeToCategoryChanges(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  listeners.forEach((cb) => cb());
}

export const categoryService = {
  // GET /categories
  getCategories: async (params = {}) => {
    // Artificial latency for loading skeletons
    await new Promise((resolve) => setTimeout(resolve, 380));

    const { search = "", status = "", isFeatured = "", parentCategory = "", sortBy = "displayOrder", sortOrder = "asc" } = params;

    let filtered = [...categories];

    // Search
    if (search) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Filters
    if (status) {
      filtered = filtered.filter((c) => c.status === status);
    }

    if (isFeatured !== "") {
      const featuredBool = isFeatured === "true" || isFeatured === true;
      filtered = filtered.filter((c) => c.isFeatured === featuredBool);
    }

    if (parentCategory) {
      if (parentCategory === "none") {
        filtered = filtered.filter((c) => !c.parentCategory);
      } else {
        filtered = filtered.filter((c) => c.parentCategory === parentCategory);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Map stats (products count) dynamically
    const mapped = filtered.map((c) => {
      const cid = c._id || c.id;
      const productsCount = initialProducts.filter((p) => p.categoryId === cid).length;
      return {
        ...c,
        productsCount
      };
    });

    return {
      success: true,
      data: mapped
    };
  },

  // GET /categories/:id
  getCategoryDetails: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const category = categories.find((c) => c._id === id || c.id === id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Get statistics
    const products = initialProducts.filter((p) => p.categoryId === id);
    const subcategories = categories.filter((c) => c.parentCategory === id);

    // Calculate revenue & selling statistics dynamically (simulated)
    const simulatedStats = {
      productsCount: products.length,
      subcategoriesCount: subcategories.length,
      revenueGenerated: products.reduce((sum, p) => sum + (p.basePrice * (p.isBestSeller ? 120 : 35)), 0),
      topProducts: products.slice(0, 3).map((p) => ({
        _id: p._id,
        name: p.name,
        image: p.image,
        salesCount: p.isBestSeller ? 120 : 35,
        revenue: p.basePrice * (p.isBestSeller ? 120 : 35)
      })),
      storeAvailability: [
        { storeId: "ST-001", storeName: "Connaught Place Outlet", products: products.length, revenue: products.length * 350, available: true },
        { storeId: "ST-002", storeName: "Indiranagar Outlet", products: products.length, revenue: products.length * 310, available: true },
        { storeId: "ST-003", storeName: "Salt Lake Outlet", products: products.length, revenue: 0, available: false }
      ]
    };

    return {
      success: true,
      data: {
        ...category,
        stats: simulatedStats
      }
    };
  },

  // POST /categories
  createCategory: async (data) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const newCategory = {
      _id: `cat-${Date.now()}`,
      franchiseId: "FRAN-001",
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: data.description || "",
      image: data.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
      icon: data.icon || "Grid",
      parentCategory: data.parentCategory || null,
      displayOrder: Number(data.displayOrder || 1),
      isFeatured: Boolean(data.isFeatured),
      status: data.status || "ACTIVE",
      createdAt: new Date().toISOString()
    };

    // Duplicate slug check
    if (categories.some((c) => c.slug === newCategory.slug)) {
      throw new Error(`Category with slug "${newCategory.slug}" already exists`);
    }

    // Keep id property for backward compatibility
    newCategory.id = newCategory._id;

    categories.push(newCategory);
    saveToStorage();
    notifyListeners();

    return {
      success: true,
      data: newCategory
    };
  },

  // PUT /categories/:id
  updateCategory: async (id, data) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const idx = categories.findIndex((c) => c._id === id || c.id === id);
    if (idx === -1) {
      throw new Error("Category not found");
    }

    const updated = {
      ...categories[idx],
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: data.description || "",
      image: data.image || categories[idx].image,
      icon: data.icon || categories[idx].icon,
      parentCategory: data.parentCategory || null,
      displayOrder: Number(data.displayOrder || 1),
      isFeatured: Boolean(data.isFeatured),
      status: data.status || "ACTIVE"
    };

    categories[idx] = updated;
    saveToStorage();
    notifyListeners();

    return {
      success: true,
      data: updated
    };
  },

  // DELETE /categories/:id
  deleteCategory: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    const exists = categories.some((c) => c._id === id || c.id === id);
    if (!exists) {
      throw new Error("Category not found");
    }

    categories = categories.filter((c) => c._id !== id);
    saveToStorage();
    notifyListeners();

    return {
      success: true,
      message: "Category deleted successfully"
    };
  },

  // Bulk actions
  bulkCategoryActions: async (ids, action, payload = {}) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("No category IDs specified");
    }

    if (action === "DELETE") {
      categories = categories.filter((c) => !ids.includes(c._id) && !ids.includes(c.id));
    } else {
      categories = categories.map((c) => {
        if (!ids.includes(c._id) && !ids.includes(c.id)) return c;
        switch (action) {
          case "ENABLE":
            return { ...c, status: "ACTIVE" };
          case "DISABLE":
            return { ...c, status: "INACTIVE" };
          case "MARK_FEATURED":
            return { ...c, isFeatured: true };
          case "REMOVE_FEATURED":
            return { ...c, isFeatured: false };
          default:
            return c;
        }
      });
    }

    saveToStorage();
    notifyListeners();

    return {
      success: true,
      message: `Bulk operation ${action} executed successfully`
    };
  }
};
