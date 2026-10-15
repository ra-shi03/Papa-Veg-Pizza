import React, { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { HomeModals } from "./components/HomeModals"
import { useLocationStore } from "@food/store/locationStore"
import { useLocationGuard } from "@food/hooks/useLocationGuard"
import logoNew from "@/assets/logo1.png"
import { PRODUCTS, DEALS } from "./HomeData"
import { HomeStyles } from "./components/HomeStyles"
import { HomeHeader } from "./components/HomeHeader"
import { HomeSections } from "./components/HomeSections"
import { BottomNavBar } from "./components/BottomNavBar"
import { OfferSection } from "./components/dynamic/OfferSection"
import { CouponDetailsModal } from "./components/dynamic/CouponDetailsModal"
import { ShowcaseSections } from "./components/dynamic/ShowcaseSections"
import { PapaVegPromiseSection } from "./components/dynamic/PapaVegPromiseSection"
import DeliveryCardAboveNav from "./components/dynamic/DeliveryCardAboveNav"
import { ChevronsUp } from "lucide-react"
import apiClient from "@/services/api/axios"
import { applySystemTheme } from "@/shared/utils/themeSync"


export default function Home() {
  const [rewardsConfig, setRewardsConfig] = useState(null);
  const navigate = useNavigate()
  const { isModalOpen, closeLocationModal, confirmLocation, locationConfirmed } = useLocationStore()
  const checkLocation = useLocationGuard()
  const offersRef = useRef(null)
  const [activeOffer, setActiveOffer] = useState(null)
  const [selectedCouponDetails, setSelectedCouponDetails] = useState(null)

  // Dynamic Home Page Config (delivery time set by superadmin)
  const [deliveryTime, setDeliveryTime] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.deliveryTimeMinutes) return parsed.deliveryTimeMinutes
      }
    } catch (_) { }
    return 30
  })
  const [deliveryLabel, setDeliveryLabel] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.deliveryTimeLabel) return parsed.deliveryTimeLabel
      }
    } catch (_) { }
    return "mins"
  })

  const [promoText, setPromoText] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.promoText) return parsed.promoText
      }
    } catch (_) { }
    return "LOWEST PRICES ONLY ON APP | FREE DELIVERY ABOVE ₹99"
  })

  const [cravingHeading, setCravingHeading] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.cravingHeading) return parsed.cravingHeading
      }
    } catch (_) { }
    return "What are you craving for?"
  })

  const [deliveryCardData, setDeliveryCardData] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.deliveryCard) return parsed.deliveryCard
      }
    } catch (_) { }
    return {
      enabled: true,
      title: 'Lowest Prices on Papa Veg Pizza App & Free Delivery',
      subtitle: 'Add items worth ₹99 to get FREE delivery!',
      iconType: 'animation',
      iconUrl: '',
      animationType: 'scooter',
      link: '/user/menu'
    }
  })

  // Helper to strictly sort categories according to superadmin configuration
  const sortCategoriesBySuperadmin = (list) => {
    return [...list].sort((a, b) => {
      const aVal = Number(a.sort !== undefined && a.sort !== null ? a.sort : (a.order !== undefined && a.order !== null ? a.order : 999));
      const bVal = Number(b.sort !== undefined && b.sort !== null ? b.sort : (b.order !== undefined && b.order !== null ? b.order : 999));
      if (aVal !== bVal) {
        return aVal - bVal;
      }
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });
  };

  // Dynamic Banners State
  const [banners, setBanners] = useState([
    {
      _id: "ban-01",
      title: "Paneer Volcano",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAJ1H7kfpIOVMST01cGdHOPK9zctqfPYuepo56-9Xt8VrjDotL945EWt6kVO8vNRM6ZK05zTPtpbInlC7BZrM6lBerNPa7UpA5DOzn1haf6-X4-TAanChNFzPI_Z6swWdt8jQnNq15ghwIv45L3x3XQnOvikSqpnRcI0TTf4czhHBPzZ-TfCC56kA2jx9m7t4XshJq08a_j1JyJAAyLP-ZS-8LGBejGgSyxcu3_N-t3KtKJjAOXBRaK9jKvwOU8KYa0JFB0wV1eQk2",
      subtitle: "New Arrival",
      bannerType: "Homepage Banner"
    },
    {
      _id: "ban-02",
      title: "BOGO: Double Joy",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhuBxF93NgpKNex48f17LImalRGfdBdZZqdLlNVab_K797rBPt0Qh41WKGhgBUY6BX_bguMlz7KB3zhPf89Rb5oW64QUft3d_e82SxwKnTaFUsozTWPHo6vjRJCZN72RrObT3u1FDquXmxIKDfadJDBh5XbyhXZ_DIZSk9oFll3KyAH08_2eo65-hOmzFFodulfl8DgB-vAiO7mZrjtsLHVOxzjYiVoALoG-MuCzQKaQPFXhiXSdpE_9bap7jwEFN7pqFbEtDXGEui",
      subtitle: "Limited Offer",
      bannerType: "Homepage Banner"
    }
  ]
  )

  // Dynamic Offers State
  const [offers, setOffers] = useState(() => {
    try {
      const homeConfig = localStorage.getItem("pvp_home_config")
      if (homeConfig) {
        const parsed = JSON.parse(homeConfig)
        if (parsed.offers && Array.isArray(parsed.offers) && parsed.offers.length > 0) {
          return parsed.offers
        }
      }
    } catch (e) { }

    try {
      const local = localStorage.getItem("franchise_admin_coupons")
      if (local) {
        const parsed = JSON.parse(local).filter(c => c.status === "active")
        if (parsed.length > 0) {
          return parsed.map(c => ({
            id: c._id,
            badge: c.discountType === "percentage" ? "Save" : "Flat",
            title: c.couponCode,
            description: c.title
          }))
        }
      }
    } catch (e) { }

    try {
      const superadmin = localStorage.getItem("pvp_coupons")
      if (superadmin) {
        const parsed = JSON.parse(superadmin).filter(c => c.status === "active")
        if (parsed.length > 0) {
          return parsed.map(c => ({
            id: c._id,
            badge: c.couponType === "Percentage" ? "Save" : "Flat",
            title: c.code,
            description: c.title
          }))
        }
      }
    } catch (e) { }

    return DEALS
  })

  // Default fallback coupons matching Domino's style with Papa Veg brand theme
  const DEFAULT_COUPONS = [
    {
      _id: "coupon-get80",
      code: "GET80",
      title: "Get up to ₹80 Off",
      description: "Up to ₹80 Off on orders worth ₹199 or more",
      couponType: "Percentage",
      discountType: "percentage",
      value: 40,
      discountValue: 40,
      minimumOrderAmount: 199,
      minOrderValue: 199,
      maximumDiscount: 80,
      maxDiscount: 80,
      status: "active",
      isActive: true,
      endDate: "2026-12-31T23:59:59.000Z"
    },
    {
      _id: "coupon-welcome50",
      code: "WELCOME50",
      title: "50% Off First Order",
      description: "Get 50% discount up to ₹150 on your first Papa Veg Pizza order",
      couponType: "Percentage",
      discountType: "percentage",
      value: 50,
      discountValue: 50,
      minimumOrderAmount: 249,
      minOrderValue: 249,
      maximumDiscount: 150,
      maxDiscount: 150,
      status: "active",
      isActive: true,
      endDate: "2026-12-31T23:59:59.000Z"
    },
    {
      _id: "coupon-pvp100",
      code: "PAPAVEG100",
      title: "Flat ₹100 Off Special",
      description: "Flat ₹100 off on delicious pizzas on orders above ₹499",
      couponType: "Flat Amount",
      discountType: "flat-price",
      value: 100,
      discountValue: 100,
      minimumOrderAmount: 499,
      minOrderValue: 499,
      maximumDiscount: 100,
      maxDiscount: 100,
      status: "active",
      isActive: true,
      endDate: "2026-12-31T23:59:59.000Z"
    }
  ];

  // Superadmin Dynamic Coupons State
  const [coupons, setCoupons] = useState(() => {
    try {
      const superadmin = localStorage.getItem("pvp_coupons")
      if (superadmin) {
        const parsed = JSON.parse(superadmin).filter(c => (c.status === "active" || c.isActive) && (!c.endDate || new Date(c.endDate) > new Date()))
        if (parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) { }
    return DEFAULT_COUPONS
  })
  const [copiedCode, setCopiedCode] = useState("")

  // Removed orderMethods state

  // Dynamic Logo State
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew)

  // Dynamic Categories State
  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeCats = parsed.filter(c => c.status !== "Inactive" && (c.type === "Category" || !c.type));
          const sorted = sortCategoriesBySuperadmin(activeCats);
          return sorted.map(c => {
            const labelRaw = c.label || c.name || "";
            const slug = c.slug || labelRaw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
            return {
              id: c.slug || slug,
              _id: c._id || c.id,
              slug: slug,
              label: labelRaw,
              icon: c.icon || c.image || 'local_pizza',
              sort: Number(c.sort !== undefined && c.sort !== null ? c.sort : (c.order !== undefined && c.order !== null ? c.order : 999))
            };
          });
        }
      }
    } catch (_) {}
    return [];
  });
  

  // Dynamic Products State
  const [products, setProducts] = useState([]);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const displayedProducts = useMemo(() => {
    if (!homeSearchQuery || !homeSearchQuery.trim()) return products;
    const q = homeSearchQuery.toLowerCase().trim();
    return products.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, homeSearchQuery]);
  
  // Dynamic API Layout State (Phase 4)
  const [dynamicLayout, setDynamicLayout] = useState({ data: [], isLoading: true, error: null });
  
  // App States
  const [userName, setUserName] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
      return storedUser.name || ""
    } catch (e) {
      return ""
    }
  })
  const [activeService, setActiveService] = useState(localStorage.getItem("activeService") || "delivery")
  const [hoveredService, setHoveredService] = useState(null)
  const [activeCategory, setActiveCategory] = useState("pizza")
  const [favorites, setFavorites] = useState([])
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userCart") || "{}")
    } catch (e) {
      return {}
    }
  })
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("sa_themeMode") || localStorage.getItem("appTheme");
    return savedTheme ? savedTheme === "dark" : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("appTheme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("appTheme", "light");
    }
  }, [isDarkMode]);

  useEffect(() => {
    applySystemTheme();
    const handleThemeSync = () => {
      const mode = localStorage.getItem("sa_themeMode") || localStorage.getItem("appTheme");
      if (mode) {
        setIsDarkMode(mode === "dark");
      }
      applySystemTheme();
    };

    window.addEventListener("systemThemeChanged", handleThemeSync);
    window.addEventListener("storage", handleThemeSync);
    return () => {
      window.removeEventListener("systemThemeChanged", handleThemeSync);
      window.removeEventListener("storage", handleThemeSync);
    };
  }, []);

  // Left-side circular scroll to top button state
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 220);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    handleWindowScroll();
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  const [activeSlide, setActiveSlide] = useState(0)

  // Ad Popup State
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [adPopupData, setAdPopupData] = useState(null);

  // Modal states removed
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("deliveryAddress") || "") : ""
  })

  // Sync local location state with global location confirmation changes
  useEffect(() => {
    if (locationConfirmed) {
      setDeliveryAddress(localStorage.getItem("deliveryAddress") || "")
    } else {
      setDeliveryAddress("")
    }
  }, [locationConfirmed])

  // Fetch user data if authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
    if (isAuthenticated) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
        if (storedUser.name) {
          setUserName(storedUser.name)
        }
      } catch (e) {
        console.error("Failed to parse user profile status", e)
      }
    }
  }, [])

  // Removed sync global location modal

  // Fetch dynamic home page settings (delivery time) from API
  useEffect(() => {
    const fetchHomeConfig = async () => {
      try {
        const res = await apiClient.get("/settings/home-page")
        const data = res?.data?.data
        if (data) {
          if (typeof data.deliveryTimeMinutes === "number") {
            setDeliveryTime(data.deliveryTimeMinutes)
          }
          if (data.deliveryTimeLabel) {
            setDeliveryLabel(data.deliveryTimeLabel)
          }
          if (data.promoText) {
            setPromoText(data.promoText)
          }
          if (data.cravingHeading) {
            setCravingHeading(data.cravingHeading)
          }
          localStorage.setItem("pvp_home_config", JSON.stringify(data))
          if (Array.isArray(data.banners)) {
            setBanners(data.banners.length > 0 ? data.banners : [])
          }
          if (Array.isArray(data.offers)) {
            setOffers(data.offers.length > 0 ? data.offers : [])
          }
          if (data.adPopup && data.adPopup.enabled && data.adPopup.imageUrl) {
            setAdPopupData(data.adPopup);
          }
          if (data.deliveryCard) {
            setDeliveryCardData(data.deliveryCard);
          }
        }
      } catch (err) {
        console.warn("Failed to load home page dynamic config:", err)
      }
    }

    const fetchCategoryProducts = async () => {
      try {
        let fetchedCats = [];
        let fetchedProds = [];

        // 1. Prioritize Superadmin categories endpoint with sort order
        try {
          const cRes = await apiClient.get('/food/admin/category-products?sort=sort_asc');
          if (Array.isArray(cRes?.data?.data) && cRes.data.data.length > 0) {
            fetchedCats = cRes.data.data;
          }
        } catch (_) {}

        // 2. Fetch public menu for categories/sections/products fallback
        try {
          const res = await apiClient.get('/food/admin/menu/public');
          if (res?.data?.data) {
            const { categories: cats, products: prods, sections: secs } = res.data.data;
            if (fetchedCats.length === 0 && Array.isArray(cats) && cats.length > 0) {
              fetchedCats = cats;
            }
            if (Array.isArray(prods) && prods.length > 0) {
              fetchedProds = prods;
            }
            if (secs && secs.length > 0) {
              setSections(secs.map(s => ({
                id: s._id || s.id,
                categoryId: s.categoryId,
                name: s.name,
                slug: s.slug
              })));
            }
          }
        } catch (_) {}

        // 3. Fallback to localStorage if needed
        if (fetchedCats.length === 0) {
          try {
            const stored = localStorage.getItem("pvp_categories");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                fetchedCats = parsed;
              }
            }
          } catch (_) {}
        }

        if (fetchedCats.length > 0) {
          const activeCats = fetchedCats.filter(c => c.status !== "Inactive" && (c.type === "Category" || !c.type));
          const sortedCats = sortCategoriesBySuperadmin(activeCats);
          const uniqueCatsMap = new Map();
          sortedCats.forEach(c => {
            const labelRaw = c.label || c.name;
            if (!labelRaw) return;
            const label = labelRaw.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            if (!uniqueCatsMap.has(label)) {
              const slug = c.slug || labelRaw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
              uniqueCatsMap.set(label, {
                id: c.slug || slug,
                _id: c._id || c.id,
                slug: slug,
                label: label,
                icon: c.icon || c.image || 'local_pizza',
                sort: Number(c.sort !== undefined && c.sort !== null ? c.sort : (c.order !== undefined && c.order !== null ? c.order : 999))
              });
            } else {
              const existing = uniqueCatsMap.get(label);
              const newIcon = c.icon || c.image;
              if (newIcon && newIcon.startsWith('http') && existing.icon && !existing.icon.startsWith('http')) {
                existing.icon = newIcon;
              }
            }
          });
          const parsedCats = Array.from(uniqueCatsMap.values());
          setCategories(parsedCats);
          setActiveCategory(prev => prev === "pizza" ? parsedCats[0]?.id || "pizza" : prev);
        }

        if (fetchedProds.length > 0) {
          setProducts(fetchedProds.map(p => ({
            id: p._id || p.id,
            title: p.name,
            price: p.price || 299,
            rating: 4.5,
            description: p.shortDescription || p.description,
            image: p.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
            categoryId: typeof p.categoryId === 'object' ? p.categoryId?._id : p.categoryId,
            sectionId: typeof p.sectionId === 'object' ? p.sectionId?._id : p.sectionId
          })));
        }
      } catch (err) {
        console.warn("Failed to load category products:", err);
      }
    }

    const fetchDynamicLayout = async () => {
      try {
        setDynamicLayout(prev => ({ ...prev, isLoading: true, error: null }));
        const res = await apiClient.get('/dynamic-home/home-layout');
        if (res?.data?.data) {
          setDynamicLayout({ data: res.data.data, isLoading: false, error: null });
        } else {
          setDynamicLayout(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error("Failed to load dynamic layout:", err);
        setDynamicLayout(prev => ({ ...prev, isLoading: false, error: err.message }));
      }
    }



    const fetchRewards = async () => {
      try {
        const res = await apiClient.get("/food/admin/rewards/public");
        if (res?.data?.data) {
          setRewardsConfig(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load rewards config", err);
      }
    }
    const fetchCoupons = async () => {
      try {
        const res = await apiClient.get('/settings/coupons/public');
        const list = res?.data?.data || res?.data;
        if (Array.isArray(list) && list.length > 0) {
          setCoupons(list);
          return;
        }
      } catch (err) {
        console.warn("Public coupons fetch error:", err);
      }

      try {
        const superadmin = localStorage.getItem("pvp_coupons");
        if (superadmin) {
          const parsed = JSON.parse(superadmin).filter(c => (c.status === "active" || c.isActive) && (!c.endDate || new Date(c.endDate) > new Date()));
          if (parsed.length > 0) {
            setCoupons(parsed);
            return;
          }
        }
      } catch (_) {}

      setCoupons(prev => (prev && prev.length > 0 ? prev : DEFAULT_COUPONS));
    };

    fetchRewards();
    fetchHomeConfig();
    fetchCategoryProducts();
    fetchDynamicLayout();
    fetchCoupons();

    const handleConfigUpdate = (e) => {
      const updated = e?.detail
      if (updated) {
        if (typeof updated.deliveryTimeMinutes === "number") {
          setDeliveryTime(updated.deliveryTimeMinutes)
        }
        if (updated.deliveryTimeLabel) {
          setDeliveryLabel(updated.deliveryTimeLabel)
        }
        if (updated.promoText) {
          setPromoText(updated.promoText)
        }
        if (updated.cravingHeading) {
          setCravingHeading(updated.cravingHeading)
        }
        if (Array.isArray(updated.banners)) {
          setBanners(updated.banners.length > 0 ? updated.banners : [])
        }
        if (Array.isArray(updated.offers)) {
          setOffers(updated.offers.length > 0 ? updated.offers : [])
        }
      } else {
        const fetchRewards = async () => {
          try {
            const res = await apiClient.get("/food/admin/rewards/public");
            if (res?.data?.data) {
              setRewardsConfig(res.data.data);
            }
          } catch (err) {
            console.error("Failed to load rewards config", err);
          }
        }
        fetchRewards();
        fetchHomeConfig();
      }
      fetchCoupons();
    }

    window.addEventListener("homePageConfigUpdated", handleConfigUpdate)
    window.addEventListener("storage", handleConfigUpdate)
    window.addEventListener("pvp_coupons_changed", fetchCoupons)

    return () => {
      window.removeEventListener("homePageConfigUpdated", handleConfigUpdate)
      window.removeEventListener("storage", handleConfigUpdate)
      window.removeEventListener("pvp_coupons_changed", fetchCoupons)
    }
  }, [])

  // Save and Restore Scroll Position
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("homeScrollPosition")
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll, 10), behavior: "auto" })
      }, 100)
    }

    const handleScroll = () => {
      sessionStorage.setItem("homeScrollPosition", window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Sync cart from localStorage dynamically
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("userCart") || "{}")
        setCart(storedCart)
      } catch (e) {
        setCart({})
      }
    }
    window.addEventListener("cartUpdated", handleCartSync)
    return () => window.removeEventListener("cartUpdated", handleCartSync)
  }, [])

  // Custom Toast State
  const [toast, setToast] = useState({ visible: false, message: "" })

  const triggerToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 2500)
  }

  const getCouponBadgeText = (c) => {
    if (c.couponType === "Percentage" || c.discountType === "percentage") {
      return `${c.value || c.discountValue || 0}% OFF`
    }
    if (c.couponType === "Flat Amount" || c.discountType === "flat") {
      return `FLAT ₹${c.value || c.discountValue || 0} OFF`
    }
    if (c.couponType === "Buy One Get One" || c.couponType === "BOGO") {
      return "BUY 1 GET 1"
    }
    if (c.couponType === "Free Product") {
      return "FREE PRODUCT"
    }
    return "SPECIAL DEAL"
  }

  const handleCopyCoupon = (couponCode) => {
    try {
      navigator.clipboard?.writeText(couponCode)
    } catch (_) {}
    setCopiedCode(couponCode)
    triggerToast(`Coupon code ${couponCode} copied!`)
    setTimeout(() => {
      setCopiedCode("")
    }, 2500)
  }

  const handleOpenCouponModal = (c) => {
    const code = c.code || c.couponCode || "PVPDEAL";
    const minOrder = c.minimumOrderAmount || c.minOrderValue || 199;
    const maxDiscount = c.maximumDiscount || c.maxDiscount || c.value || c.discountValue || 80;
    const val = c.value || c.discountValue || 80;
    const isPercentage = c.couponType === "Percentage" || c.discountType === "percentage";
    const discountText = isPercentage ? `${val}% (up to ₹${maxDiscount})` : `₹${val}`;

    setSelectedCouponDetails({
      title: c.title || (isPercentage ? `Get up to ₹${maxDiscount} Off` : `Flat ₹${val} Off`),
      subtitle: c.description || `Up to ₹${maxDiscount} Off on orders worth ₹${minOrder} or more`,
      couponCode: code,
      code: code,
      minOrderValue: minOrder,
      maxDiscount: maxDiscount,
      discountText: discountText,
      value: val,
      isPercentage: isPercentage,
      validTill: c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Today 11:00 PM",
      isFirstOrderOnly: Boolean(c.isFirstOrderOnly || (Array.isArray(c.customerSegments) && c.customerSegments.includes('New Customers'))),
      rawCoupon: c,
      actionType: 'apply_coupon',
      actionValue: code
    });
  };

  // Load Google Fonts and Material Icons dynamically
  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)

    const linkIcons = document.createElement("link")
    linkIcons.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    linkIcons.rel = "stylesheet"
    document.head.appendChild(linkIcons)

    return () => {
      document.head.removeChild(linkFonts)
      document.head.removeChild(linkIcons)
    }
  }, [])

  // Auto-play Slide loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % (banners.length || 1))
    }, 5000)
    return () => clearInterval(interval)
  }, [banners])

  // Ad Popup Logic
  useEffect(() => {
    if (!adPopupData) return;

    const now = new Date();
    if (adPopupData.startDate && new Date(adPopupData.startDate) > now) return;
    if (adPopupData.endDate && new Date(adPopupData.endDate) < now) return;

    const lastShown = localStorage.getItem("pvp_ad_popup_shown_ts");
    let shouldShow = false;

    if (adPopupData.frequencyRule === "every_launch") {
      shouldShow = true;
    } else if (adPopupData.frequencyRule === "once_per_session") {
      if (!sessionStorage.getItem("pvp_ad_popup_shown_session")) {
        shouldShow = true;
        sessionStorage.setItem("pvp_ad_popup_shown_session", "true");
      }
    } else if (adPopupData.frequencyRule === "once_per_day") {
      if (!lastShown || (now.getTime() - parseInt(lastShown)) > 86400000) {
        shouldShow = true;
      }
    }

    if (shouldShow) {
      const img = new Image();
      img.src = adPopupData.imageUrl;
      img.onload = () => {
        setShowAdPopup(true);
        localStorage.setItem("pvp_ad_popup_shown_ts", now.getTime().toString());
      };
    }
  }, [adPopupData]);

  // Sync States dynamically from events/localStorage updates
  useEffect(() => {
    const handleBannersSync = async () => {
      try {
        const res = await apiClient.get("/settings/home-page")
        const data = res?.data?.data
        if (data && Array.isArray(data.banners) && data.banners.length > 0) {
          setBanners(data.banners)
        }
      } catch (err) {
        console.warn("Failed to sync banners from API:", err)
      }
    }

    const handleOffersSync = () => {
      let list = []
      try {
        const homeConfig = localStorage.getItem("pvp_home_config")
        if (homeConfig) {
          const parsed = JSON.parse(homeConfig)
          if (parsed.offers && Array.isArray(parsed.offers) && parsed.offers.length > 0) {
            setOffers(parsed.offers)
            return
          }
        }
      } catch (e) { }

      try {
        const local = localStorage.getItem("franchise_admin_coupons")
        if (local) {
          const parsed = JSON.parse(local).filter(c => c.status === "active")
          if (parsed.length > 0) {
            list = parsed.map(c => ({
              id: c._id,
              badge: c.discountType === "percentage" ? "Save" : "Flat",
              title: c.couponCode,
              description: c.title
            }))
          }
        }
      } catch (e) { }

      if (list.length === 0) {
        try {
          const superadmin = localStorage.getItem("pvp_coupons")
          if (superadmin) {
            const parsed = JSON.parse(superadmin).filter(c => c.status === "active" || c.isActive)
            if (parsed.length > 0) {
              setCoupons(parsed);
              list = parsed.map(c => ({
                id: c._id,
                badge: c.couponType === "Percentage" ? "Save" : "Flat",
                title: c.code,
                description: c.title
              }))
            }
          }
        } catch (e) { }
      }

      if (list.length > 0) {
        setOffers(list)
      }
    }

    // handleOrderMethodsSync removed

    const handleBrandingSync = () => {
      setLogoUrl(localStorage.getItem("sa_logo") || logoNew)
    }

    const handleCategoriesSync = () => {
      try {
        const stored = localStorage.getItem("pvp_categories")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.length > 0) {
            const activeCats = parsed.filter(c => c.status !== "Inactive" && (c.type === "Category" || !c.type));
            const sortedCats = sortCategoriesBySuperadmin(activeCats);
            const uniqueCatsMap = new Map();
            sortedCats.forEach(c => {
              const labelRaw = c.label || c.name;
              if (!labelRaw) return;
              const label = labelRaw.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              
              if (!uniqueCatsMap.has(label)) {
                const slug = c.slug || labelRaw.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
                uniqueCatsMap.set(label, {
                  id: c.slug || slug,
                  _id: c._id || c.id,
                  slug: slug,
                  label: label,
                  icon: c.icon || c.image || 'local_pizza',
                  sort: Number(c.sort !== undefined && c.sort !== null ? c.sort : (c.order !== undefined && c.order !== null ? c.order : 999))
                });
              }
            });
            setCategories(Array.from(uniqueCatsMap.values()));
          }
        }
      } catch (e) { }
    }

    const handleProductsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_products_v2")
        if (stored) {
          const parsed = JSON.parse(stored).filter(p => p.status === "Active")
          if (parsed.length > 0) {
            const mapped = parsed.map(p => ({
              id: p.id || `prod-${p.name.toLowerCase().replace(/\s+/g, "-")}`,
              title: p.name,
              price: typeof p.price === 'string' ? parseInt(p.price.replace(/[^\d]/g, ""), 10) || 299 : p.price || 299,
              rating: p.rating || 4.5,
              description: p.description || `${p.name} prepared fresh with premium toppings.`,
              image: p.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
              category: p.category
            }))
            const merged = [...PRODUCTS]
            mapped.forEach(mp => {
              if (!merged.some(dp => dp.title.toLowerCase() === mp.title.toLowerCase())) {
                merged.push(mp)
              }
            })
            setProducts(merged)
          }
        }
      } catch (e) { }
    }

    const handleHomeConfigSync = (e) => {
      const cfg = e?.detail;
      if (cfg?.deliveryCard) {
        setDeliveryCardData(cfg.deliveryCard);
      }
    };

    window.addEventListener("franchise_banners_changed", handleBannersSync)
    window.addEventListener("pvp_banners_changed", handleBannersSync)
    window.addEventListener("franchise_coupons_changed", handleOffersSync)
    window.addEventListener("pvp_coupons_changed", handleOffersSync)
    window.addEventListener("systemThemeChanged", handleBrandingSync)
    window.addEventListener("pvp_categories_changed", handleCategoriesSync)
    window.addEventListener("pvp_products_changed_v2", handleProductsSync)
    window.addEventListener("homePageConfigUpdated", handleHomeConfigSync)

    return () => {
      window.removeEventListener("franchise_banners_changed", handleBannersSync)
      window.removeEventListener("pvp_banners_changed", handleBannersSync)
      window.removeEventListener("franchise_coupons_changed", handleOffersSync)
      window.removeEventListener("pvp_coupons_changed", handleOffersSync)
      window.removeEventListener("systemThemeChanged", handleBrandingSync)
      window.removeEventListener("pvp_categories_changed", handleCategoriesSync)
      window.removeEventListener("pvp_products_changed_v2", handleProductsSync)
      window.removeEventListener("homePageConfigUpdated", handleHomeConfigSync)
    }
  }, [])

  // Handle active states
  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(item => item !== id))
      triggerToast("Removed from favorites")
    } else {
      setFavorites([...favorites, id])
      triggerToast("Added to favorites!")
    }
  }

  // Cart operations
  const addToCart = (id) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }))
    triggerToast("Added to basket!")
  }

  // Banner click navigation routing
  const handleBannerClick = (b) => {
    if (b.redirectType === "category" && b.redirectId) {
      navigate("/user/menu", { state: { category: b.redirectId } })
      triggerToast(`Opening ${b.redirectId} category...`)
    } else if (b.redirectType === "product" && b.redirectId) {
      navigate(`/user/product/${b.redirectId}`)
      triggerToast(`Opening product details...`)
    } else if (b.redirectType === "coupon" && b.redirectId) {
      navigate("/user/offers")
      triggerToast("Opening offers...")
    } else {
      // Fallback matching algorithm by searching title & subtitle content
      const titleLower = (b.title || "").toLowerCase()
      const descLower = (b.subtitle || "").toLowerCase()
      if (titleLower.includes("pizza") || descLower.includes("pizza")) {
        navigate("/user/menu", { state: { category: "pizza" } })
        triggerToast("Opening pizza menu...")
      } else if (titleLower.includes("bread") || descLower.includes("bread") || titleLower.includes("side") || descLower.includes("side")) {
        navigate("/user/menu", { state: { category: "bread" } })
        triggerToast("Opening bread & sides menu...")
      } else if (titleLower.includes("burger") || descLower.includes("burger")) {
        navigate("/user/menu", { state: { category: "burger" } })
        triggerToast("Opening burger menu...")
      } else if (titleLower.includes("drink") || descLower.includes("drink") || titleLower.includes("beverage") || descLower.includes("beverage") || titleLower.includes("coke") || descLower.includes("coke")) {
        navigate("/user/menu", { state: { category: "drinks" } })
        triggerToast("Opening drinks menu...")
      } else if (titleLower.includes("dessert") || descLower.includes("dessert") || titleLower.includes("sweet") || descLower.includes("sweet")) {
        navigate("/user/menu", { state: { category: "desserts" } })
        triggerToast("Opening desserts menu...")
      } else if (titleLower.includes("pasta") || descLower.includes("pasta")) {
        navigate("/user/menu", { state: { category: "pasta" } })
        triggerToast("Opening pasta menu...")
      } else {
        navigate("/user/menu")
        triggerToast("Opening Menu...")
      }
    }
  }

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
      <div className={`page-wrapper w-full max-w-md min-h-screen pb-32 relative shadow-2xl border-x ${isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
        }`}>
        <HomeStyles isDarkMode={isDarkMode} />

        {/* Custom Toast Alert */}
        {toast.visible && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl glass-card font-label-sm text-xs border border-white/20 animate-bounce">
            {toast.message}
          </div>
        )}

        {/* TopAppBar */}
        <HomeHeader
          deliveryAddress={deliveryAddress}
          deliveryTime={deliveryTime}
          deliveryLabel={deliveryLabel}
          categories={categories}
          products={products}
          onSearchChange={setHomeSearchQuery}
        />

        {/* Main Content */}
        <main className="space-y-lg mt-0">
          {/* Banner & Promo Strip Wrapper (to remove gap from space-y-lg) */}
          <div className="flex flex-col w-full">
            {/* Hero Banner Carousel */}
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative h-[260px] w-full overflow-hidden shadow-lg border-0"
            >
              <div className="carousel-track flex h-full" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                {banners.map((b, idx) => (
                  <div
                    key={b._id || b.publicId || idx}
                    className="min-w-full h-full relative group cursor-pointer"
                    onClick={() => handleBannerClick(b)}
                  >
                    {b.resourceType === 'video' ? (
                      <video className="w-full h-full object-cover bg-zinc-100 dark:bg-zinc-900" src={b.url} autoPlay loop muted playsInline />
                    ) : (
                      <img className="w-full h-full object-cover bg-zinc-100 dark:bg-zinc-900" alt={b.title || 'Banner'} src={b.url || b.mobileImageUrl || b.imageUrl || b.image || b.bannerUrl} />
                    )}
                    {/* Text overlay (only shown if title/subtitle exist) */}
                    {(b.title || b.subtitle) && (
                      <div className="absolute inset-0 flex flex-col justify-end p-5 pointer-events-none">
                        {b.bannerType && (
                          <span className="bg-[var(--accent-red)] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md w-fit mb-1.5 shadow-sm">
                            {b.bannerType}
                          </span>
                        )}
                        {b.title && (
                          <h2 className="font-headline-lg-mobile text-white text-base font-black leading-tight" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                            {b.title}
                          </h2>
                        )}
                        {b.subtitle && (
                          <p className="text-zinc-200 text-[10px] font-medium mt-1 leading-snug line-clamp-2 max-w-[85%]" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                            {b.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Indicators */}
              <div className="absolute bottom-4 right-margin-mobile flex gap-2">
                {banners.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${activeSlide === i ? "w-8 bg-[var(--accent-red)]" : "w-2 bg-white/30"}`}></div>
                ))}
              </div>
            </motion.section>

            {/* Domino's style promo strip */}
            <div className="bg-[var(--accent-red)] text-white text-[9px] sm:text-[10px] font-semibold text-center py-2 px-2 shadow-sm w-full relative z-0 border-0">
              {promoText}
            </div>
          </div>

          {/* What are you craving for section */}
          {categories && categories.length > 0 && (
            <div className="pt-4 pb-2 pl-4 !mt-0">
              <h3 className="font-bold text-zinc-900 text-[16px] mb-4 font-headline-sm-mobile">
                {cravingHeading}
              </h3>
              <div className="grid grid-cols-3 gap-x-2.5 sm:gap-x-4 gap-y-6 pb-2 pr-4">
                {categories.slice(0, 12).map(cat => (
                  <div 
                    key={cat.id} 
                    className="flex flex-col items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => {
                      const menuBasePath = window.location.pathname.startsWith('/food') ? '/food/user/menu' : '/user/menu';
                      const targetKey = cat.slug || cat.id || cat.label;
                      navigate(`${menuBasePath}?category=${encodeURIComponent(targetKey)}`, {
                        state: {
                          category: cat.id,
                          categoryName: cat.label || cat.name,
                          categoryId: cat._id || cat.id,
                          slug: cat.slug || cat.id
                        }
                      });
                    }}
                  >
                    <div className="w-[104px] h-[104px] sm:w-[116px] sm:h-[116px] rounded-full border border-zinc-200 shadow-sm flex items-center justify-center p-1 bg-white mx-auto">
                      <div className="w-full h-full rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center relative">
                        {cat.icon && cat.icon.startsWith('http') ? (
                          <img src={cat.icon} alt={cat.label} className="w-full h-full object-cover absolute inset-0 scale-[1.15]" />
                        ) : (
                          <span className="material-symbols-outlined text-zinc-400 text-4xl">
                            {cat.icon || 'fastfood'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span 
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                      className="text-[10px] sm:text-[11.5px] font-normal text-zinc-700 dark:text-zinc-300 text-center whitespace-nowrap tracking-tight w-full block overflow-hidden text-ellipsis px-0.5"
                    >
                      {cat.label || cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Rewards Section */}
          {rewardsConfig && rewardsConfig.isEnabled && (
            <div className="px-2 sm:px-3 mt-2 mb-4">
              <div 
                className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border-x border-b border-t-0 border-zinc-200/80 dark:border-zinc-800 p-3.5 sm:p-4 transition-colors"
                style={{ 
                  backgroundColor: isDarkMode ? '#1a1a1a' : 'var(--secondary-off-white, #fbf9f9)', 
                  fontFamily: 'Poppins, sans-serif' 
                }}
              >
                <div className="flex gap-3 sm:gap-4 items-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center p-1">
                    {rewardsConfig.logoUrl ? (
                      <img src={rewardsConfig.logoUrl} alt="Rewards Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-zinc-400 text-center">No Logo</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-zinc-900 dark:text-white font-semibold text-[13px] sm:text-[14px] leading-snug mb-1 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {rewardsConfig.title}
                    </h3>
                    <div 
                      className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-[13px] space-y-0.5 font-normal"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <p>{rewardsConfig.subtitle1}</p>
                      <p>{rewardsConfig.subtitle2}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => triggerToast("Enrollment coming soon!")}
                  className="w-full mt-3.5 py-2.5 rounded-lg border-[1.5px] text-[13px] font-medium bg-transparent transition-colors active:scale-[0.98] hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ borderColor: 'var(--accent-red, #EE3A43)', color: 'var(--accent-red, #EE3A43)', fontFamily: 'Poppins, sans-serif' }}
                >
                  {rewardsConfig.buttonText}
                </button>
                <div 
                  className="text-center text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-300 font-medium mt-2.5 whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {rewardsConfig.termsText}{" "}
                  <a 
                    href={rewardsConfig.termsLink} 
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    {rewardsConfig.termsLinkText}
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Superadmin Coupons & Offers Section (matching Reference Image 2 with App Theme Color) */}
          {coupons && coupons.length > 0 && (
            <div className="mt-3 mb-4 select-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <div className="px-2 sm:px-3 mb-2.5">
                <h3 className="font-bold text-zinc-900 dark:text-white text-[16px] sm:text-[17px] tracking-tight m-0 font-headline-sm-mobile">
                  Offers for you
                </h3>
              </div>

              {/* Horizontal Scroll Carousel with App Red Theme Color */}
              <div 
                className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 pt-1 px-2 sm:px-3"
              >
                {coupons.map((c) => {
                  const minOrder = c.minimumOrderAmount || c.minOrderValue || 199;
                  const maxDiscount = c.maximumDiscount || c.maxDiscount || c.value || c.discountValue || 80;
                  const isPercentage = c.couponType === 'Percentage' || c.discountType === 'percentage';
                  const titleText = c.title || (isPercentage ? `Get up to ₹${maxDiscount} Off` : `Flat ₹${c.value || c.discountValue || maxDiscount} Off`);
                  const subText = c.description || `Up to ₹${maxDiscount} Off on orders worth ₹${minOrder} or more`;

                  return (
                    <div
                      key={c._id || c.code}
                      onClick={() => handleOpenCouponModal(c)}
                      className="w-[325px] sm:w-[355px] shrink-0 bg-gradient-to-r from-[var(--accent-red,#EE3A43)] to-[#C8232C] rounded-2xl p-3.5 sm:p-4 shadow-md shadow-red-500/15 flex items-center justify-between text-white cursor-pointer select-none transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {/* Left: Stamp Badge + Text */}
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          {/* Scalloped Stamp Badge Icon (matching Image 2) */}
                          <div className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-white text-[15px] font-bold">
                              percent
                            </span>
                          </div>
                          <h4 className="font-bold text-white text-sm sm:text-[15px] tracking-tight leading-tight truncate m-0">
                            {titleText}
                          </h4>
                        </div>
                        <p className="text-white/85 text-[11px] sm:text-xs font-normal mt-1 leading-snug truncate m-0">
                          {subText}
                        </p>
                      </div>

                      {/* Right: Rounded Outline View Button (matching Image 2) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCouponModal(c);
                        }}
                        className="border border-white/90 text-white rounded-xl px-4 py-1.5 text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0 ml-2 bg-transparent"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Showcase Sections (Paneer Max, 6 in 1, Combo Bonanza, etc. created by Superadmin) */}
          <ShowcaseSections 
            onAddToCart={addToCart} 
            triggerToast={triggerToast} 
            isDarkMode={isDarkMode} 
          />

          {/* Papa Veg Pizza Promise Section (Fetched from backend with app's theme) */}
          <PapaVegPromiseSection isDarkMode={isDarkMode} />

          <HomeSections
            offers={offers}
            categories={categories}
            
            products={displayedProducts}
            activeCategory={activeCategory}
            favorites={favorites}
            isDarkMode={isDarkMode}
            checkLocation={checkLocation}
            triggerToast={triggerToast}
            toggleFavorite={toggleFavorite}
            addToCart={addToCart}
            offersRef={offersRef}
          />
        </main>

        {/* Left-side Circular Scroll To Top Button (matching screenshot) */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.6, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6, y: 15 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                backgroundColor: isDarkMode ? '#1a1a1a' : 'var(--secondary-off-white, #F8F6F2)'
              }}
              className={`fixed ${deliveryCardData && deliveryCardData.enabled !== false ? 'bottom-[122px]' : 'bottom-22 sm:bottom-24'} left-3.5 sm:left-5 z-40 w-11 h-11 rounded-full border border-zinc-200/90 dark:border-zinc-700 shadow-lg shadow-black/15 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-[var(--accent-red,#EE3A43)] dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all cursor-pointer`}
              title="Scroll to Top"
            >
              <ChevronsUp size={22} strokeWidth={2.4} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Delivery Card Just Above Navbar (Dynamic Promotion Strip) */}
        {deliveryCardData && deliveryCardData.enabled !== false && (
          <DeliveryCardAboveNav
            config={deliveryCardData}
            isDarkMode={isDarkMode}
            navigate={navigate}
          />
        )}

        {/* BottomNavBar & Floating Cart */}
        <BottomNavBar
          navigate={navigate}
          triggerToast={triggerToast}
          totalCartCount={totalCartCount}
          locationConfirmed={locationConfirmed}
        />

        {/* Ad Popup Modal */}
        <AnimatePresence>
          {showAdPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowAdPopup(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                className="relative max-w-sm w-full bg-transparent rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowAdPopup(false)}
                  className="absolute top-3 right-3 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors border border-white/20"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none block">close</span>
                </button>
                <div 
                  className="w-full cursor-pointer rounded-2xl overflow-hidden"
                  onClick={() => {
                    setShowAdPopup(false);
                    if (adPopupData?.link) {
                      navigate(adPopupData.link);
                    }
                  }}
                >
                  <img 
                    src={adPopupData?.imageUrl} 
                    alt="Promo" 
                    className="w-full h-auto object-contain bg-transparent rounded-2xl" 
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <CouponDetailsModal 
          isOpen={!!selectedCouponDetails}
          offer={selectedCouponDetails}
          onClose={() => setSelectedCouponDetails(null)}
          onApply={(offer) => {
            const code = offer.couponCode || offer.code || offer.actionValue;
            if (code) {
              try {
                navigator.clipboard?.writeText(code);
              } catch (_) {}
              const couponObj = offer.rawCoupon || {
                code: code,
                couponCode: code,
                title: offer.title,
                value: offer.value || offer.maxDiscount || 80,
                discountValue: offer.value || offer.maxDiscount || 80,
                discountType: offer.isPercentage ? 'percentage' : 'flat-price',
                minOrder: offer.minOrderValue || 199,
                minimumOrderAmount: offer.minOrderValue || 199,
                maxDiscount: offer.maxDiscount || 80
              };
              localStorage.setItem("pvp_applied_coupon", JSON.stringify(couponObj));
              localStorage.setItem("cart_applied_coupon", JSON.stringify(couponObj));
              triggerToast(`🎉 Coupon ${code} applied successfully!`);
            } else if (offer.actionType === 'open_url') {
              window.open(offer.actionValue, '_blank');
            } else {
              triggerToast(`Applied offer: ${offer.title}`);
            }
          }}
          isDarkMode={isDarkMode}
        />

      </div>
    </div>
  )
}
