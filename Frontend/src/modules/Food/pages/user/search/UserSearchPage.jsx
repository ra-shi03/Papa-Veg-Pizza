import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuSearchOverlay from '@food/components/user/MenuSearchOverlay';
import ProductCustomizeModal from '@food/components/user/ProductCustomizeModal';
import apiClient from '@/services/api/axios';

export default function UserSearchPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProductForCustomize, setSelectedProductForCustomize] = useState(null);
  const [isDarkMode] = useState(() => {
    return localStorage.getItem('appTheme') === 'dark';
  });

  // Load products, categories, and addons
  useEffect(() => {
    // 1. Instant fallback from localStorage
    try {
      const storedProds = localStorage.getItem('pvp_products_v2');
      if (storedProds) {
        const parsed = JSON.parse(storedProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed.filter(p => p.status === 'Active' || !p.status));
        }
      }
    } catch (_) {}

    try {
      const storedCats = localStorage.getItem('pvp_categories');
      if (storedCats) {
        const parsed = JSON.parse(storedCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCategories(parsed.filter(c => c.status !== 'Inactive'));
        }
      }
    } catch (_) {}

    try {
      const storedAddons = localStorage.getItem('pvp_addons');
      if (storedAddons) {
        const parsed = JSON.parse(storedAddons);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAddons(parsed);
        }
      }
    } catch (_) {}

    // 2. Fetch fresh data from backend
    const fetchFreshData = async () => {
      try {
        const prodRes = await apiClient.get('/food/admin/products/public');
        const prodList = prodRes?.data?.data?.products || prodRes?.data?.data || [];
        if (Array.isArray(prodList) && prodList.length > 0) {
          const activeProds = prodList.filter(p => p.status === 'Active' || !p.status);
          setProducts(activeProds);
          localStorage.setItem('pvp_products_v2', JSON.stringify(activeProds));
        }
      } catch (_) {}

      try {
        const catRes = await apiClient.get('/food/admin/categories');
        const catList = catRes?.data?.data?.categories || catRes?.data?.data || [];
        if (Array.isArray(catList) && catList.length > 0) {
          setCategories(catList.filter(c => c.status !== 'Inactive'));
          localStorage.setItem('pvp_categories', JSON.stringify(catList));
        }
      } catch (_) {}

      try {
        const addonRes = await apiClient.get('/food/admin/addons/public');
        const addonList = addonRes?.data?.data?.addons || addonRes?.data?.data || [];
        if (Array.isArray(addonList) && addonList.length > 0) {
          setAddons(addonList);
          localStorage.setItem('pvp_addons', JSON.stringify(addonList));
        }
      } catch (_) {}
    };

    fetchFreshData();
  }, []);

  // Handle Add to Cart
  const handleAddToCart = (product) => {
    if (product.sizes && product.sizes.length > 1) {
      setSelectedProductForCustomize(product);
      return;
    }

    try {
      const key = String(product.id || product._id);
      const stored = JSON.parse(localStorage.getItem('userCart') || '{}');
      const currentQty = typeof stored[key] === 'object' && stored[key] !== null 
        ? (stored[key].quantity || 1) 
        : Number(stored[key] || 0);
      stored[key] = currentQty + 1;
      localStorage.setItem('userCart', JSON.stringify(stored));
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (_) {}
  };

  // Handle Customized Add to Cart
  const handleAddCustomizedToCart = (customizedItem) => {
    try {
      const lineItemId = customizedItem.lineItemId || `custom_${Date.now()}`;
      const stored = JSON.parse(localStorage.getItem('userCart') || '{}');
      stored[lineItemId] = {
        quantity: 1,
        ...customizedItem
      };
      localStorage.setItem('userCart', JSON.stringify(stored));

      const customItemsMap = JSON.parse(localStorage.getItem('pvp_customized_items') || '{}');
      customItemsMap[lineItemId] = customizedItem;
      localStorage.setItem('pvp_customized_items', JSON.stringify(customItemsMap));

      window.dispatchEvent(new Event('cartUpdated'));
      setSelectedProductForCustomize(null);
    } catch (_) {}
  };

  // Back navigation handler: return to user home
  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      let target = '/user';
      if (window.location.pathname.startsWith('/food') && !target.startsWith('/food')) {
        target = `/food${target}`;
      }
      navigate(target);
    }
  };

  return (
    <>
      <MenuSearchOverlay
        isOpen={true}
        onClose={handleClose}
        allProducts={products}
        allAddons={addons}
        categories={categories}
        onOpenCustomize={(product) => setSelectedProductForCustomize(product)}
        onAddToCart={handleAddToCart}
      />

      {/* Product Customization Modal */}
      <ProductCustomizeModal
        isOpen={Boolean(selectedProductForCustomize)}
        onClose={() => setSelectedProductForCustomize(null)}
        item={selectedProductForCustomize}
        onAddToCart={handleAddCustomizedToCart}
        isDarkMode={isDarkMode}
      />
    </>
  );
}

