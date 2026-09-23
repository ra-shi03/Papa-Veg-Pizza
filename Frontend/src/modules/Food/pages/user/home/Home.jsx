import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import DeliveryMapModal from "@food/components/user/DeliveryMapModal"
import DeliveryOrCollectionModal from "@food/components/user/DeliveryOrCollectionModal"
import TakeawayMapModal from "@food/components/user/TakeawayMapModal"
import DeliverOnTrainModal from "@food/components/user/DeliverOnTrainModal"
import OrderDetailsFlow from "@food/pages/user/orders/OrderDetailsFlow"
import { useLocationStore } from "@food/store/locationStore"
import { useLocationGuard } from "@food/hooks/useLocationGuard"
import logoNew from "@/assets/logo1.png"
import { PRODUCTS, DEALS } from "./HomeData"
import { InCarModal } from "./components/InCarModal"
import { HomeStyles } from "./components/HomeStyles"
import { HomeHeader } from "./components/HomeHeader"
import { OrderMethods } from "./components/OrderMethods"
import { HomeSections } from "./components/HomeSections"


export default function Home() {
  const navigate = useNavigate()
  const { isModalOpen, closeLocationModal, confirmLocation, locationConfirmed } = useLocationStore()
  const checkLocation = useLocationGuard()
  const dealsRef = useRef(null)
  const [activeDeal, setActiveDeal] = useState(null)

  // Dynamic Banners State
  const [banners, setBanners] = useState(() => {
    try {
      const local = localStorage.getItem("franchise_admin_banners")
      if (local) {
        const parsed = JSON.parse(local).filter(b => b.status === "active")
        if (parsed.length > 0) return parsed
      }
    } catch (e) {}

    try {
      const superadmin = localStorage.getItem("pvp_banners")
      if (superadmin) {
        const parsed = JSON.parse(superadmin).filter(b => b.isActive)
        if (parsed.length > 0) return parsed
      }
    } catch (e) {}

    return [
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
  })

  // Dynamic Deals State
  const [deals, setDeals] = useState(() => {
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
    } catch (e) {}

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
    } catch (e) {}

    return DEALS
  })

  // Dynamic Order Methods State
  const [orderMethods, setOrderMethods] = useState(() => {
    const defaultMethods = [
      { id: "delivery", label: "Delivery", icon: "moped", enabled: true },
      { id: "takeaway", label: "Takeaway", icon: "store", enabled: true },
      { id: "incar", label: "In-Car", icon: "directions_car", enabled: true },
      { id: "train", label: "Delivery on Train", icon: "train", enabled: true }
    ];
    try {
      const stored = localStorage.getItem("pvp_order_methods");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return defaultMethods;
  });

  // Dynamic Logo State
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew)

  // Dynamic Categories State
  const [categories, setCategories] = useState(() => {
    const defaultCats = [
      { id: "pizza", label: "Pizza", icon: "local_pizza" },
      { id: "burger", label: "Burger", icon: "lunch_dining" },
      { id: "bread", label: "Bread", icon: "bakery_dining" },
      { id: "pasta", label: "Pasta", icon: "dinner_dining" },
      { id: "desserts", label: "Desserts", icon: "icecream" },
      { id: "drinks", label: "Drinks", icon: "local_drink" }
    ];
    try {
      const stored = localStorage.getItem("pvp_categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          return parsed.filter(c => c.status === "Active").map(c => {
            const lower = c.name.toLowerCase();
            let icon = "local_pizza";
            if (lower.includes("burger")) icon = "lunch_dining";
            else if (lower.includes("bread") || lower.includes("side")) icon = "bakery_dining";
            else if (lower.includes("pasta")) icon = "dinner_dining";
            else if (lower.includes("dessert") || lower.includes("sweet")) icon = "icecream";
            else if (lower.includes("drink") || lower.includes("beverage")) icon = "local_drink";
            return {
              id: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
              label: c.name,
              icon
            };
          });
        }
      }
    } catch (e) {}
    return defaultCats;
  });

  // Dynamic Products State
  const [products, setProducts] = useState(() => {
    const defaultProds = PRODUCTS;
    try {
      const stored = localStorage.getItem("pvp_products");
      if (stored) {
        const parsed = JSON.parse(stored).filter(p => p.status === "Active");
        if (parsed.length > 0) {
          const mapped = parsed.map(p => ({
            id: p.id || `prod-${p.name.toLowerCase().replace(/\s+/g, "-")}`,
            title: p.name,
            price: typeof p.price === 'string' ? parseInt(p.price.replace(/[^\d]/g, ""), 10) || 299 : p.price || 299,
            rating: p.rating || 4.5,
            description: p.description || `${p.name} prepared fresh with premium toppings.`,
            image: p.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
            category: p.category
          }));
          const merged = [...defaultProds];
          mapped.forEach(mp => {
            if (!merged.some(dp => dp.title.toLowerCase() === mp.title.toLowerCase())) {
              merged.push(mp);
            }
          });
          return merged;
        }
      }
    } catch (e) {}
    return defaultProds;
  });

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
    return savedTheme ? savedTheme === "dark" : true
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

  // Map & Store Modal States
  const [showMapModal, setShowMapModal] = useState(false)
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [showTrainModal, setShowTrainModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("deliveryAddress") || "") : ""
  })
  const [takeawayHut, setTakeawayHut] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("takeawayHut") || "") : ""
  })
  const [carNumber, setCarNumber] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("carNumber") || "") : ""
  })

  // Sync local location state with global location confirmation changes
  useEffect(() => {
    if (locationConfirmed) {
      setDeliveryAddress(localStorage.getItem("deliveryAddress") || "")
      setTakeawayHut(localStorage.getItem("takeawayHut") || "")
      setCarNumber(localStorage.getItem("carNumber") || "")
    } else {
      setDeliveryAddress("")
      setTakeawayHut("")
      setCarNumber("")
    }
  }, [locationConfirmed])

  // Redirect to welcome screen if guest, or profile creation if profile is incomplete
  useEffect(() => {
    const welcomeShown = localStorage.getItem("papa_veg_welcome_shown")
    const isAuthenticated = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
    if (isAuthenticated) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "{}")
        if (storedUser.name) {
          setUserName(storedUser.name)
        }
        if (!storedUser.profileCompleted) {
          navigate("/user/profile/create", { replace: true })
          return
        }
      } catch (e) {
        console.error("Failed to parse user profile status", e)
      }
    } else if (!welcomeShown) {
      navigate("/welcome")
    }
  }, [navigate])

  // Sync global location modal open state with local modal trigger
  useEffect(() => {
    if (isModalOpen) {
      setShowServiceSelector(true)
    } else {
      setShowServiceSelector(false)
    }
  }, [isModalOpen])

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

  // Sync States dynamically from events/localStorage updates
  useEffect(() => {
    const handleBannersSync = () => {
      let list = []
      try {
        const local = localStorage.getItem("franchise_admin_banners")
        if (local) {
          list = JSON.parse(local).filter(b => b.status === "active")
        }
      } catch (e) {}

      if (list.length === 0) {
        try {
          const superadmin = localStorage.getItem("pvp_banners")
          if (superadmin) {
            list = JSON.parse(superadmin).filter(b => b.isActive)
          }
        } catch (e) {}
      }

      if (list.length > 0) {
        setBanners(list)
      }
    }

    const handleDealsSync = () => {
      let list = []
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
      } catch (e) {}

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
        } catch (e) {}
      }

      if (list.length > 0) {
        setDeals(list)
      }
    }

    const handleOrderMethodsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_order_methods")
        if (stored) {
          setOrderMethods(JSON.parse(stored))
        }
      } catch (e) {}
    }

    const handleBrandingSync = () => {
      setLogoUrl(localStorage.getItem("sa_logo") || logoNew)
    }

    const handleCategoriesSync = () => {
      try {
        const stored = localStorage.getItem("pvp_categories")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.length > 0) {
            setCategories(parsed.filter(c => c.status === "Active").map(c => {
              const lower = c.name.toLowerCase();
              let icon = "local_pizza";
              if (lower.includes("burger")) icon = "lunch_dining";
              else if (lower.includes("bread") || lower.includes("side")) icon = "bakery_dining";
              else if (lower.includes("pasta")) icon = "dinner_dining";
              else if (lower.includes("dessert") || lower.includes("sweet")) icon = "icecream";
              else if (lower.includes("drink") || lower.includes("beverage")) icon = "local_drink";
              return {
                id: c.slug || c.name.toLowerCase().replace(/\s+/g, "-"),
                label: c.name,
                icon
              };
            }))
          }
        }
      } catch (e) {}
    }

    const handleProductsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_products")
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
      } catch (e) {}
    }

    window.addEventListener("franchise_banners_changed", handleBannersSync)
    window.addEventListener("pvp_banners_changed", handleBannersSync)
    window.addEventListener("franchise_coupons_changed", handleDealsSync)
    window.addEventListener("pvp_coupons_changed", handleDealsSync)
    window.addEventListener("pvp_order_methods_changed", handleOrderMethodsSync)
    window.addEventListener("systemThemeChanged", handleOrderMethodsSync)
    window.addEventListener("systemThemeChanged", handleBrandingSync)
    window.addEventListener("pvp_categories_changed", handleCategoriesSync)
    window.addEventListener("pvp_products_changed", handleProductsSync)

    return () => {
      window.removeEventListener("franchise_banners_changed", handleBannersSync)
      window.removeEventListener("pvp_banners_changed", handleBannersSync)
      window.removeEventListener("franchise_coupons_changed", handleDealsSync)
      window.removeEventListener("pvp_coupons_changed", handleDealsSync)
      window.removeEventListener("pvp_order_methods_changed", handleOrderMethodsSync)
      window.removeEventListener("systemThemeChanged", handleOrderMethodsSync)
      window.removeEventListener("systemThemeChanged", handleBrandingSync)
      window.removeEventListener("pvp_categories_changed", handleCategoriesSync)
      window.removeEventListener("pvp_products_changed", handleProductsSync)
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
      navigate("/user/deals")
      triggerToast("Opening deals...")
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
        <HomeHeader deliveryAddress={deliveryAddress} />

        {/* Main Content */}
        <main className="space-y-lg mt-2">
          {/* Hero Banner Carousel */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative h-[260px] mx-2 overflow-hidden rounded-[24px] shadow-lg border border-black/5 dark:border-white/5"
          >
            <div className="carousel-track flex h-full" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {banners.map((b) => (
                <div 
                  key={b._id} 
                  className="min-w-full h-full relative group cursor-pointer"
                  onClick={() => handleBannerClick(b)}
                >
                  <img className="w-full h-full object-cover" alt={b.title} src={b.mobileImageUrl || b.imageUrl || b.image || b.bannerUrl} />
                  {/* Deeper gradient overlay to guarantee readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex flex-col justify-end p-5">
                    {(b.bannerType || b.subtitle) && (
                      <span className="bg-[#E53935] text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md w-fit mb-1.5 shadow-sm">
                        {b.bannerType || "Offer"}
                      </span>
                    )}
                    <h2 className="font-headline-lg-mobile text-white text-base font-black leading-tight" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                      {b.title}
                    </h2>
                    {b.subtitle && (
                      <p className="text-zinc-200 text-[10px] font-medium mt-1 leading-snug line-clamp-2 max-w-[85%]" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
                        {b.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Indicators */}
            <div className="absolute bottom-4 right-margin-mobile flex gap-2">
              {banners.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${activeSlide === i ? "w-8 bg-primary" : "w-2 bg-white/30"}`}></div>
              ))}
            </div>
          </motion.section>


          {/* Order Details Flow (Confirmation Bar) */}
          {locationConfirmed && activeService === "delivery" && (
            <OrderDetailsFlow
              confirmedAddress={deliveryAddress}
              onOpenMap={() => setShowMapModal(true)}
              onClearCart={() => setCart({})}
              isDarkMode={isDarkMode}
              triggerToast={triggerToast}
            />
          )}

          {/* Delivery/Takeaway Toggle */}
          <OrderMethods
            orderMethods={orderMethods}
            activeService={activeService}
            setActiveService={setActiveService}
            setShowMapModal={setShowMapModal}
            setShowStoreModal={setShowStoreModal}
            setShowCarModal={setShowCarModal}
            setShowTrainModal={setShowTrainModal}
            triggerToast={triggerToast}
            isDarkMode={isDarkMode}
          />

          <HomeSections
            deals={deals}
            categories={categories}
            products={products}
            activeCategory={activeCategory}
            favorites={favorites}
            isDarkMode={isDarkMode}
            checkLocation={checkLocation}
            triggerToast={triggerToast}
            toggleFavorite={toggleFavorite}
            addToCart={addToCart}
            dealsRef={dealsRef}
          />
          {/* Fresh Ingredients */}
          <motion.section
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 90, damping: 15 }}
            className="px-margin-mobile"
          >
            <div className={`rounded-3xl p-lg flex items-center justify-between overflow-hidden relative border ${isDarkMode
              ? "glass-card"
              : "bg-gradient-to-br from-[#FFF5F4] to-[#FFF0EF] border-[#E53935]/15 shadow-md shadow-[#E53935]/4"
              }`}>
              <div className="z-10 relative">
                <h3 className={`font-headline-lg-mobile mb-xs ${isDarkMode ? "text-white" : "text-[#131313]"}`}>Fresh Every Day</h3>
                <p className={`text-sm opacity-70 max-w-[180px] leading-relaxed ${isDarkMode ? "text-white" : "text-[#131313]"}`}>We use only organic, farm-fresh ingredients for every slice.</p>
              </div>
              <img
                className="w-24 h-24 object-contain absolute -right-2 top-1/2 -translate-y-1/2 rotate-12 opacity-80"
                alt="Artistic composition of fresh pizza ingredients"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1OEevU-AMD-LJYtmmUO8f5cPZOOwP27nnnprt609tr-eBMiasAVzva-eAXdhfwQY7tK7Xgg5R0BHy0w-eGZW9kVqF3dGZDXkS_2vyUl8J6qH8acyu16XScqO6ZrPCmGXSfO6c_8ekCjNHuv7n4dGgaCqasfj8IGqDCofCk882RgeDO5By7o4YueW5s1bJXaOjmYQ9JscQ9bIlNkTfdR0xZz2KfAENhcrnWxlgDy9acrKF6ZMgVxRZJqeZOUz2NJRDxMhXqdJ7nJOk"
              />
            </div>
          </motion.section>
        </main>

        {/* Floating Action Button */}
        {totalCartCount > 0 && locationConfirmed && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-45">
            <button
              onClick={() => {
                navigate("/user/cart")
                triggerToast("Opening your cart...")
              }}
              className="absolute right-4 bottom-0 pointer-events-auto w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_0_20px_rgba(229,57,53,0.4)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-on-primary-container rounded-full text-[10px] font-bold flex items-center justify-center border border-primary animate-bounce">
                {totalCartCount}
              </div>
            </button>
          </div>
        )}

        {/* BottomNavBar */}
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[360px] z-50 rounded-full bg-[#FAF9F6]/90 dark:bg-zinc-950/95 backdrop-blur-xl border border-black/5 dark:border-white/5 shadow-[0_16px_36px_rgba(0,0,0,0.15)] flex justify-around items-center h-[68px] px-2 m-0">
          <button
            onClick={() => {
              if (window.location.pathname === "/user" || window.location.pathname === "/user/") {
                window.scrollTo({ top: 0, behavior: "smooth" })
              } else {
                navigate("/user")
              }
              triggerToast("Opening Home")
            }}
            className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
          >
            <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-[#E53935]/10 text-[#E53935] dark:bg-[#E53935]/20">
              <span className="material-symbols-outlined text-[22px] fill" style={{ fontVariationSettings: " 'FILL' 1 " }}>home</span>
            </div>
            <span className="text-[10px] font-bold tracking-wide text-[#E53935]">Home</span>
          </button>
          <button
            onClick={() => {
              navigate("/user/menu")
              triggerToast("Opening Menu")
            }}
            className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
          >
            <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-transparent text-zinc-500 dark:text-zinc-400 group-hover:bg-black/5 dark:group-hover:bg-white/5">
              <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">Menu</span>
          </button>
          <button
            onClick={() => {
              navigate("/user/account")
              triggerToast("Opening Account")
            }}
            className="flex flex-col items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer bg-transparent border-0 outline-none group"
          >
            <div className="w-14 h-8 rounded-full flex items-center justify-center mb-0.5 transition-all duration-300 bg-transparent text-zinc-500 dark:text-zinc-400 group-hover:bg-black/5 dark:group-hover:bg-white/5">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200">Account</span>
          </button>
        </nav>

        {/* Delivery Map Modal Selector */}
        <DeliveryMapModal
          show={showMapModal}
          onClose={() => setShowMapModal(false)}
          deliveryAddress={deliveryAddress}
          setDeliveryAddress={setDeliveryAddress}
          setActiveService={setActiveService}
          triggerToast={triggerToast}
          isDarkMode={isDarkMode}
        />

        {/* Delivery or Collection Selection Modal */}
        <DeliveryOrCollectionModal
          show={showServiceSelector}
          onClose={() => {
            setShowServiceSelector(false)
            if (isModalOpen) closeLocationModal()
          }}
          onSelect={(id) => {
            if (id === "delivery") {
              if (!deliveryAddress) {
                setDeliveryAddress("Joshi Colony, Bk Sindhi Colony, Indore, Indore")
              }
              setShowMapModal(true)
            } else if (id === "takeaway") {
              setShowStoreModal(true)
            } else if (id === "incar") {
              setShowCarModal(true)
            } else if (id === "train") {
              setShowTrainModal(true)
            }
          }}
          isDarkMode={isDarkMode}
        />
        {/* Takeaway Map Modal Selector */}
        <TakeawayMapModal
          show={showStoreModal}
          onClose={() => setShowStoreModal(false)}
          takeawayHut={takeawayHut}
          setTakeawayHut={setTakeawayHut}
          setActiveService={setActiveService}
          triggerToast={triggerToast}
          isDarkMode={isDarkMode}
          confirmedAddress={deliveryAddress}
        />

        {/* In-Car Details Modal */}
        <InCarModal
          showCarModal={showCarModal}
          setShowCarModal={setShowCarModal}
          carNumber={carNumber}
          setCarNumber={setCarNumber}
          confirmLocation={confirmLocation}
          triggerToast={triggerToast}
        />

        {/* Deliver on Train Modal */}
        <DeliverOnTrainModal
          show={showTrainModal}
          onClose={() => setShowTrainModal(false)}
        />
      </div>
    </div>
  )
}
