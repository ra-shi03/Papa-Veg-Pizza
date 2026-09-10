import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Clock, Tag, ChevronRight, Gift, ChevronDown, ChevronUp } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import ApplyCoupon from "./ApplyCoupon"
import AddGiftCard from "./AddGiftCard"
import CheckoutModal from "./CheckoutModal"

const ALL_PRODUCTS = {
  "margherita-supreme": {
    id: "margherita-supreme",
    name: "Margherita Supreme",
    price: 299,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBluz4eCNAilJO6yR3_OFzJkONQMKo9XRScol5o2w_wqSUPMQDImok1wr4UrTbZd0tDM7eicy98AOUq9ORUm23pi_z6uJuyeKQ3_tMtGkycxVZqFNywk1nb7d0RmEboytoVC-L__LD3BvG4JNTz3ZyFOnr8AyX-1ztogKmbBa3797PAAs2KoxmP2fFsZ_kMnaS2D-lsv6J0g5sQojmKXNF9d470loeENjh89lAF_TJu4TG-lB2oxnC2s56TPYL6h1CjXGleROU_bDPc",
    description: "Buffalo mozzarella, San Marzano tomatoes, fresh basil."
  },
  "farmhouse-delight": {
    id: "farmhouse-delight",
    name: "Farmhouse Delight",
    price: 349,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6Rib9mlrsig1haXvSfhY1zS2NGAIwUFig_-dDDTjQXBRJ_hdwzvKhvSs4X_KczL-USNdycC0vnIVox-Oyrmt5zbOdPneq43yDpJwEWYB3CSCU5gL7rFmEitcAS-QChuUXgeCi6WJcn32uqxZfLupJCZNO4YVg04lB8Y1JIsHt8L0bgON_2RuBMVL02rBMhN5haheBGgLGmqbDG4wUP7bqztn0gWQKQQedaHRRZ14BMbnbI7P9oZaCYPYkXEol9_8DJ3BLamRCaUpO",
    description: "Mushrooms, onions, peppers, and sweet corn."
  },
  "fiery-schezwan": {
    id: "fiery-schezwan",
    name: "Fiery Schezwan Veggie",
    price: 299,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    description: "Fiery schezwan sauce, dynamic mozzarella, onions, sweet bell peppers, and fresh greens."
  },
  "smokey-bbq": {
    id: "smokey-bbq",
    name: "Smokey BBQ Veggie",
    price: 299,
    image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=80",
    description: "Rich smokey BBQ base, melted mozzarella, loaded red onions, golden sweet corn, and BBQ drizzle."
  },
  "paneer-makhni": {
    id: "paneer-makhni",
    name: "Paneer Makhni Masala",
    price: 299,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80",
    description: "Indian style Makhni sauce, premium marinated paneer cubes, capsicum, red onions, and tomatoes."
  },
  "overloaded-veggies": {
    id: "overloaded-veggies",
    name: "Overloaded Veggies",
    price: 299,
    image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=80",
    description: "Black olives, mushrooms, sweet corn, red onions, tri-color bell peppers, and jalapeños."
  },
  "crispy-veg-burger": {
    id: "crispy-veg-burger",
    name: "Crispy Veg Burger",
    price: 149,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80",
    description: "Crispy mixed vegetable patty, fresh lettuce, tomatoes, and creamy classic mayonnaise."
  },
  "spicy-paneer-burger": {
    id: "spicy-paneer-burger",
    name: "Spicy Paneer Burger",
    price: 189,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
    description: "Spicy marinated paneer patty, layered with spicy dressing, melted cheese, and sliced onions."
  },
  "garlic-bread-stix": {
    id: "garlic-bread-stix",
    name: "Garlic Bread Stix",
    price: 119,
    image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=80",
    description: "Freshly baked garlic bread sticks served warm with creamy dynamic dipping sauce."
  },
  "cheese-garlic-bread": {
    id: "cheese-garlic-bread",
    name: "Cheese Garlic Bread",
    price: 149,
    image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=500&auto=format&fit=crop&q=80",
    description: "Toasted thick bread slices loaded with garlic butter, fresh parsley, and gooey melted mozzarella."
  },
  "creamy-mushroom-penne": {
    id: "creamy-mushroom-penne",
    name: "Creamy Mushroom Penne",
    price: 249,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80",
    description: "Penne tossed in a rich, creamy white parmesan sauce loaded with fresh button mushrooms and garlic herbs."
  },
  "spiced-arrabbiata": {
    id: "spiced-arrabbiata",
    name: "Spiced Arrabbiata Pasta",
    price: 229,
    image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500&auto=format&fit=crop&q=80",
    description: "Penne pasta in a fiery, spiced San Marzano tomato sauce infused with fresh garlic, chili flakes, and basil leaves."
  },
  "warm-brownie": {
    id: "warm-brownie",
    name: "Warm Chocolate Brownie",
    price: 129,
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&auto=format&fit=crop&q=80",
    description: "Rich, dense chocolate brownie served warm with a shiny, gooey dark chocolate glaze on top."
  },
  "choco-volcano": {
    id: "choco-volcano",
    name: "Choco Volcano Cake",
    price: 139,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
    description: "Freshly baked soft chocolate sponge cake with a molten, oozing chocolate lava core inside."
  },
  "water-bottle": {
    id: "water-bottle",
    name: "Purified Water Bottle",
    price: 40,
    image: "/food/bisleri_water_bottle.png",
    description: "Ice-cold premium mineral packaged drinking water for refreshment."
  },
  "pepsi-cola": {
    id: "pepsi-cola",
    name: "Pepsi Cola (500ml)",
    price: 60,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
    description: "500ml bottle of cold, sparkling carbonated Pepsi cola beverage."
  }
}

