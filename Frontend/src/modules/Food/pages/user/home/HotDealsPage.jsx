import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import DeliveryMapModal from "@food/components/user/DeliveryMapModal"
import DeliveryOrCollectionModal from "@food/components/user/DeliveryOrCollectionModal"
import { useLocationStore } from "@food/store/locationStore"
import { useLocationGuard } from "@food/hooks/useLocationGuard"

const DETAILED_DEALS = [
  {
    id: "deal-bogo",
    badge: "Bestseller",
    title: "BOGO: Any Medium Pizza",
    description: "Buy 1 Get 1 Free on all medium signature vegetable pizzas. Fresh crust, premium toppings, loaded mozzarella.",
    badgeColor: "bg-[#E53935]",
    coupon: "BOGOVEG",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "deal-feast",
    badge: "Value Combo",
    title: "Family Feast Combo",
    description: "2 Large Signature Pizzas + Garlic Bread Stix + 2L Ice-Cold Beverage. Serves 4-5 loaded with culinary joy.",
    badgeColor: "bg-[#00C853]",
    coupon: "FAMFEAST",
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "deal-student",
    badge: "Hot Offer",
    title: "Student Special Discount",
    description: "Flat 25% Off on all standalone menu items on presenting a valid student ID card during coach delivery or pickup.",
    badgeColor: "bg-[#FF6B35]",
    coupon: "STUDENT25",
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=80"
  },
  {
    id: "deal-midnight",
    badge: "Midnight Specials",
    title: "Midnight Hunger Busters",
    description: "Flat ₹100 Off on orders above ₹499 during late night shifts. Fuel your study or gaming session beautifully.",
    badgeColor: "bg-[#7c3aed]",
    coupon: "NIGHTOWL",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80"
  }
]

