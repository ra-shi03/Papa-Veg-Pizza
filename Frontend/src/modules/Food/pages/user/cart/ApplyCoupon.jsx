import React, { useState } from "react"
import { X } from "lucide-react"

export default function ApplyCoupon({ show, onClose, onApply, cartTotal }) {
  const [couponInput, setCouponInput] = useState("")

  if (!show) return null

  const getDynamicCoupons = () => {
    try {
      const local = localStorage.getItem("franchise_admin_coupons")
      if (local) {
        const parsed = JSON.parse(local).filter(c => c.status === "active")
        if (parsed.length > 0) {
          return parsed.map(c => ({
            code: c.couponCode,
            discount: c.discountValue || 50,
            minOrder: c.minimumOrderAmount || 0,
            title: c.title,
            subtitle: c.description || "Valid on all orders",
            bannerText: c.discountType === "percentage" ? `FLAT ${c.discountValue}% OFF` : `FLAT ₹${c.discountValue} OFF`,
            bannerSub: c.minimumOrderAmount ? `ON MINIMUM ORDER OF ₹${c.minimumOrderAmount}` : "NO MINIMUM ORDER REQUIRED",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"
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
            code: c.code,
            discount: c.value || 50,
            minOrder: c.minimumOrderAmount || 0,
            title: c.title,
            subtitle: c.description || "Valid on all orders",
            bannerText: c.couponType === "Percentage" ? `FLAT ${c.value}% OFF` : `FLAT ₹${c.value} OFF`,
            bannerSub: c.minimumOrderAmount ? `ON MINIMUM ORDER OF ₹${c.minimumOrderAmount}` : "NO MINIMUM ORDER REQUIRED",
            image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"
          }))
        }
      }
    } catch (e) {}

    return [
      {
        code: "HUT125",
        discount: 125,
        minOrder: 500,
        title: "Rs. 125 Off on bill value above Rs.500",
        subtitle: "Valid on Ala carte orders, not applicable on deals",
        bannerText: "FLAT ₹125 OFF",
        bannerSub: "ON MINIMUM ORDER OF ₹500",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80"
      },
      {
        code: "HUT100",
        discount: 100,
        minOrder: 400,
        title: "Rs. 100 Off on bill value above Rs.400",
        subtitle: "Valid on Ala carte orders, not applicable on deals",
        bannerText: "FLAT ₹100 OFF",
        bannerSub: "ON MINIMUM ORDER OF ₹400",
        image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=400&auto=format&fit=crop&q=80"
      }
    ];
  };

  const coupons = getDynamicCoupons();

  const handleManualApply = () => {
    const cleanCode = couponInput.trim().toUpperCase()
    if (!cleanCode) return

    const matched = coupons.find(c => c.code === cleanCode)
    if (matched) {
      if (cartTotal < matched.minOrder) {
        alert(`Minimum order value of ₹${matched.minOrder} is required for this coupon.`)
        return
      }
      onApply(matched)
      onClose()
    } else {
      // Allow custom coupon application for testing
      onApply({
        code: cleanCode,
        discount: 50,
        minOrder: 0,
        title: `Coupon ${cleanCode} Applied`,
        subtitle: "Custom coupon applied successfully"
      })
      onClose()
    }
  }

  const handleCardApply = (coupon) => {
    if (cartTotal < coupon.minOrder) {
      alert(`Minimum order value of ₹${coupon.minOrder} is required to apply ${coupon.code}.`)
      return
    }
    onApply(coupon)
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] shadow-2xl flex flex-col text-left transition-transform duration-300 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-zinc-100">
          <h3 className="font-bold text-xl text-zinc-950">Offers for you</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 hide-scrollbar">
          {/* Input field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Enter coupon code here</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="e.g. ABC1234"
                className="flex-1 h-12 bg-white border border-zinc-200 rounded-xl px-4 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-400"
              />
              <button
                onClick={handleManualApply}
                disabled={!couponInput.trim()}
                className={`px-6 h-12 rounded-xl text-sm font-bold transition-all ${
                  couponInput.trim() 
                    ? "bg-primary text-on-primary hover:opacity-90 active:scale-95" 
                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                }`}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Coupons List */}
          <div className="space-y-4">
            {coupons.map((coupon) => {
              const isEligible = cartTotal >= coupon.minOrder
              return (
                <div 
                  key={coupon.code}
                  className="border border-zinc-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white flex flex-col"
                >
                  {/* Banner */}
                  <div className="relative h-28 bg-primary flex items-center justify-between p-5 text-white">
                    {/* Left: Text */}
                    <div className="z-10 text-left space-y-1">
                      <div className="bg-yellow-400 text-primary font-extrabold text-[10px] px-2 py-0.5 rounded-full inline-block uppercase tracking-wider">
                        Apply Code {coupon.code}
                      </div>
                      <h4 className="font-extrabold text-xl leading-none">{coupon.bannerText}</h4>
                      <p className="text-[10px] font-bold opacity-90">{coupon.bannerSub}</p>
                    </div>
                    {/* Right: Graphic / image overlay */}
                    <img 
                      src={coupon.image} 
                      alt="coupon pizza" 
                      className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-60 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-transparent"></div>
                  </div>

                  {/* Body info */}
                  <div className="p-4 flex flex-col text-left space-y-3">
                    <div className="space-y-1">
                      <h5 className="font-bold text-sm text-zinc-900 leading-tight">
                        {coupon.title}
                      </h5>
                      <p className="text-xs text-zinc-500 font-medium">
                        {coupon.subtitle}
                      </p>
                    </div>

                    <button
                      onClick={() => handleCardApply(coupon)}
                      className={`w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-98 ${
                        isEligible 
                          ? "bg-primary hover:opacity-90 text-on-primary" 
                          : "bg-zinc-100 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                      }`}
                    >
                      {isEligible ? "Apply" : `Add ₹${coupon.minOrder - cartTotal} more`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