export default function Cart() {
  const navigate = useNavigate()
  const { replaceCart } = useCart()

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  // State Management
  const [cartItems, setCartItems] = useState([])
  const [orderTypeInfo, setOrderTypeInfo] = useState("Order for Today 11:30")
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showGiftCardModal, setShowGiftCardModal] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [appliedGiftCard, setAppliedGiftCard] = useState(null)
  const [showTaxDetails, setShowTaxDetails] = useState(false)
  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  // Resolve Cart items from userCart localStorage on mount
  useEffect(() => {
    const resolveAndSyncCart = () => {
      const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
      const list = []

      Object.entries(stored).forEach(([key, qty]) => {
        if (qty <= 0) return

        let baseId = key
        let size = ""

        const matchedBaseId = Object.keys(ALL_PRODUCTS).find(id => key.startsWith(id))
        if (matchedBaseId) {
          baseId = matchedBaseId
          if (key.length > matchedBaseId.length) {
            size = key.slice(matchedBaseId.length + 1)
          }
        }

        const prod = ALL_PRODUCTS[baseId]
        if (prod) {
          list.push({
            key,
            id: key,
            itemId: baseId,
            name: size ? `${prod.name} (${size})` : prod.name,
            price: prod.price,
            image: prod.image,
            description: prod.description,
            size,
            quantity: qty,
            restaurant: "Papa Veg Pizza",
            restaurantId: "papa-veg-pizza-1"
          })
        }
      })

      setCartItems(list)
      replaceCart(list)
    }

    resolveAndSyncCart()

    // Listen for updates from other tabs/pages
    window.addEventListener("cartUpdated", resolveAndSyncCart)
    return () => window.removeEventListener("cartUpdated", resolveAndSyncCart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Resolve active location / delivery slot
  useEffect(() => {
    const activeService = localStorage.getItem("activeService") || "delivery"
    if (activeService === "takeaway") {
      const hut = localStorage.getItem("takeawayHut") || "Nearest Outlet"
      setOrderTypeInfo(`Takeaway: ${hut}`)
    } else if (activeService === "incar") {
      const car = localStorage.getItem("carNumber") || "Vehicle Dining"
      setOrderTypeInfo(`In-Car Dining: ${car}`)
    } else {
      setOrderTypeInfo("Order for Today 11:30")
    }
  }, [])

  // Modifying Item Quantity Handler
  const updateItemQty = (key, delta) => {
    const stored = JSON.parse(localStorage.getItem("userCart") || "{}")
    const newQty = (stored[key] || 0) + delta

    if (newQty <= 0) {
      delete stored[key]
    } else {
      stored[key] = newQty
    }

    localStorage.setItem("userCart", JSON.stringify(stored))
    window.dispatchEvent(new Event("cartUpdated"))
  }

  // Calculate pricing sums
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  let discount = 0
  if (appliedCoupon) {
    if (subtotal >= appliedCoupon.minOrder) {
      discount = appliedCoupon.discount
    }
  }

  const handlingCharge = subtotal > 0 ? 35 : 0
  const cgst = subtotal > 0 ? Number(((subtotal - discount + handlingCharge) * 0.025).toFixed(2)) : 0
  const sgst = subtotal > 0 ? Number(((subtotal - discount + handlingCharge) * 0.025).toFixed(2)) : 0
  const taxesAndCharges = subtotal > 0 ? Number((handlingCharge + cgst + sgst).toFixed(2)) : 0

  let giftCardValue = 0
  if (appliedGiftCard) {
    giftCardValue = Math.min(appliedGiftCard.value, subtotal - discount + taxesAndCharges)
  }

  const total = subtotal > 0 ? Number((subtotal - discount + taxesAndCharges - giftCardValue).toFixed(2)) : 0

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-gray-100"}`}>
      <div className={`font-body-md text-body-md w-full max-w-md min-h-screen pb-36 flex flex-col relative shadow-2xl border-x ${
        isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
      }`} style={{ backgroundColor: isDarkMode ? "#111111" : "#fbf9f8", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}>
      {/* Custom Global Scrollbar Hider and Styling injection */}      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"} !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .active-nav-glow { box-shadow: 0 0 15px rgba(229, 57, 53, 0.3) !important; }
        
        /* Font Families */
        .font-headline-lg-mobile, .font-headline-lg, .font-display-lg {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .font-body-md, .font-label-sm, .font-price-xl {
          font-family: 'Inter', sans-serif !important;
        }
        
        /* Font Sizes & Sizing Styles */
        .text-headline-lg-mobile {
          font-size: 28px !important;
          line-height: 34px !important;
          font-weight: 700 !important;
        }
        .text-headline-lg {
          font-size: 32px !important;
          line-height: 40px !important;
          letter-spacing: -0.01em !important;
          font-weight: 700 !important;
        }
        .text-display-lg {
          font-size: 40px !important;
          line-height: 48px !important;
          letter-spacing: -0.02em !important;
          font-weight: 800 !important;
        }
        .text-body-md {
          font-size: 16px !important;
          line-height: 24px !important;
          font-weight: 400 !important;
        }
        .text-label-sm {
          font-size: 12px !important;
          line-height: 16px !important;
          letter-spacing: 0.05em !important;
          font-weight: 600 !important;
        }
        .text-price-xl {
          font-size: 24px !important;
          line-height: 24px !important;
          letter-spacing: -0.01em !important;
          font-weight: 700 !important;
        }
        .px-margin-mobile {
          padding-left: 20px !important;
          padding-right: 20px !important;
        }
        .p-margin-mobile {
          padding: 20px !important;
        }
        .mx-margin-mobile {
          margin-left: 20px !important;
          margin-right: 20px !important;
        }
        .gap-gutter {
          gap: 16px !important;
        }
        .space-y-lg > :not([hidden]) ~ :not([hidden]) {
          margin-top: 24px !important;
        }
        .space-y-md > :not([hidden]) ~ :not([hidden]) {
          margin-top: 16px !important;
        }
        .space-y-sm > :not([hidden]) ~ :not([hidden]) {
          margin-top: 12px !important;
        }
        .p-md {
          padding: 16px !important;
        }
        .mt-md {
          margin-top: 16px !important;
        }
        .bg-surface\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface\/90 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.9)" : "rgba(255, 255, 255, 0.9)"} !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .border-primary {
          border-color: #E53935 !important;
        }
        .focus\\:border-primary:focus {
          border-color: #E53935 !important;
        }
        .text-secondary {
          color: #FF6B35 !important;
        }
        .bg-secondary {
          background-color: #FF6B35 !important;
        }
        .bg-tertiary {
          background-color: #3ce36a !important;
        }
        .text-tertiary {
          color: #3ce36a !important;
        }
        .text-on-primary {
          color: #ffffff !important;
        }
        .text-on-secondary {
          color: #ffffff !important;
        }
        .text-on-tertiary {
          color: #000000 !important;
        }
        .bg-primary-container {
          background-color: #ff544c !important;
        }
        .text-on-primary-container {
          color: #5c0005 !important;
        }
        .text-on-surface-variant {
          color: ${isDarkMode ? "#e4beb9" : "#6b7280"} !important;
        }
        .border-white\/10 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }
        .bg-white\/10 {
          background-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"} !important;
        }
        .text-white\/40 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.4)" : "rgba(19, 19, 19, 0.4)"} !important;
        }
        `
      }} />

      {/* Header */}
      <header className="sticky top-0 left-0 w-full z-10 bg-surface/80 backdrop-blur-xl dark:bg-surface/80 border-b border-white/10 shadow-sm h-16 flex items-center justify-between px-margin-mobile">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:opacity-80 transition-opacity active:scale-95 bg-transparent border-0 cursor-pointer text-inherit"
        >
          <ArrowLeft size={22} className={isDarkMode ? "text-white" : "text-[#1c1b1b]"} />
        </button>
        <h1 className={`font-headline-lg-mobile text-lg font-bold absolute left-1/2 -translate-x-1/2 ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`}>Your Cart</h1>
        <div className="w-8" />
      </header>

      {/* Order Type / Schedule Card */}
      <div className="flex items-center gap-3 px-margin-mobile py-4 border-b border-white/10 glass-card mx-margin-mobile mt-md rounded-xl">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Clock size={18} />
        </div>
        <span className={`font-label-sm ${isDarkMode ? "text-white" : "text-[#131313]"}`}>{orderTypeInfo}</span>
      </div>

      {/* Order List Header */}
      <div className="flex justify-between items-center px-margin-mobile pt-6 pb-2">
        <h2 className={`font-headline-lg-mobile text-base ${isDarkMode ? "text-white" : "text-[#131313]"}`}>Order List</h2>
        <button
          onClick={() => navigate("/user/menu")}
          className="text-primary font-label-sm hover:opacity-80 transition-opacity active:scale-95 bg-transparent border-0 outline-none cursor-pointer"
        >
          + Add more
        </button>
      </div>

      {/* Cart Items Area */}
      <div className="px-margin-mobile space-y-md">
        {cartItems.length === 0 ? (
          <div className="py-4 px-4 text-center opacity-60 font-label-sm">
            Looks like you haven't added any item to your Cart yet
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.key} className="glass-card rounded-xl p-md flex items-start gap-4">
              {/* Veg Indicator Square Box */}
              <div className="mt-1.5 border-2 border-tertiary w-3.5 h-3.5 flex items-center justify-center shrink-0">
                <div className="bg-tertiary rounded-full w-1.5 h-1.5" />
              </div>

              {/* Info Details */}
              <div className="flex-1 text-left space-y-1">
                <h4 className={`font-headline-lg-mobile text-[14px] leading-tight ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                  {item.name}
                </h4>
                {item.size && (
                  <p className="font-label-sm text-[11px] opacity-60">
                    Size: {item.size}
                  </p>
                )}
                <p className={`font-price-xl text-sm mt-1 ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                  ₹{item.price * item.quantity}
                </p>
              </div>

              {/* Quantity Changer */}
              <div className="flex items-center border border-white/10 rounded-lg h-9 overflow-hidden glass-card">
                <button
                  onClick={() => updateItemQty(item.key, -1)}
                  className="px-3 h-full flex items-center justify-center text-primary font-bold text-lg hover:bg-white/5 active:bg-white/10 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  -
                </button>
                <span className={`px-2 font-label-sm min-w-[20px] text-center flex items-center justify-center ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateItemQty(item.key, 1)}
                  className="px-3 h-full flex items-center justify-center text-primary font-bold text-lg hover:bg-white/5 active:bg-white/10 transition-colors bg-transparent border-0 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Promo Banner */}
      {cartItems.length > 0 && (
        <div className="mt-4 px-margin-mobile">
          <div className="rounded-xl overflow-hidden shadow-sm hover:scale-[1.01] transition-transform duration-200 cursor-pointer">
            <img 
              src="/free_gift_banner.png" 
              alt="Claim Your Free Gift" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}

      {/* Promos & Discounts Section */}
      <div className="mt-6 px-margin-mobile space-y-sm">
        {/* Coupon Apply Row */}
        <div
          onClick={() => !appliedCoupon && setShowCouponModal(true)}
          className="p-md flex items-center justify-between cursor-pointer glass-card rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Tag size={22} className="text-primary" />
            <div className="text-left">
              {appliedCoupon ? (
                <div>
                  <p className={`font-label-sm ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                    Coupon {appliedCoupon.code} applied!
                  </p>
                  <p className="text-xs text-primary font-bold mt-0.5">
                    ₹{discount} saved on this order
                  </p>
                </div>
              ) : (
                <p className={`font-label-sm ${isDarkMode ? "text-white" : "text-[#131313]"}`}>Apply Coupon</p>
              )}
            </div>
          </div>
          {appliedCoupon ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAppliedCoupon(null)
              }}
              className="text-primary text-xs font-bold hover:underline active:scale-95 bg-transparent border-0 cursor-pointer"
            >
              Remove
            </button>
          ) : (
            <ChevronRight size={20} className="text-primary" />
          )}
        </div>

        {/* Gift Card Add Row */}
        <div
          onClick={() => !appliedGiftCard && setShowGiftCardModal(true)}
          className="p-md flex items-center justify-between cursor-pointer glass-card rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Gift size={22} className="text-primary" />
            <div className="text-left">
              {appliedGiftCard ? (
                <div>
                  <p className={`font-label-sm ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                    Gift Card Applied
                  </p>
                  <p className="text-xs text-primary font-bold mt-0.5">
                    ₹{giftCardValue} balance used
                  </p>
                </div>
              ) : (
                <p className={`font-label-sm ${isDarkMode ? "text-white" : "text-[#131313]"}`}>Add Gift Card</p>
              )}
            </div>
          </div>
          {appliedGiftCard ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAppliedGiftCard(null)
              }}
              className="text-primary text-xs font-bold hover:underline active:scale-95 bg-transparent border-0 cursor-pointer"
            >
              Remove
            </button>
          ) : (
            <ChevronRight size={20} className="text-primary" />
          )}
        </div>
      </div>

      {/* Hungry for more? Section */}
      {cartItems.length > 0 && (
        <div className="mt-6 text-left">
          <h3 className={`font-headline-lg-mobile text-base font-extrabold px-margin-mobile mb-3 ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
            Hungry for more?
          </h3>
          <div className="flex overflow-x-auto gap-4 px-margin-mobile pb-4 hide-scrollbar">
            {[
              {
                id: "cheese-garlic-bread",
                name: "Cheese Garlic Bread",
                price: 149,
                image: "/food/cheese_garlic_bread.jpg"
              },
              {
                id: "garlic-bread-stix",
                name: "Garlic Bread Stix",
                price: 119,
                image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=80"
              },
              {
                id: "choco-volcano",
                name: "Choco Volcano Cake",
                price: 139,
                image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80"
              },
              {
                id: "pepsi-cola",
                name: "Pepsi Cola (500ml)",
                price: 60,
                image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80"
              }
            ].map((item) => (
              <div 
                key={item.id}
                className="glass-card rounded-xl p-3 flex items-center justify-between min-w-[280px] max-w-[280px] shrink-0 gap-3"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="text-left space-y-0.5">
                    <h4 className={`font-headline-lg-mobile text-xs font-semibold leading-tight ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                      {item.name}
                    </h4>
                    <p className={`font-price-xl text-xs font-bold ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                      ₹{item.price}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateItemQty(item.id, 1)}
                  className="text-primary font-bold text-xs hover:opacity-85 active:scale-95 transition-all bg-transparent border-0 cursor-pointer px-2 py-1 outline-none"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bill Details Section */}
      {cartItems.length > 0 && (
        <div className="mt-4 px-margin-mobile text-left pb-16">
          <div className="glass-card rounded-xl p-md space-y-3">
            {/* Subtotal Row */}
            <div className="flex justify-between items-center text-sm">
              <span className="opacity-75 font-semibold">Subtotal</span>
              <span className={`font-bold ${isDarkMode ? "text-white" : "text-[#131313]"}`}>₹{subtotal}</span>
            </div>

            {/* Discounts Row */}
            {discount > 0 && (
              <div className="flex justify-between items-center text-sm text-primary">
                <span className="font-semibold">Discount Applied</span>
                <span className="font-bold">-₹{discount}</span>
              </div>
            )}

            {/* Gift Card Row */}
            {giftCardValue > 0 && (
              <div className="flex justify-between items-center text-sm text-primary">
                <span className="font-semibold">Gift Card Balance Used</span>
                <span className="font-bold">-₹{giftCardValue}</span>
              </div>
            )}

            {/* Taxes & Charges Row */}
            <div className="space-y-2">
              <div 
                onClick={() => setShowTaxDetails(!showTaxDetails)}
                className="flex justify-between items-center text-sm cursor-pointer select-none"
              >
                <div className="flex items-center gap-1">
                  <span className="opacity-75 font-semibold">Taxes and Charges</span>
                  {showTaxDetails ? (
                    <ChevronUp size={16} className="text-primary" />
                  ) : (
                    <ChevronDown size={16} className="text-primary" />
                  )}
                </div>
                <span className={`font-bold ${isDarkMode ? "text-white" : "text-[#131313]"}`}>₹{taxesAndCharges}</span>
              </div>

              {/* Tax Details Dropdown */}
              {showTaxDetails && (
                <div className="pl-4 pr-1 py-1 space-y-1.5 border-l border-white/10 dark:border-white/10 text-xs opacity-80">
                  <div className="flex justify-between items-center">
                    <span>Restaurant Handling Charges</span>
                    <span>₹{handlingCharge}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>CGST (2.5%)</span>
                    <span>₹{cgst}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>SGST (2.5%)</span>
                    <span>₹{sgst}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Separator line */}
            <div className="border-t border-white/10 dark:border-white/10 my-2" />

            {/* Total Row */}
            <div className="flex justify-between items-center text-base font-extrabold">
              <span>Total</span>
              <span className={`font-extrabold ${isDarkMode ? "text-white" : "text-[#131313]"}`}>₹{total}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-surface/90 backdrop-blur-xl border-t border-white/10 px-margin-mobile pt-4 pb-8 z-30 flex flex-col gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold opacity-60">
            Prices are GST-inclusive
          </span>
          <span className={`font-price-xl text-sm ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
            Total: ₹{total}
          </span>
        </div>

        <button
          onClick={() => {
            if (cartItems.length > 0) {
              setShowCheckoutModal(true)
            }
          }}
          disabled={cartItems.length === 0}
          className={`w-full h-12 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${cartItems.length > 0
            ? "bg-primary text-on-primary hover:bg-red-700 active:scale-95 shadow-[0_0_15px_rgba(229,57,53,0.3)] cursor-pointer border-0"
            : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
            }`}
        >
          Proceed to Checkout
        </button>
      </div>

      {/* Coupon Modal Overlay */}
      <ApplyCoupon
        show={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onApply={(coupon) => setAppliedCoupon(coupon)}
        cartTotal={subtotal}
      />

      {/* Gift Card Modal Overlay */}
      <AddGiftCard
        show={showGiftCardModal}
        onClose={() => setShowGiftCardModal(false)}
        onApply={(card) => setAppliedGiftCard(card)}
      />

      {/* Checkout Modal Overlay */}
      <CheckoutModal
        show={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        onOpenGiftCard={() => setShowGiftCardModal(true)}
        cartItems={cartItems}
        subtotal={subtotal}
        discount={discount}
        handlingCharge={handlingCharge}
        cgst={cgst}
        sgst={sgst}
        total={total}
      />
      </div>
    </div>
  )
}