export default function HotDealsPage() {
  const navigate = useNavigate()
  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })
  const { isModalOpen, closeLocationModal, confirmLocation, locationConfirmed } = useLocationStore()
  const checkLocation = useLocationGuard()

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
            title: c.title,
            description: c.description || `Get ${c.discountValue}% discount.`,
            badgeColor: "bg-[#E53935]",
            coupon: c.couponCode,
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80"
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
            title: c.title,
            description: c.description || `Get ${c.value}% discount.`,
            badgeColor: "bg-[#E53935]",
            coupon: c.code,
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80"
          }))
        }
      }
    } catch (e) {}

    return DETAILED_DEALS;
  })

  useEffect(() => {
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
              title: c.title,
              description: c.description || `Get ${c.discountValue}% discount.`,
              badgeColor: "bg-[#E53935]",
              coupon: c.couponCode,
              image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80"
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
                title: c.title,
                description: c.description || `Get ${c.value}% discount.`,
                badgeColor: "bg-[#E53935]",
                coupon: c.code,
                image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80"
              }))
            }
          }
        } catch (e) {}
      }

      if (list.length > 0) {
        setDeals(list)
      }
    }

    window.addEventListener("franchise_coupons_changed", handleDealsSync)
    window.addEventListener("pvp_coupons_changed", handleDealsSync)
    return () => {
      window.removeEventListener("franchise_coupons_changed", handleDealsSync)
      window.removeEventListener("pvp_coupons_changed", handleDealsSync)
    }
  }, [])

  const [toast, setToast] = useState({ visible: false, message: "" })
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("deliveryAddress") || "") : ""
  })
  const [takeawayHut, setTakeawayHut] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("takeawayHut") || "") : ""
  })
  const [carNumber, setCarNumber] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("carNumber") || "") : ""
  })
  const [activeService, setActiveService] = useState(localStorage.getItem("activeService") || "delivery")

  // Sync global location modal open state with local modal trigger
  useEffect(() => {
    if (isModalOpen) {
      setShowServiceSelector(true)
    } else {
      setShowServiceSelector(false)
    }
  }, [isModalOpen])

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

  const triggerToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 2500)
  }

  // Load fonts and icons
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

  const copyCoupon = (code) => {
    navigator.clipboard.writeText(code)
    triggerToast(`Coupon Code "${code}" copied to clipboard!`)
  }

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
      <div className={`w-full max-w-md min-h-screen pb-32 font-body-md overflow-x-hidden relative shadow-2xl border-x ${
        isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
      }`} style={{ backgroundColor: isDarkMode ? "#111111" : "#fbf9f8", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}>
      {/* CSS overrides to keep design exact */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"} !important;
        }
        .font-headline-lg-mobile {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 700 !important;
          font-size: 28px !important;
          line-height: 34px !important;
        }
        .font-body-md {
          font-family: 'Inter', sans-serif !important;
          font-size: 16px !important;
          line-height: 24px !important;
          font-weight: 400 !important;
        }
        .font-label-sm {
          font-family: 'Inter', sans-serif !important;
          font-size: 12px !important;
          line-height: 16px !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .text-on-primary {
          color: #ffffff !important;
        }
        .bg-surface\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface\/90 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.9)" : "rgba(255, 255, 255, 0.9)"} !important;
        }
        .bg-surface {
          background-color: ${isDarkMode ? "#131313" : "#ffffff"} !important;
        }
        .border-white\/10 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }
        .border-white\/12 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"} !important;
        }
        .bg-white\/5 {
          background-color: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"} !important;
        }
        .text-white\/70 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(19, 19, 19, 0.7)"} !important;
        }
        .text-white\/50 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(19, 19, 19, 0.5)"} !important;
        }
        .bg-black\/40 {
          background-color: ${isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.5)"} !important;
        }
        .bg-white\/10 {
          background-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"} !important;
        }
        `
      }} />

      {/* Custom Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl glass-card font-label-sm text-xs border border-white/20 animate-bounce">
          {toast.message}
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-45 bg-surface/90 backdrop-blur-xl border-b border-white/10 h-16 flex items-center justify-between px-5 transition-colors duration-300">
        <button
          onClick={() => navigate("/user")}
          className={`material-symbols-outlined hover:opacity-85 active:scale-95 cursor-pointer bg-transparent border-0 outline-none ${isDarkMode ? "text-white" : "text-[#131313]"}`}
        >
          arrow_back
        </button>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#E53935] text-2xl font-bold">local_offer</span>
          <span className={`font-headline-lg-mobile text-lg font-black tracking-tight ${isDarkMode ? "text-white" : "text-[#131313]"}`}>Active Hot Deals</span>
        </div>
        <div className="w-8"></div>
      </header>

      {/* Deals list wrapper */}
      <main className="mt-20 px-4 space-y-6 max-w-lg mx-auto pt-2">
        {/* Add your location option card */}
        <div
          onClick={() => {
            if (!locationConfirmed) {
              setShowServiceSelector(true)
            } else {
              setShowMapModal(true)
            }
          }}
          className="glass-card rounded-[24px] p-2 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-white/12 hover:bg-white/10"
        >
          <div className="flex items-center gap-4">
            {/* Pizza icon container */}
            <div className="w-12 h-12 rounded-full border-2 border-[#E53935]/30 bg-[#E53935]/5 flex items-center justify-center text-[#E53935]">
              <span className="material-symbols-outlined text-[16px]">local_pizza</span>
            </div>
            <div className="text-left space-y-0.5">
              <h3 className={`font-bold text-base leading-snug ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                {locationConfirmed ? "Delivering to:" : "Add your location"}
              </h3>
              <p className={`text-xs line-clamp-1 max-w-[220px] ${isDarkMode ? "text-zinc-400" : "text-zinc-600"}`}>
                {locationConfirmed ? (deliveryAddress || takeawayHut || carNumber) : "See your local deals and pizzas"}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-md text-[#E53935]">
            arrow_forward_ios
          </span>
        </div>

        <section className="space-y-6">
          {deals.map((deal) => (
            <div key={deal.id || deal.coupon} className="glass-card rounded-3xl overflow-hidden flex flex-col border border-white/12">

              {/* Deal Card Header Banner image */}
              <div className="relative h-44 bg-zinc-950">
                <img
                  className="w-full h-full object-cover"
                  alt={deal.title}
                  src={deal.image}
                />
                <span className={`absolute top-4 left-4 ${deal.badgeColor} text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider shadow`}>
                  {deal.badge}
                </span>
              </div>

              {/* Deal Card Details info */}
              <div className="p-5 space-y-3">
                <h3 className={`font-headline-md-mobile text-lg leading-tight ${isDarkMode ? "text-white" : "text-[#131313]"}`}>{deal.title}</h3>
                <p className="text-xs opacity-60 leading-relaxed">{deal.description}</p>

                {/* Coupon Code section */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div className="text-left">
                    <span className="text-[9px] uppercase opacity-50 font-bold tracking-wider">Use Coupon Code</span>
                    <p className="font-headline-md-mobile text-sm tracking-widest text-[#FF6B35] font-black leading-none mt-1">
                      {deal.coupon}
                    </p>
                  </div>
                  <button
                    onClick={() => copyCoupon(deal.coupon)}
                    className={`h-9 px-3 bg-white/10 hover:bg-white/15 rounded-xl font-label-sm text-[10px] uppercase font-bold cursor-pointer border-0 active:scale-95 transition-all ${isDarkMode ? "text-white" : "text-[#131313]"}`}
                  >
                    Copy Code
                  </button>
                </div>

                {/* Claim action CTA button */}
                <button
                  onClick={() => checkLocation(() => {
                    triggerToast(`Promo "${deal.coupon}" claimed successfully!`);
                  })}
                  className="w-full mt-4 h-12 bg-[#E53935] hover:bg-red-700 text-white rounded-xl font-label-sm text-xs uppercase font-extrabold cursor-pointer border-0 transition-all shadow-[0_0_12px_rgba(229,57,53,0.3)]"
                >
                  Claim & Add Promo
                </button>
              </div>
            </div>
          ))}
        </section>
      </main>

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
            navigate("/user/deliver-on-train")
          }
        }}
        isDarkMode={isDarkMode}
      />

      {/* Takeaway Store Finder Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left bg-[#131313] border border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-lg text-white">Find your nearest hut</h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
              >
                close
              </button>
            </div>
            <p className="text-xs opacity-60 leading-relaxed text-white">
              We suggested the following Pizza Veg Huts near your coordinates:
            </p>

            {/* Store List Options */}
            <div className="space-y-3">
              {[
                { id: "hut-cp", name: "Pizza Veg Hut - Connaught Place", dist: "0.8 km", status: "Open Now", hours: "11 AM - 11 PM" },
                { id: "hut-kb", name: "Pizza Veg Hut - Karol Bagh", dist: "2.1 km", status: "Open Now", hours: "11 AM - 11 PM" },
                { id: "hut-sk", name: "Pizza Veg Hut - Saket Terminal", dist: "4.5 km", status: "Closed", hours: "Opens tomorrow" }
              ].map((store) => (
                <div
                  key={store.id}
                  onClick={() => {
                    setTakeawayHut(store.name)
                    confirmLocation({
                      address: store.name,
                      serviceType: "takeaway"
                    })
                    setShowStoreModal(false)
                    triggerToast(`Selected outlet: ${store.name}`)
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div className="text-left space-y-1">
                    <h4 className="text-xs font-bold text-white leading-tight">{store.name}</h4>
                    <div className="flex gap-2 text-[9px] font-bold">
                      <span className="text-[#00C853]">{store.status}</span>
                      <span className="opacity-50">•</span>
                      <span className="opacity-60">{store.hours}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] bg-[#E53935]/10 text-[#E53935] px-2 py-0.5 rounded font-black tracking-wide">{store.dist}</span>
                    <span className="material-symbols-outlined text-xs text-white/40">arrow_forward_ios</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-Car Details Modal */}
      {showCarModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left bg-[#131313] border border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-lg text-white">In-Car Dining</h3>
              <button
                onClick={() => setShowCarModal(false)}
                className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
              >
                close
              </button>
            </div>
            <p className="text-xs opacity-60 leading-relaxed text-white">
              Please enter your car number or vehicle registration details so we can deliver your hot pizza straight to your window:
            </p>

            {/* Input field */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider text-white">Car Number</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DL 3C AB 1234"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                  directions_car
                </span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={() => {
                const cleanCar = carNumber.trim()
                if (!cleanCar) {
                  triggerToast("Please enter a valid car number")
                  return
                }
                setCarNumber(cleanCar)
                confirmLocation({
                  address: cleanCar,
                  serviceType: "incar"
                })
                setShowCarModal(false)
                triggerToast("Car details confirmed!")
              }}
              className="w-full h-11 bg-primary text-on-primary font-bold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-lg active:scale-95 transition-all"
            >
              Confirm Vehicle
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
