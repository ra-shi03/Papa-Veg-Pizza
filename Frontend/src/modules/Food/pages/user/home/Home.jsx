import React, { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { HomeModals } from "./components/HomeModals"
import { useLocationStore } from "@food/store/locationStore"
import { useLocationGuard } from "@food/hooks/useLocationGuard"
import { useScrollLock } from "@food/hooks/useScrollLock"
import logoNew from "@/assets/logo1.png"
import { DEALS } from "./HomeData"
import { HomeStyles } from "./components/HomeStyles"
import { HomeHeader } from "./components/HomeHeader"
import { HomeSections } from "./components/HomeSections"
import { BottomNavBar } from "./components/BottomNavBar"
import { OfferSection } from "./components/dynamic/OfferSection"
import { CouponDetailsModal } from "./components/dynamic/CouponDetailsModal"
import { ShowcaseSections } from "./components/dynamic/ShowcaseSections"
import { PapaVegPromiseSection } from "./components/dynamic/PapaVegPromiseSection"
import DeliveryCardAboveNav from "./components/dynamic/DeliveryCardAboveNav"
import ProductCustomizeModal from "@food/components/user/ProductCustomizeModal"
import UserSidebarDrawer from "@food/components/user/UserSidebarDrawer"
import DeliverOnTrainModal from "@food/components/user/DeliverOnTrainModal"
import RewardsWalletLoading from "@food/components/user/RewardsWalletLoading"
import PreviousRewardsView from "../rewards/PreviousRewardsView"
import { ChevronsUp, X } from "lucide-react"
import apiClient, { adminClient } from "@/services/api/axios"
import { userAPI } from "@food/api"
import { applySystemTheme } from "@/shared/utils/themeSync"
import { useAppConfig } from "@food/context/AppConfigContext"

const DEFAULT_REWARD_TERMS = [
  "The Papa Veg Pizza Cheesy Rewards Loyalty Program (Loyalty Program) is being conducted by Papa Veg Pizza.",
  "Loyalty program is designed to reward selected Papa Veg Pizza customers for online order placed through Papa Veg Pizza Application, Mobile Website and our call centre. Customers who are eligible for the program (select customers) will be able to view the Cheesy Rewards Icon in Papa Veg Pizza application homepage and need to register in the Papa Veg Pizza application page to participate in the Program.",
  "The cheesy rewards loyalty program is currently open for only orders placed through Papa Veg Pizza's App, mobile website and call centre.",
  "Every time the registered customer places an order via Papa Veg Pizza's Application, such customer can earn 100 points (having value equivalent to 1 pizza slice), on the order value of at least INR 350, as Cheesy Rewards points. These points will be credited to the Papa Veg Pizza's wallet within 48 working hours of successful delivery of the order. These points can only be redeemed to pay for a free pizza (from the selected pizza range) once customer has accumulated 600 points (ie. Equivalent to 6 slices of pizza). Customer needs to check their Papa Veg Pizza's app for more details to find the actual list of Pizzas from which a FREE pizza can be redeemed in lieu of points.",
  "A minimum order value of INR 350 (excl. tax/charges) is required to earn Cheesy Rewards Points.",
  "This scheme can be availed only on 1st Order of the day. Customer is eligible to earn max 100 points (ie. Equivalent to 1 slice).",
  "For redemption of Points/Free Pizza minimum 600 points must be accumulated. Points in multiple of 600 points will only be eligible for redemption. Max 1 slice/100 points can be earned in a day.",
  "Wallet Points are valid for a period of 365 days from the day of enrolment in the Cheesy Rewards Loyalty Program. After which points will lapse automatically."
];

export default function Home() {
  const { config: appConfig } = useAppConfig();
  const [rewardsConfig, setRewardsConfig] = useState(null);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [showRewardsLoading, setShowRewardsLoading] = useState(false);
  const [showRewardsPage, setShowRewardsPage] = useState(false);
  const [showAdPopup, setShowAdPopup] = useState(false);
  const [isRewardsEnrolled, setIsRewardsEnrolled] = useState(() => {
    const isAuth =
      localStorage.getItem("user_authenticated") === "true" ||
      Boolean(localStorage.getItem("user_accessToken") || localStorage.getItem("accessToken"));
    return isAuth && localStorage.getItem('pvp_rewards_enrolled') === 'true';
  });
  const rewardsLoadingTimeoutRef = useRef(null);

  useEffect(() => {
    const handleEnrollSync = () => {
      const isAuth =
        localStorage.getItem("user_authenticated") === "true" ||
        Boolean(localStorage.getItem("user_accessToken") || localStorage.getItem("accessToken"));
      setIsRewardsEnrolled(isAuth && localStorage.getItem('pvp_rewards_enrolled') === 'true');
    };
    window.addEventListener('pvp_rewards_enrolled_changed', handleEnrollSync);
    window.addEventListener('storage', handleEnrollSync);
    return () => {
      window.removeEventListener('pvp_rewards_enrolled_changed', handleEnrollSync);
      window.removeEventListener('storage', handleEnrollSync);
    };
  }, []);

  useEffect(() => {
    const checkWalletEnrollment = async () => {
      const isAuth =
        localStorage.getItem("user_authenticated") === "true" ||
        Boolean(localStorage.getItem("user_accessToken") || localStorage.getItem("accessToken"));

      if (!isAuth) {
        setIsRewardsEnrolled(false);
        localStorage.removeItem('pvp_rewards_enrolled');
        return;
      }

      try {
        // Server rewards membership is the source of truth (covers enrol/quit on another device).
        const res = await userAPI.getRewards();
        const rewards = res?.data?.data?.rewards;
        if (rewards) {
          const enrolled = Boolean(rewards.isEnrolled);
          setIsRewardsEnrolled(enrolled);
          if (enrolled) localStorage.setItem('pvp_rewards_enrolled', 'true');
          else localStorage.removeItem('pvp_rewards_enrolled');
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          setIsRewardsEnrolled(false);
          localStorage.removeItem('pvp_rewards_enrolled');
        }
      }
    };
    checkWalletEnrollment();
  }, []);

  const handleStartRewardsFlow = () => {
    const rewardsPath = window.location.pathname.startsWith('/food')
      ? '/food/user/rewards'
      : '/user/rewards';
    navigate(rewardsPath);
  };

  const handleCancelRewardsLoading = () => {
    if (rewardsLoadingTimeoutRef.current) clearTimeout(rewardsLoadingTimeoutRef.current);
    setShowRewardsLoading(false);
  };
  const navigate = useNavigate()

  // Lock background scroll when any modal or sheet is open
  useScrollLock(Boolean(isTermsModalOpen || showAdPopup || showRewardsLoading || showRewardsPage));

  // Ensure Welcome Screen is shown first for new app sessions
  useEffect(() => {
    const welcomeShown = sessionStorage.getItem("papa_veg_welcome_shown");
    if (!welcomeShown) {
      navigate("/welcome", { replace: true });
      return;
    }
    localStorage.setItem("customer_has_visited", "true");
  }, [navigate]);

  const { isModalOpen, closeLocationModal, confirmLocation, locationConfirmed } = useLocationStore()
  const checkLocation = useLocationGuard()
  const offersRef = useRef(null)
  const [activeOffer, setActiveOffer] = useState(null)
  const [selectedCouponDetails, setSelectedCouponDetails] = useState(null)
  const [selectedProductForCustomize, setSelectedProductForCustomize] = useState(null)
  const [isProfileSidebarOpen, setIsProfileSidebarOpen] = useState(false)
  const [showTrainModal, setShowTrainModal] = useState(false)

  // Dynamic Bottom Nav State (Domino's 5-button bar configured by superadmin)
  const [bottomNavItems, setBottomNavItems] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed?.bottomNav) && parsed.bottomNav.length > 0) {
          return parsed.bottomNav
        }
      }
    } catch (_) {}
    return null
  })

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

  // Dynamic Banners State (Zero hardcoded banners)
  const [banners, setBanners] = useState(() => {
    try {
      const homeConfig = localStorage.getItem("pvp_home_config");
      if (homeConfig) {
        const parsed = JSON.parse(homeConfig);
        if (Array.isArray(parsed.banners)) {
          return parsed.banners.filter(
            (b) => b._id !== "ban-01" && b._id !== "ban-02" && b.title !== "Paneer Volcano"
          );
        }
      }
    } catch (_) {}
    return [];
  });

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
      const cachedCfg = JSON.parse(localStorage.getItem('pvp_app_config') || '{}');
      if (cachedCfg.couponEnabled === false) return [];
      const superadmin = localStorage.getItem("pvp_coupons")
      if (superadmin) {
        const parsed = JSON.parse(superadmin).filter(c => (c.status === "active" || c.isActive) && (!c.endDate || new Date(c.endDate) > new Date()))
        if (parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) { }
    return [];
  })

  // Immediately clear coupons if disabled globally
  useEffect(() => {
    if (appConfig?.couponEnabled === false) {
      setCoupons([]);
    }
  }, [appConfig?.couponEnabled]);
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
              borderColor: c.borderColor || '',
              sort: Number(c.sort !== undefined && c.sort !== null ? c.sort : (c.order !== undefined && c.order !== null ? c.order : 999))
            };
          });
        }
      }
    } catch (_) {}
    return [];
  });
  

  // Dynamic Products State (100% Real Dynamic Data from Backend / Database)
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_products_v2");
      if (stored) {
        const parsed = JSON.parse(stored).filter(p => p.status === "Active" || !p.status);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  });


  
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
          const validBanners = Array.isArray(data.banners)
            ? data.banners.filter((b) => b._id !== "ban-01" && b._id !== "ban-02" && b.title !== "Paneer Volcano")
            : [];
          localStorage.setItem("pvp_home_config", JSON.stringify({ ...data, banners: validBanners }));
          setBanners(validBanners);
          if (Array.isArray(data.offers)) {
            setOffers(data.offers.length > 0 ? data.offers : [])
          }
          if (data.adPopup && data.adPopup.enabled && data.adPopup.imageUrl) {
            setAdPopupData(data.adPopup);
          }
          if (data.deliveryCard) {
            setDeliveryCardData(data.deliveryCard);
          }
          if (Array.isArray(data.bottomNav)) {
            setBottomNavItems(data.bottomNav);
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
                borderColor: c.borderColor || '',
                sort: Number(c.sort !== undefined && c.sort !== null ? c.sort : (c.order !== undefined && c.order !== null ? c.order : 999))
              });
            } else {
              const existing = uniqueCatsMap.get(label);
              if (c.borderColor && !existing.borderColor) {
                existing.borderColor = c.borderColor;
              }
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

        if (fetchedProds.length === 0) {
          try {
            const pRes = await adminClient.get('/food/admin/products', { params: { limit: 250, page: 1 } });
            const items = Array.isArray(pRes?.data?.data) ? pRes.data.data : (pRes?.data?.data?.foods || []);
            if (items.length > 0) fetchedProds = items;
          } catch (_) {}
        }
        if (fetchedProds.length === 0) {
          try {
            const pRes = await apiClient.get('/food/admin/products', { params: { limit: 250, page: 1 } });
            const items = Array.isArray(pRes?.data?.data) ? pRes.data.data : (pRes?.data?.data?.foods || []);
            if (items.length > 0) fetchedProds = items;
          } catch (_) {}
        }
        if (fetchedProds.length === 0) {
          try {
            const pRes = await apiClient.get('/food/admin/products/public');
            const items = Array.isArray(pRes?.data?.data) ? pRes.data.data : [];
            if (items.length > 0) fetchedProds = items;
          } catch (_) {}
        }
        if (fetchedProds.length === 0) {
          try {
            const stored = localStorage.getItem("pvp_products_v2");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                fetchedProds = parsed;
              }
            }
          } catch (_) {}
        }

        if (fetchedProds.length > 0) {
          const activeProds = fetchedProds.filter(p => p.status === "Active" || !p.status);
          const mapped = activeProds.map(p => ({
            ...p,
            id: p._id || p.id,
            title: p.name || p.title,
            name: p.name || p.title,
            price: Number(p.price) || (p.sizes && Number(p.sizes[0]?.price)) || 0,
            originalPrice: p.originalPrice || p.mrp || (p.sizes && (p.sizes[0]?.originalPrice || p.sizes[0]?.mrp)) || null,
            saveAmount: p.saveAmount || (p.sizes && p.sizes[0]?.saveAmount) || null,
            rating: p.rating || 4.5,
            description: p.shortDescription || p.description || "",
            image: p.image || p.imageUrl || (Array.isArray(p.images) && p.images[0]) || "",
            categoryId: typeof p.categoryId === 'object' ? p.categoryId?._id : p.categoryId,
            sectionId: typeof p.sectionId === 'object' ? p.sectionId?._id : p.sectionId
          }));
          setProducts(mapped);
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
      if (appConfig?.couponEnabled === false) {
        setCoupons([]);
        return;
      }
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
        if (superadmin && appConfig?.couponEnabled !== false) {
          const parsed = JSON.parse(superadmin).filter(c => (c.status === "active" || c.isActive) && (!c.endDate || new Date(c.endDate) > new Date()));
          if (parsed.length > 0) {
            setCoupons(parsed);
            return;
          }
        }
      } catch (_) {}

      setCoupons([]);
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
          const valid = updated.banners.filter((b) => b._id !== "ban-01" && b._id !== "ban-02" && b.title !== "Paneer Volcano");
          setBanners(valid);
        }
        if (Array.isArray(updated.offers)) {
          setOffers(updated.offers.length > 0 ? updated.offers : [])
        }
        if (Array.isArray(updated.bottomNav)) {
          setBottomNavItems(updated.bottomNav.length > 0 ? updated.bottomNav : null)
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
    window.addEventListener("pvp_home_config_changed", handleConfigUpdate)
    window.addEventListener("storage", handleConfigUpdate)
    window.addEventListener("pvp_coupons_changed", fetchCoupons)

    return () => {
      window.removeEventListener("homePageConfigUpdated", handleConfigUpdate)
      window.removeEventListener("pvp_home_config_changed", handleConfigUpdate)
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
        if (data && Array.isArray(data.banners)) {
          const valid = data.banners.filter((b) => b._id !== "ban-01" && b._id !== "ban-02" && b.title !== "Paneer Volcano");
          setBanners(valid);
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
                  borderColor: c.borderColor || '',
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
              ...p,
              id: p._id || p.id || `prod-${String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              title: p.name || p.title,
              name: p.name || p.title,
              price: typeof p.price === 'string' ? parseInt(p.price.replace(/[^\d]/g, ""), 10) || 0 : Number(p.price) || (p.sizes && Number(p.sizes[0]?.price)) || 0,
              originalPrice: p.originalPrice || p.mrp || (p.sizes && (p.sizes[0]?.originalPrice || p.sizes[0]?.mrp)) || null,
              saveAmount: p.saveAmount || (p.sizes && p.sizes[0]?.saveAmount) || null,
              rating: p.rating || 4.5,
              description: p.shortDescription || p.description || "",
              image: p.image || p.imageUrl || (Array.isArray(p.images) && p.images[0]) || "",
              category: p.category
            }));
            setProducts(mapped);
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
    const key = String(id);
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}");
    const currentQty = typeof stored[key] === 'object' && stored[key] !== null ? (stored[key].quantity || 1) : Number(stored[key] || 0);
    stored[key] = currentQty + 1;
    localStorage.setItem("userCart", JSON.stringify(stored));
    setCart(stored);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeFromCart = (id) => {
    const key = String(id);
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}");
    const currentQty = typeof stored[key] === 'object' && stored[key] !== null ? (stored[key].quantity || 1) : Number(stored[key] || 0);
    if (currentQty > 1) {
      if (typeof stored[key] === 'object' && stored[key] !== null) {
        stored[key].quantity = currentQty - 1;
      } else {
        stored[key] = currentQty - 1;
      }
    } else {
      delete stored[key];
    }
    localStorage.setItem("userCart", JSON.stringify(stored));
    setCart(stored);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Dedicated removal handler for customized or base products
  const handleRemoveProductFromCart = (productId) => {
    const pIdStr = String(productId);
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}");
    let targetKey = pIdStr;
    if (!stored[targetKey]) {
      targetKey = Object.keys(stored).find(k => k === pIdStr || k.startsWith(pIdStr + "-"));
    }
    if (targetKey && stored[targetKey]) {
      const curVal = stored[targetKey];
      const curQty = typeof curVal === 'object' && curVal !== null ? (curVal.quantity || 1) : Number(curVal || 0);
      if (curQty > 1) {
        if (typeof curVal === 'object' && curVal !== null) {
          stored[targetKey].quantity = curQty - 1;
        } else {
          stored[targetKey] = curQty - 1;
        }
      } else {
        delete stored[targetKey];
      }
      localStorage.setItem("userCart", JSON.stringify(stored));
      setCart(stored);
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  // Add customized item from ProductCustomizeModal
  const handleAddCustomizedToCart = (customizedItem, quantity = 1) => {
    const key = customizedItem.customizedKey || String(customizedItem.id);
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}");
    
    // Store quantity in userCart for backward compatibility with numeric lookups
    const existing = stored[key];
    const prevQty = typeof existing === 'object' && existing !== null ? (existing.quantity || 1) : Number(existing || 0);
    stored[key] = prevQty + quantity;
    localStorage.setItem("userCart", JSON.stringify(stored));

    // Also persist detailed customized spec so Cart.jsx and Checkout have full crust & topping info
    try {
      const customMap = JSON.parse(localStorage.getItem("pvp_customized_items") || "{}");
      customMap[key] = customizedItem;
      localStorage.setItem("pvp_customized_items", JSON.stringify(customMap));
    } catch (_) {}

    setCart(stored);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  // Banner click navigation routing
  const handleBannerClick = (b) => {
    let menuRoute = '/user/menu';
    if (window.location.pathname.startsWith('/food') && !menuRoute.startsWith('/food')) {
      menuRoute = `/food${menuRoute}`;
    }

    // 1. Direct category assignment configured by Superadmin
    const targetCategory = b.category || b.categoryId || b.categoryName || (b.redirectType === "category" ? b.redirectId : null);
    if (targetCategory) {
      navigate(`${menuRoute}?category=${encodeURIComponent(targetCategory)}`, {
        state: { 
          category: targetCategory,
          categoryId: targetCategory,
          categoryName: b.categoryName || targetCategory
        } 
      });
      triggerToast(`Opening ${b.categoryName || targetCategory} menu...`);
      return;
    }

    // 2. Specific product, coupon, or link redirect
    if (b.redirectType === "product" && b.redirectId) {
      navigate(`/user/product/${b.redirectId}`);
      triggerToast(`Opening product details...`);
      return;
    } else if (b.redirectType === "coupon" && b.redirectId) {
      navigate("/user/offers");
      triggerToast("Opening offers...");
      return;
    } else if (b.link) {
      let target = b.link;
      if (window.location.pathname.startsWith('/food') && !target.startsWith('/food') && target.startsWith('/')) {
        target = `/food${target}`;
      }
      navigate(target);
      return;
    }

    // 3. Fallback matching algorithm by searching title & subtitle content
    const titleLower = (b.title || "").toLowerCase();
    const descLower = (b.subtitle || "").toLowerCase();
    let matchedCat = null;
    if (titleLower.includes("pizza") || descLower.includes("pizza")) {
      matchedCat = "pizza";
    } else if (titleLower.includes("bread") || descLower.includes("bread") || titleLower.includes("side") || descLower.includes("side")) {
      matchedCat = "bread";
    } else if (titleLower.includes("burger") || descLower.includes("burger")) {
      matchedCat = "burger";
    } else if (titleLower.includes("drink") || descLower.includes("drink") || titleLower.includes("beverage") || descLower.includes("beverage") || titleLower.includes("coke") || descLower.includes("coke")) {
      matchedCat = "drinks";
    } else if (titleLower.includes("dessert") || descLower.includes("dessert") || titleLower.includes("sweet") || descLower.includes("sweet")) {
      matchedCat = "desserts";
    } else if (titleLower.includes("pasta") || descLower.includes("pasta")) {
      matchedCat = "pasta";
    }

    if (matchedCat) {
      navigate(`${menuRoute}?category=${encodeURIComponent(matchedCat)}`, {
        state: { category: matchedCat }
      });
      triggerToast(`Opening ${matchedCat} menu...`);
    } else {
      navigate(menuRoute);
      triggerToast("Opening Menu...");
    }
  };

  const totalCartCount = Object.values(cart).reduce((sum, qty) => {
    if (typeof qty === "object" && qty !== null) {
      return sum + (Number(qty.quantity) || 1);
    }
    return sum + (Number(qty) || 0);
  }, 0)

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
      <div className={`page-wrapper w-full max-w-md min-h-screen pb-32 relative shadow-2xl border-x ${isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
        }`}>
        <HomeStyles isDarkMode={isDarkMode} />

        {/* Custom Toast Alert */}
        {toast.visible && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl font-label-sm text-xs border border-white/20 animate-bounce">
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
          onOpenSidebar={() => setIsProfileSidebarOpen(true)}
        />

        {/* Main Content */}
        <main className="space-y-lg mt-0">
          {/* Banner & Promo Strip Wrapper (to remove gap from space-y-lg) */}
          <div className="flex flex-col w-full">
            {/* Hero Banner Carousel (Rendered only when dynamic banners exist) */}
            {banners && banners.length > 0 && (
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
                            <span className="bg-[var(--accent-red)] text-white text-[8px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-md w-fit mb-1.5 shadow-sm">
                              {b.bannerType}
                            </span>
                          )}
                          {b.title && (
                            <h2 className="font-headline-lg-mobile text-white text-base font-semibold leading-tight" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
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
                {banners.length > 1 && (
                  <div className="absolute bottom-4 right-margin-mobile flex gap-2">
                    {banners.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full transition-all duration-300 ${activeSlide === i ? "w-8 bg-[var(--accent-red)]" : "w-2 bg-white/30"}`}></div>
                    ))}
                  </div>
                )}
              </motion.section>
            )}

            {/* Domino's style promo strip */}
            <div className="bg-[var(--accent-red)] text-white text-[9px] sm:text-[10px] font-semibold text-center py-2 px-2 shadow-sm w-full relative z-0 border-0">
              {promoText}
            </div>
          </div>

          {/* What are you craving for section */}
          {categories && categories.length > 0 && (
            <div className="pt-4 pb-2 pl-4 !mt-0">
              <h3 className="font-semibold text-zinc-900 text-[16px] mb-4 font-headline-sm-mobile">
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
                    <div 
                      className="w-[104px] h-[104px] sm:w-[116px] sm:h-[116px] rounded-full overflow-hidden shadow-sm flex items-center justify-center bg-zinc-100 mx-auto transition-all relative border-[3.5px]"
                      style={{ 
                        borderColor: cat.borderColor || '#e4e4e7'
                      }}
                    >
                      {cat.icon && cat.icon.startsWith('http') ? (
                        <img src={cat.icon} alt={cat.label} className="w-full h-full object-cover absolute inset-0 scale-[1.15]" />
                      ) : (
                        <span className="material-symbols-outlined text-zinc-400 text-4xl">
                          {cat.icon || 'fastfood'}
                        </span>
                      )}
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
          {appConfig?.loyaltyEnabled !== false && rewardsConfig && rewardsConfig.isEnabled && (
            <div className="px-2 sm:px-3 mt-2 mb-4">
              <div 
                className="rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-zinc-200/80 dark:border-zinc-800 p-3.5 sm:p-4 transition-colors"
                style={{ 
                  backgroundColor: isDarkMode ? '#1a1a1a' : 'var(--secondary-off-white, #fbf9f9)', 
                  fontFamily: 'Poppins, sans-serif' 
                }}
              >
                {isRewardsEnrolled ? (
                  /* ── Enrolled State: Matching Reference Image 4 with our existing theme ── */
                  <div className="flex gap-3 sm:gap-4 items-center">
                    <div 
                      onClick={handleStartRewardsFlow}
                      className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center p-0.5 cursor-pointer hover:scale-105 transition-transform"
                      title="View Rewards & Wallet"
                    >
                      <img 
                        src={rewardsConfig.logoUrl || localStorage.getItem("sa_logo") || logoNew} 
                        alt="Rewards Logo" 
                        className="w-full h-full object-contain drop-shadow-xs" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        className="text-zinc-900 dark:text-white font-semibold text-[14px] sm:text-[15px] leading-snug mb-2 tracking-tight cursor-pointer"
                        onClick={handleStartRewardsFlow}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        Start earning rewards on every {rewardsConfig.orderPointsSubtitle ? rewardsConfig.orderPointsSubtitle.replace(/^on every /i, '') : 'order above ₹349'}!
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          const menuPath = window.location.pathname.startsWith('/food') ? '/food/user/menu' : '/user/menu';
                          navigate(menuPath);
                        }}
                        className="text-[var(--accent-red,#EE3A43)] font-semibold text-sm sm:text-[15px] hover:underline flex items-center gap-1 p-0 bg-transparent border-0 cursor-pointer"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <span>Order Now</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Pre-Enrollment State: Matching Reference Image 3 ── */
                  <div>
                    <div className="flex gap-3 sm:gap-4 items-center">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center p-0.5">
                        <img 
                          src={rewardsConfig.logoUrl || localStorage.getItem("sa_logo") || logoNew} 
                          alt="Rewards Logo" 
                          className="w-full h-full object-contain drop-shadow-xs" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-zinc-900 dark:text-white font-semibold text-[13px] sm:text-[14px] leading-snug mb-1 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {rewardsConfig.title || 'Earn Points to Unlock Free Treats!'}
                        </h3>
                        <div 
                          className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-[13px] space-y-0.5 font-normal"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          <p>{rewardsConfig.subtitle1 || '1 Order = 100 Points'}</p>
                          <p>{rewardsConfig.subtitle2 || 'Relish freebies at 600 points'}</p>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={handleStartRewardsFlow}
                      className="w-full mt-3.5 py-2.5 rounded-lg border-[1.5px] text-[13px] font-medium bg-transparent transition-colors active:scale-[0.98] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                      style={{ borderColor: 'var(--accent-red, #EE3A43)', color: 'var(--accent-red, #EE3A43)', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {rewardsConfig.buttonText || 'Enroll Now'}
                    </button>
                    <div 
                      className="text-center text-[10px] sm:text-[11px] text-zinc-600 dark:text-zinc-300 font-medium mt-2.5 whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {rewardsConfig.termsText || 'By enrolling you agree to our'}{" "}
                      <button 
                        type="button"
                        onClick={() => setIsTermsModalOpen(true)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline bg-transparent border-0 p-0 cursor-pointer"
                      >
                        {rewardsConfig.termsLinkText || 'Terms and Conditions'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Superadmin Coupons & Offers Section (matching Reference Image 2 with App Theme Color) */}
          {appConfig?.couponEnabled !== false && coupons && coupons.length > 0 && (
            <div className="mt-3 mb-4 select-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <div className="px-2 sm:px-3 mb-2.5">
                <h3 className="font-semibold text-zinc-900 dark:text-white text-[16px] sm:text-[17px] tracking-tight m-0 font-headline-sm-mobile">
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
                            <span className="material-symbols-outlined text-white text-[15px] font-semibold">
                              percent
                            </span>
                          </div>
                          <h4 className="font-semibold text-white text-sm sm:text-[15px] tracking-tight leading-tight truncate m-0">
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
            products={products}
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
              className={`fixed ${deliveryCardData && deliveryCardData.enabled !== false ? 'bottom-[118px]' : 'bottom-22 sm:bottom-24'} left-3.5 sm:left-5 z-40 w-11 h-11 rounded-full border border-zinc-200/90 dark:border-zinc-700 shadow-lg shadow-black/15 flex items-center justify-center text-zinc-700 dark:text-zinc-200 hover:text-[var(--accent-red,#EE3A43)] dark:hover:text-red-400 hover:scale-105 active:scale-95 transition-all cursor-pointer`}
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
          items={bottomNavItems}
        />

        {/* Product Customization Modal (Sizes, Crust, Toppings & Sticky Bottom Price Bar) */}
        <ProductCustomizeModal
          isOpen={Boolean(selectedProductForCustomize)}
          onClose={() => setSelectedProductForCustomize(null)}
          item={selectedProductForCustomize}
          onAddToCart={handleAddCustomizedToCart}
          isDarkMode={isDarkMode}
        />

        {/* User Profile Navigation Sidebar Drawer */}
        <UserSidebarDrawer
          isOpen={isProfileSidebarOpen}
          onClose={() => setIsProfileSidebarOpen(false)}
          isDarkMode={isDarkMode}
          onOpenDeliverOnTrain={() => setShowTrainModal(true)}
        />

        {/* Deliver on Train Modal */}
        <DeliverOnTrainModal
          show={showTrainModal}
          onClose={() => setShowTrainModal(false)}
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

        {/* Rewards & Wallet Loading Screen */}
        {showRewardsLoading && (
          <RewardsWalletLoading 
            onBack={handleCancelRewardsLoading} 
            categories={categories} 
          />
        )}

        {/* Rewards View (Previous UI) */}
        {showRewardsPage && (
          <PreviousRewardsView 
            onBack={() => setShowRewardsPage(false)} 
            initialTab="rewards" 
            rewardsConfig={rewardsConfig}
          />
        )}

        {/* Terms & Conditions Bottom Sheet Modal matching Image 1 */}
        <AnimatePresence>
          {isTermsModalOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end items-center touch-none">
              {/* Semi-transparent dark overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsTermsModalOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
              />

              {/* Floating circular close button centered directly above bottom sheet */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 mb-3"
              >
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(false)}
                  className="w-11 h-11 rounded-full bg-zinc-200/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border border-white/20"
                  aria-label="Close Terms and Conditions"
                >
                  <X className="w-5 h-5 stroke-[2.5]" />
                </button>
              </motion.div>

              {/* Bottom Sheet Card */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl flex flex-col max-h-[75vh] overflow-hidden touch-auto"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <div className="px-6 pt-5 pb-3">
                  <h3 className="text-[17px] sm:text-lg font-semibold text-zinc-900 dark:text-white tracking-tight m-0">
                    Terms & Conditions
                  </h3>
                </div>

                <div className="px-6 pb-6 overflow-y-auto overscroll-contain space-y-3.5 hide-scrollbar">
                  {(Array.isArray(rewardsConfig?.terms) && rewardsConfig.terms.length > 0
                    ? rewardsConfig.terms
                    : DEFAULT_REWARD_TERMS
                  ).map((term, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-zinc-600 dark:text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
                      <span className="text-zinc-400 font-semibold text-sm leading-none mt-0.5 select-none shrink-0">•</span>
                      <p className="flex-1 m-0">{term}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
