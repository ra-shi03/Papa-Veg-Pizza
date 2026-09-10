import { useState, useEffect } from "react"
import { ArrowLeft, Check, ChevronUp, ChevronDown, User, ShieldCheck } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function RazorpayPayment({
  total,
  restaurantName = "Papa Veg Pizza",
  onClose,
  onPaymentSuccess
}) {
  const [selectedApp, setSelectedApp] = useState("gpay")
  const [processing, setProcessing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Custom SVGs for UPI Apps
  const GPayLogo = () => (
    <svg className="w-5 h-5" viewBox="0 0 40 40" fill="none">
      <path d="M28.3 16.5H20v5h4.7c-.2 1.1-.9 2.1-1.9 2.8v2.3h3.1c1.8-1.7 2.9-4.2 2.9-7.1 0-.6-.1-1.2-.2-1.8z" fill="#4285F4"/>
      <path d="M20 25c2.4 0 4.5-.8 5.9-2.2l-3.1-2.3c-.9.6-2 .9-2.8.9-2.2 0-4-1.5-4.7-3.5H12v2.4C13.5 22.1 16.5 25 20 25z" fill="#34A853"/>
      <path d="M15.3 17.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9v-2.4H12c-.7 1.5-1 3.1-1 4.8s.4 3.3 1 4.8l3.3-2.4z" fill="#FBBC05"/>
      <path d="M20 12.8c1.3 0 2.5.5 3.4 1.3l2.6-2.6C24.4 10.1 22.3 9.5 20 9.5c-3.5 0-6.5 2.9-8 5.9l3.3 2.4c.7-2 2.5-3.5 4.7-3.5z" fill="#EA4335"/>
    </svg>
  )

  const PhonePeLogo = () => (
    <div className="w-5 h-5 bg-[#5f259f] rounded-md flex items-center justify-center text-white font-black text-xs">
      P
    </div>
  )

  const CREDLogo = () => (
    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-white text-[9px] font-black tracking-tighter">
      C
    </div>
  )

  const AmazonPayLogo = () => (
    <div className="w-5 h-5 bg-[#febd69] rounded-md flex items-center justify-center text-black font-black text-[9px]">
      a
    </div>
  )

  const PaytmLogo = () => (
    <div className="w-5 h-5 bg-[#00b9f5] rounded-md flex items-center justify-center text-white font-extrabold text-[8px]">
      Paytm
    </div>
  )

  const WhatsAppLogo = () => (
    <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.118-2.905-6.993-1.876-1.875-4.357-2.903-6.978-2.903-5.44 0-9.863 4.42-9.867 9.867-.001 1.748.475 3.453 1.38 4.965l-.973 3.561 3.658-.959z" />
    </svg>
  )

  const SBILogo = () => (
    <div className="w-5 h-5 bg-[#00a4e4] rounded-full flex items-center justify-center text-white font-black text-[8px]">
      SBI
    </div>
  )

  const handleContinuePayment = () => {
    setProcessing(true)
    // Simulated payment processing loader
    setTimeout(() => {
      setProcessing(false)
      toast.success("Payment Successful!")
      onPaymentSuccess()
    }, 2000)
  }

  const upiApps = [
    { id: "phonepe", name: "PhonePe", logo: <PhonePeLogo /> },
    { id: "gpay", name: "Google Pay", logo: <GPayLogo /> },
    { id: "cred", name: "CRED UPI", logo: <CREDLogo />, subtitle: "Upto ₹50 cashback" },
    { id: "amazonpay", name: "Amazon Pay UPI", logo: <AmazonPayLogo />, subtitle: "Upto ₹50 cashback" },
    { id: "supermoney", name: "Super.Money", logo: <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center text-white text-[7px] font-black">SUPER</div>, subtitle: "Upto 5% cashback" },
    { id: "navi", name: "Navi", logo: <div className="w-5 h-5 bg-emerald-900 rounded-md flex items-center justify-center text-white text-[9px] font-black">N</div>, subtitle: "Upto ₹100 cashback" },
    { id: "paytm", name: "PayTM", logo: <PaytmLogo /> },
    { id: "whatsapp", name: "WhatsApp", logo: <WhatsAppLogo /> },
    { id: "sbi", name: "YONO SBI", logo: <SBILogo /> },
    { id: "others", name: "Others", logo: <div className="w-5 h-5 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center text-gray-400 text-[9px] font-black">•••</div> }
  ]

  return (
    <div className="flex flex-col h-full bg-white text-zinc-900 select-none relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Red Razorpay-style Header */}
      <div className="bg-[#c8102e] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 cursor-pointer border-0 bg-transparent text-white animate-none"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          
          {/* Logo & Merchant Info */}
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 shrink-0 shadow-sm">
            <span className="text-[#c8102e] font-black text-sm tracking-tighter">PVP</span>
          </div>

          <div className="text-left leading-tight">
            <h3 className="font-bold text-sm leading-none">{restaurantName}</h3>
            <div className="flex items-center gap-1 mt-0.5 opacity-90">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center scale-90">
                <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
              </div>
              <span className="text-[9px] font-semibold tracking-wide uppercase">Razorpay Trusted Business</span>
            </div>
          </div>
        </div>

        {/* User profile silhoutte button */}
        <button className="w-8 h-8 rounded-full bg-rose-400/20 hover:bg-rose-400/30 flex items-center justify-center border-0 text-white cursor-pointer">
          <User className="w-4 h-4" />
        </button>
      </div>

      {/* Main Payment Content Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Title */}
        <div className="text-left">
          <h2 className="text-base font-black tracking-tight text-zinc-800">UPI</h2>
        </div>

        {/* Available Offers section */}
        <div className="space-y-1.5 text-left">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Available Offers</span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {/* Offer Pill 1 */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-100 rounded-full shrink-0">
              <CREDLogo />
              <span className="text-[10px] font-bold text-rose-700">Upto ₹50 cashback via CRED</span>
            </div>
            {/* Offer Pill 2 */}
            <div className="flex items-center gap-1 px-3 py-2 bg-zinc-50 border border-zinc-100 rounded-full shrink-0 cursor-pointer hover:bg-zinc-100">
              <div className="flex -space-x-1 mr-1">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-700 border border-white" />
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-white" />
              </div>
              <span className="text-[10px] font-bold text-zinc-600">+4 View all</span>
            </div>
          </div>
        </div>

        {/* Pay by any UPI App section */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Pay by any UPI App</span>
          
          {/* Apps Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {upiApps.map((app) => {
              const isSelected = selectedApp === app.id
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app.id)}
                  className={`p-3 border rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#c8102e] bg-red-50/20 shadow-xs"
                      : "border-zinc-200 bg-white hover:border-zinc-350"
                  }`}
                >
                  <div className="shrink-0">{app.logo}</div>
                  <div className="text-left min-w-0 flex-1 leading-tight">
                    <p className={`text-xs font-bold ${isSelected ? "text-zinc-900" : "text-zinc-700"}`}>
                      {app.name}
                    </p>
                    {app.subtitle && (
                      <span className="text-[9px] font-bold text-emerald-600 truncate block mt-0.5">
                        {app.subtitle}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-[#c8102e] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className="border-t border-zinc-100 shrink-0 bg-zinc-50/50">
        {/* Privacy Note */}
        <div className="py-2.5 px-5 text-center bg-zinc-50 border-b border-zinc-100">
          <p className="text-[9px] text-zinc-400 font-medium">
            By proceeding, I agree to Razorpay's{" "}
            <span className="underline hover:text-zinc-650 cursor-pointer">Privacy Notice</span> •{" "}
            <span className="underline hover:text-zinc-650 cursor-pointer">Edit Preferences</span>
          </p>
        </div>

        {/* Pricing Summary Bar */}
        <div className="p-4 bg-white flex items-center justify-between">
          <div className="text-left relative">
            <button 
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1.5 text-zinc-800 hover:text-black font-black text-sm bg-transparent border-0 cursor-pointer outline-none p-0"
            >
              <span>₹{total.toFixed(2)}</span>
              {showDetails ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronUp className="w-4 h-4 text-zinc-500" />}
            </button>
            <span className="text-[9px] text-zinc-400 font-semibold block leading-none mt-0.5">View Details</span>
          </div>

          <button
            type="button"
            onClick={handleContinuePayment}
            disabled={processing}
            className="px-8 py-2.5 bg-black hover:bg-zinc-900 disabled:bg-zinc-300 text-white rounded-lg text-xs font-black tracking-wider transition-all border-0 cursor-pointer flex items-center justify-center min-w-[120px] shadow-sm"
          >
            {processing ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </div>
      </div>

      {/* Expanded Order Details Modal inside Payment sheet */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="absolute inset-0 bg-black/45 z-20"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute bottom-[68px] left-0 right-0 bg-white border-t border-zinc-100 rounded-t-xl p-4 text-left z-30 space-y-2.5"
            >
              <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Order Breakup</h4>
              <div className="space-y-1.5 text-xs text-zinc-650">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-zinc-800">₹{(total - (total * 0.05)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges:</span>
                  <span className="font-semibold text-zinc-800">₹{(total * 0.05).toFixed(2)}</span>
                </div>
                <div className="border-t border-zinc-100 pt-2 flex justify-between font-black text-zinc-900 text-sm">
                  <span>Total Amount:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
