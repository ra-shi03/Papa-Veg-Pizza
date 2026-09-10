// Product Service Layer
// Mimics a backend API coupled with database collections in-memory.

import { 
  initialProducts, 
  initialVariants, 
  initialStorePricing, 
  initialProductImages 
} from "./mockProducts";

// Read from localStorage if existing, otherwise initialize
let productsDb = JSON.parse(localStorage.getItem("pvp_products_db")) || [...initialProducts];
let variantsDb = JSON.parse(localStorage.getItem("pvp_variants_db")) || [...initialVariants];
let storePricingDb = JSON.parse(localStorage.getItem("pvp_store_pricing_db")) || [...initialStorePricing];
let productImagesDb = JSON.parse(localStorage.getItem("pvp_product_images_db")) || [...initialProductImages];

const persistDb = () => {
  localStorage.setItem("pvp_products_db", JSON.stringify(productsDb));
  localStorage.setItem("pvp_variants_db", JSON.stringify(variantsDb));
  localStorage.setItem("pvp_store_pricing_db", JSON.stringify(storePricingDb));
  localStorage.setItem("pvp_product_images_db", JSON.stringify(productImagesDb));
};

// Pub/Sub for React Query Invalidation
const queryListeners = new Set();

export const subscribeToProductChanges = (listener) => {
  queryListeners.add(listener);
  return () => queryListeners.delete(listener);
};

export const notifyProductChanges = () => {
  queryListeners.forEach((listener) => listener());
};

