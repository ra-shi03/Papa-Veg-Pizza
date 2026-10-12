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
import { CampaignSection } from "./components/dynamic/CampaignSection"
import { CouponDetailsModal } from "./components/dynamic/CouponDetailsModal"
import apiClient from "@/services/api/axios"


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

  const [showAllCategories, setShowAllCategories] = useState(false);

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

  // Removed orderMethods state

  // Dynamic Logo State
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew)

  // Dynamic Categories State
  const [categories, setCategories] = useState([]);
  

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
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : false
  })
  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add("dark")
      localStorage.setItem("appTheme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("appTheme", "light")
    }
  }, [isDarkMode])

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
        }
      } catch (err) {
        console.warn("Failed to load home page dynamic config:", err)
      }
    }

    const fetchCategoryProducts = async () => {
      try {
        const res = await apiClient.get('/food/admin/menu/public');
        if (res?.data?.data) {
          const { categories: cats, products: prods, sections: secs } = res.data.data;
          
          if (cats && cats.length > 0) {
            const uniqueCatsMap = new Map();
            cats.forEach(c => {
              const labelRaw = c.label || c.name;
              if (!labelRaw) return;
              const label = labelRaw.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              if (!uniqueCatsMap.has(label)) {
                uniqueCatsMap.set(label, {
                  id: c._id || c.id,
                  label: label,
                  icon: c.icon || c.image || 'local_pizza'
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
            setActiveCategory(prev => prev === "pizza" ? parsedCats[0].id : prev);
          }
          
          if (secs && secs.length > 0) {
            setSections(secs.map(s => ({
              id: s._id || s.id,
              categoryId: s.categoryId,
              name: s.name,
              slug: s.slug
            })));
          }

          if (prods && prods.length > 0) {
            setProducts(prods.map(p => ({
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
    fetchRewards();
    fetchHomeConfig()
    fetchCategoryProducts()
    fetchDynamicLayout()

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
    fetchHomeConfig()
      }
    }

    window.addEventListener("homePageConfigUpdated", handleConfigUpdate)
    window.addEventListener("storage", handleConfigUpdate)

    return () => {
      window.removeEventListener("homePageConfigUpdated", handleConfigUpdate)
      window.removeEventListener("storage", handleConfigUpdate)
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
            const parsed = JSON.parse(superadmin).filter(c => c.status === "active")
            if (parsed.length > 0) {
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
            const activeCats = parsed.filter(c => c.status === "Active");
            const uniqueCatsMap = new Map();
            activeCats.forEach(c => {
              const labelRaw = c.name;
              if (!labelRaw) return;
              const label = labelRaw.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
              
              if (!uniqueCatsMap.has(label)) {
                const lower = c.name.toLowerCase();
                let icon = "local_pizza";
                if (lower.includes("burger")) icon = "lunch_dining";
                else if (lower.includes("bread") || lower.includes("side")) icon = "bakery_dining";
                else if (lower.includes("pasta")) icon = "dinner_dining";
                else if (lower.includes("dessert") || lower.includes("sweet")) icon = "icecream";
                else if (lower.includes("drink") || lower.includes("beverage")) icon = "local_drink";
                
                uniqueCatsMap.set(label, {
                  id: c.slug || label.toLowerCase().replace(/\s+/g, "-"),
                  label: label,
                  icon
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

    window.addEventListener("franchise_banners_changed", handleBannersSync)
    window.addEventListener("pvp_banners_changed", handleBannersSync)
    window.addEventListener("franchise_coupons_changed", handleOffersSync)
    window.addEventListener("pvp_coupons_changed", handleOffersSync)
    window.addEventListener("systemThemeChanged", handleBrandingSync)
    window.addEventListener("pvp_categories_changed", handleCategoriesSync)
    window.addEventListener("pvp_products_changed_v2", handleProductsSync)

    return () => {
      window.removeEventListener("franchise_banners_changed", handleBannersSync)
      window.removeEventListener("pvp_banners_changed", handleBannersSync)
      window.removeEventListener("franchise_coupons_changed", handleOffersSync)
      window.removeEventListener("pvp_coupons_changed", handleOffersSync)
      window.removeEventListener("systemThemeChanged", handleBrandingSync)
      window.removeEventListener("pvp_categories_changed", handleCategoriesSync)
      window.removeEventListener("pvp_products_changed_v2", handleProductsSync)
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
              <div className="grid grid-cols-3 gap-x-4 gap-y-6 pb-2 pr-4">
                {(showAllCategories ? categories : categories.slice(0, 12)).map(cat => (
                  <div 
                    key={cat.id} 
                    className="flex flex-col items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => {
                       setActiveCategory(cat.id);
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
                    <span className="text-[13px] font-bold text-zinc-700 text-center w-full truncate">
                      {cat.label}
                    </span>
                  </div>
                ))}
              </div>
              {categories.length > 12 && !showAllCategories && (
                <div className="flex justify-center mt-3 pr-4">
                  <button 
                    onClick={() => setShowAllCategories(true)}
                    className="text-[var(--primary)] font-bold text-sm bg-transparent px-5 py-2 flex items-center gap-1 active:scale-95 transition-transform"
                  >
                    More <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dynamic Rewards Section */}
          {rewardsConfig && rewardsConfig.isEnabled && (
            <div className="px-margin-mobile mt-2 mb-4">
              <div className="bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.06)] border border-black/5 p-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="flex gap-4 items-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center p-2">
                    {rewardsConfig.logoUrl ? (
                      <img src={rewardsConfig.logoUrl} alt="Rewards Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="text-[10px] text-zinc-400 text-center">No Logo</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-zinc-800 font-bold text-sm sm:text-[15px] leading-snug mb-1.5">
                      {rewardsConfig.title}
                    </h3>
                    <div className="text-zinc-500 text-xs sm:text-[13px] space-y-0.5">
                      <p>{rewardsConfig.subtitle1}</p>
                      <p>{rewardsConfig.subtitle2}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => triggerToast("Enrollment coming soon!")}
                  className="w-full mt-4 py-2.5 rounded-lg border-[1.5px] text-[13px] font-bold bg-white transition-colors active:scale-[0.98]"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  {rewardsConfig.buttonText}
                </button>
                <div className="text-center text-[10px] text-zinc-400 mt-2.5">
                  {rewardsConfig.termsText} <a href={rewardsConfig.termsLink} className="text-blue-600 font-medium hover:underline">{rewardsConfig.termsLinkText}</a>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic API Sections Removed as per request */}

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
            if (offer.actionType === 'open_url') {
              window.open(offer.actionValue, '_blank');
            } else if (offer.actionType === 'apply_coupon') {
              navigate('/user/offers');
              triggerToast(`Coupon ${offer.actionValue || offer.couponCode || ''} applied!`);
            } else if (offer.actionType === 'open_product' && offer.actionValue) {
              navigate(`/user/product/${offer.actionValue}`);
            } else if (offer.actionType === 'open_category' && offer.actionValue) {
              setActiveCategory(offer.actionValue);
              triggerToast(`Opening category...`);
            } else {
              triggerToast(`Action: ${offer.actionType}`);
            }
          }}
          isDarkMode={isDarkMode}
        />

      </div>
    </div>
  )
}