// Delay simulator helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const productService = {
  // GET /products
  async getProducts(filters = {}) {
    await delay(350); // Simulate network latency

    let result = [...productsDb];

    // Search query (name, sku, categoryName, etc.)
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== "all") {
      result = result.filter((p) => p.categoryId === filters.categoryId);
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      result = result.filter((p) => p.status === filters.status);
    }

    // Veg/Non Veg/Egg type filter
    if (filters.productType && filters.productType !== "all") {
      result = result.filter((p) => p.productType === filters.productType);
    }

    // Sorting
    if (filters.sortBy) {
      const field = filters.sortBy;
      const order = filters.sortOrder === "desc" ? -1 : 1;
      result.sort((a, b) => {
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
      });
    } else {
      // Default sort by displayOrder, then newest
      result.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    // Pagination
    const totalCount = result.length;
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const startIndex = (page - 1) * limit;
    const paginatedItems = result.slice(startIndex, startIndex + limit);

    return {
      products: paginatedItems,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    };
  },

  // GET /products/:id
  async getProductById(id) {
    await delay(200);
    const product = productsDb.find((p) => p._id === id);
    if (!product) throw new Error("Product not found");

    // Fetch corresponding variants, images and store pricings
    const variants = variantsDb.filter((v) => v.productId === id);
    const images = productImagesDb.filter((img) => img.productId === id);
    const pricing = storePricingDb.filter((sp) => sp.productId === id);

    return {
      ...product,
      variants,
      images,
      pricing
    };
  },

  // POST /products
  async createProduct(productData) {
    await delay(500);
    
    const newId = `prod-${Date.now()}`;
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    
    // Auto generate SKU if not provided
    const sku = productData.sku || `PVP-${productData.name.slice(0,4).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;

    const newProduct = {
      _id: newId,
      franchiseId: "FRAN-001",
      categoryId: productData.categoryId,
      name: productData.name,
      slug,
      sku,
      shortDescription: productData.shortDescription || "",
      description: productData.description || "",
      productType: productData.productType || "VEG",
      image: productData.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80&fm=webp",
      galleryImages: productData.galleryImages || [],
      basePrice: Number(productData.basePrice) || 0,
      preparationTime: Number(productData.preparationTime) || 15,
      calories: Number(productData.calories) || 0,
      spiceLevel: Number(productData.spiceLevel) || 1,
      status: productData.status || "ACTIVE",
      isFeatured: !!productData.isFeatured,
      isBestSeller: !!productData.isBestSeller,
      isCustomizable: !!productData.isCustomizable,
      displayOrder: Number(productData.displayOrder) || productsDb.length + 1,
      taxCategory: productData.taxCategory || "gst-5",
      createdBy: "Franchise Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    productsDb.push(newProduct);

    // Save initial images if uploaded
    if (productData.image) {
      productImagesDb.push({
        _id: `img-${Date.now()}-1`,
        productId: newId,
        imageUrl: productData.image,
        type: "THUMBNAIL",
        displayOrder: 1
      });
    }

    if (productData.galleryImages && productData.galleryImages.length > 0) {
      productData.galleryImages.forEach((imgUrl, index) => {
        productImagesDb.push({
          _id: `img-${Date.now()}-gallery-${index}`,
          productId: newId,
          imageUrl: imgUrl,
          type: "GALLERY",
          displayOrder: index + 2
        });
      });
    }

    // Save store pricing mappings if provided
    if (productData.storesAvailability) {
      // productData.storesAvailability = Array of { storeId, available, overridePrice }
      productData.storesAvailability.forEach((sa) => {
        storePricingDb.push({
          _id: `sp-${Date.now()}-${sa.storeId}`,
          storeId: sa.storeId,
          productId: newId,
          price: Number(sa.overridePrice) || newProduct.basePrice,
          status: sa.available ? "ACTIVE" : "INACTIVE"
        });
      });
    }

    persistDb();
    notifyProductChanges();
    return newProduct;
  },

  // PUT /products/:id
  async updateProduct(id, productData) {
    await delay(400);

    const productIndex = productsDb.findIndex((p) => p._id === id);
    if (productIndex === -1) throw new Error("Product not found");

    const oldProduct = productsDb[productIndex];
    const slug = productData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const updatedProduct = {
      ...oldProduct,
      ...productData,
      slug,
      basePrice: Number(productData.basePrice) ?? oldProduct.basePrice,
      preparationTime: Number(productData.preparationTime) ?? oldProduct.preparationTime,
      calories: Number(productData.calories) ?? oldProduct.calories,
      spiceLevel: Number(productData.spiceLevel) ?? oldProduct.spiceLevel,
      displayOrder: Number(productData.displayOrder) ?? oldProduct.displayOrder,
      updatedAt: new Date().toISOString()
    };

    productsDb[productIndex] = updatedProduct;

    // Handle images database update
    productImagesDb = productImagesDb.filter((img) => img.productId !== id);
    if (updatedProduct.image) {
      productImagesDb.push({
        _id: `img-${Date.now()}-1`,
        productId: id,
        imageUrl: updatedProduct.image,
        type: "THUMBNAIL",
        displayOrder: 1
      });
    }
    if (updatedProduct.galleryImages && updatedProduct.galleryImages.length > 0) {
      updatedProduct.galleryImages.forEach((imgUrl, index) => {
        productImagesDb.push({
          _id: `img-${Date.now()}-gallery-${index}`,
          productId: id,
          imageUrl: imgUrl,
          type: "GALLERY",
          displayOrder: index + 2
        });
      });
    }

    // Handle store overrides updates
    if (productData.storesAvailability) {
      storePricingDb = storePricingDb.filter((sp) => sp.productId !== id);
      productData.storesAvailability.forEach((sa) => {
        storePricingDb.push({
          _id: `sp-${Date.now()}-${sa.storeId}`,
          storeId: sa.storeId,
          productId: id,
          price: Number(sa.overridePrice) || updatedProduct.basePrice,
          status: sa.available ? "ACTIVE" : "INACTIVE"
        });
      });
    }

    persistDb();
    notifyProductChanges();
    return updatedProduct;
  },

  // DELETE /products/:id
  async deleteProduct(id) {
    await delay(300);
    const index = productsDb.findIndex((p) => p._id === id);
    if (index === -1) throw new Error("Product not found");

    productsDb.splice(index, 1);
    
    // Cascade delete variants, images and store pricing
    variantsDb = variantsDb.filter((v) => v.productId !== id);
    productImagesDb = productImagesDb.filter((img) => img.productId !== id);
    storePricingDb = storePricingDb.filter((sp) => sp.productId !== id);

    persistDb();
    notifyProductChanges();
    return { success: true };
  },

  // POST /products/bulk
  async bulkAction(productIds, actionType, payload = {}) {
    await delay(500);

    if (actionType === "DELETE") {
      productsDb = productsDb.filter((p) => !productIds.includes(p._id));
      variantsDb = variantsDb.filter((v) => !productIds.includes(v.productId));
      productImagesDb = productImagesDb.filter((img) => !productIds.includes(img.productId));
      storePricingDb = storePricingDb.filter((sp) => !productIds.includes(sp.productId));
    } else {
      productsDb = productsDb.map((product) => {
        if (!productIds.includes(product._id)) return product;

        let updated = { ...product, updatedAt: new Date().toISOString() };

        if (actionType === "CHANGE_CATEGORY") {
          updated.categoryId = payload.categoryId;
        } else if (actionType === "ENABLE") {
          updated.status = "ACTIVE";
        } else if (actionType === "DISABLE") {
          updated.status = "INACTIVE";
        }

        return updated;
      });

      // Special bulk action: ASSIGN_STORES
      if (actionType === "ASSIGN_STORES") {
        const { stores } = payload; // Array of { storeId, available, overridePrice }
        productIds.forEach((prodId) => {
          const product = productsDb.find((p) => p._id === prodId);
          if (!product) return;

          // Clear existing overrides for these stores
          storePricingDb = storePricingDb.filter(
            (sp) => !(sp.productId === prodId && stores.some((s) => s.storeId === sp.storeId))
          );

          // Insert new ones
          stores.forEach((sa) => {
            storePricingDb.push({
              _id: `sp-${Date.now()}-${sa.storeId}-${prodId}`,
              storeId: sa.storeId,
              productId: prodId,
              price: Number(sa.overridePrice) || product.basePrice,
              status: sa.available ? "ACTIVE" : "INACTIVE"
            });
          });
        });
      }
    }

    persistDb();
    notifyProductChanges();
    return { success: true };
  },

  // GET /products/:id/variants
  async getProductVariants(productId) {
    await delay(200);
    return variantsDb.filter((v) => v.productId === productId);
  },

  // POST /variants
  async saveVariant(variantData) {
    await delay(300);

    const isEdit = !!variantData._id;

    if (isEdit) {
      const idx = variantsDb.findIndex((v) => v._id === variantData._id);
      if (idx === -1) throw new Error("Variant not found");
      
      const oldVar = variantsDb[idx];
      const updated = {
        ...oldVar,
        name: variantData.name,
        size: variantData.size,
        price: Number(variantData.price) || 0,
        servingPersons: Number(variantData.servingPersons) || 1,
        calories: Number(variantData.calories) || 0,
        isDefault: !!variantData.isDefault,
        status: variantData.status ? "ACTIVE" : "INACTIVE"
      };

      // If this variant is set to default, unset others for this product
      if (updated.isDefault) {
        variantsDb = variantsDb.map((v) => 
          v.productId === updated.productId ? { ...v, isDefault: false } : v
        );
      }

      variantsDb[idx] = updated;
    } else {
      const newVar = {
        _id: `var-${Date.now()}`,
        productId: variantData.productId,
        name: variantData.name,
        size: variantData.size,
        price: Number(variantData.price) || 0,
        servingPersons: Number(variantData.servingPersons) || 1,
        calories: Number(variantData.calories) || 0,
        isDefault: !!variantData.isDefault,
        status: variantData.status ? "ACTIVE" : "INACTIVE"
      };

      if (newVar.isDefault) {
        variantsDb = variantsDb.map((v) => 
          v.productId === newVar.productId ? { ...v, isDefault: false } : v
        );
      }

      variantsDb.push(newVar);
    }

    persistDb();
    notifyProductChanges();
    return { success: true };
  },

  // DELETE /variants/:id
  async deleteVariant(id) {
    await delay(200);
    variantsDb = variantsDb.filter((v) => v._id !== id);
    persistDb();
    notifyProductChanges();
    return { success: true };
  }
};
