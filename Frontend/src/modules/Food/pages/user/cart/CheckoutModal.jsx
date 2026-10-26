import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Check, User, Clock, Gift, ShieldCheck, CreditCard, ChevronRight, AlertTriangle } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import { useProfile } from "@food/context/ProfileContext"
import { useAppConfig } from "@food/context/AppConfigContext"
import { motion, AnimatePresence } from "framer-motion"
import RazorpayPayment from "./RazorpayPayment"
import apiClient from "@/services/api/axios"
import { orderAPI } from "@food/api"
import { toast } from "sonner"

export default function CheckoutModal({
  show,
  onClose,
  onOpenGiftCard,
  cartItems,
  subtotal,
  discount,
  handlingCharge,
  cgst,
  sgst,
  total
}) {
  const navigate = useNavigate()
  const { replaceCart, clearCart } = useCart()
  const { addAddress, paymentMethods } = useProfile()
  const { config: appConfig } = useAppConfig()
  const isPaymentOptionDisabled = appConfig?.paymentOptionEnabled === false
  const isLoggedIn = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
  const isGuestCheckoutBlocked = appConfig?.guestCheckoutEnabled === false && !isLoggedIn

  // Navigation / View state: "address", "checkout", "contact_edit", "timeslot_edit"
  const [modalView, setModalView] = useState("address")

  // Form inputs
  const [houseNumber, setHouseNumber] = useState("")
  const [landmark, setLandmark] = useState("")
  const [instructions, setInstructions] = useState("")
  const [currentAddress, setCurrentAddress] = useState("South Tukoganj, Indore, Indore Division, 452001")

  // Contact Details
  const [contactName, setContactName] = useState("Rashi Jaiswal")
  const [contactPhone, setContactPhone] = useState("9300990940")
  const [contactEmail, setContactEmail] = useState("rashijaiswal6655@gmail.com")

  // Contact Details Temp Editing State
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")

  // Timeslot Preference
  const [timeOption, setTimeOption] = useState("ASAP")

  // Consent checkmark
  const [promoCommunication, setPromoCommunication] = useState(true)

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : false
  })

  // Sync current location on mount/show
  useEffect(() => {
    if (show) {
      setModalView("address") // always start with address form first
      const savedAddress = localStorage.getItem("deliveryAddress")
      if (savedAddress) {
        setCurrentAddress(savedAddress)
      }
    }
  }, [show])

  // Save Contact editing
  const handleSaveContactInfo = (e) => {
    e.preventDefault()
    if (!editName.trim()) {
      alert("Name is required")
      return
    }
    if (!editPhone.trim()) {
      alert("Mobile number is required")
      return
    }
    if (!editEmail.trim()) {
      alert("Email is required")
      return
    }
    setContactName(editName)
    setContactPhone(editPhone)
    setContactEmail(editEmail)
    setModalView("checkout")
  }

  // Open Contact editing
  const triggerContactEdit = () => {
    setEditName(contactName)
    setEditPhone(contactPhone)
    setEditEmail(contactEmail)
    setModalView("contact_edit")
  }

  // Final Order placement
  const [placingOrder, setPlacingOrder] = useState(false)

  const handleSaveAddressAndCheckout = async () => {
    if (placingOrder) return
    // Build structured address object
    const newAddressObject = {
      label: "Home",
      street: houseNumber.trim() || "abc",
      additionalDetails: landmark.trim() || "",
      city: currentAddress.split(",")[1]?.trim() || "Indore",
      state: currentAddress.split(",")[2]?.trim() || "Madhya Pradesh",
      zipCode: currentAddress.match(/\d{6}/)?.[0] || "452001",
      isDefault: true
    }

    // Save to profile
    try {
      addAddress(newAddressObject)
    } catch (e) {
      console.warn("Failed saving address to profile context, continuing order placement", e)
    }

    const activeService = localStorage.getItem("activeService") || "delivery"
    const savedDeliveryAddress = localStorage.getItem("deliveryAddress") || ""
    const isTrain = activeService === "train" || savedDeliveryAddress.toLowerCase().includes("train")
    const trainPnr = localStorage.getItem("pvp_train_pnr") || ""

    // Pick the store that serves this delivery location, then place the order with it.
    let orderId
    setPlacingOrder(true)
    try {
      let coords = null
      try {
        const loc = JSON.parse(localStorage.getItem("userLocation") || "null")
        if (Number.isFinite(loc?.latitude) && Number.isFinite(loc?.longitude)) coords = loc
      } catch (_) {}

      const resolved = await apiClient.get("/food/stores/resolve", {
        params: coords ? { lat: coords.latitude, lng: coords.longitude } : {},
        _isFallback: true,
      })
      const store = resolved?.data?.data
      if (!store?.storeId) throw new Error("No store is available right now")

      const response = await orderAPI.createOrder({
        storeId: store.storeId,
        customerName: contactName,
        customerPhone: contactPhone,
        address: {
          label: "Home",
          name: contactName,
          phone: contactPhone,
          street: isTrain && savedDeliveryAddress ? savedDeliveryAddress : newAddressObject.street,
          additionalDetails: isTrain && trainPnr ? `IRCTC Train PNR: ${trainPnr}` : newAddressObject.additionalDetails,
          city: newAddressObject.city,
          state: newAddressObject.state,
          zipCode: newAddressObject.zipCode,
          ...(coords ? { location: { type: "Point", coordinates: [coords.longitude, coords.latitude] } } : {}),
        },
        items: cartItems.map((item) => ({
          itemId: String(item.itemId || item.id),
          name: item.name,
          price: Number(item.price) || 0,
          quantity: item.quantity,
          image: item.image || "",
          size: item.size || "",
          kind: item.kind || "product",
          notes: item.description || "",
          ...(item.offerToken ? { offerToken: item.offerToken } : {}),
        })),
        pricing: {
          subtotal,
          tax: cgst + sgst,
          deliveryFee: handlingCharge,
          discount,
          total,
        },
        // The in-app payment screen is a preview, so orders are placed as pay-on-delivery.
        paymentMethod: "cash",
        note: instructions.trim(),
      })
      const created = response?.data?.data?.order
      orderId = created?._id || created?.id
      if (!orderId) throw new Error("Order could not be created")
    } catch (err) {
      setPlacingOrder(false)
      toast.error(err?.response?.data?.message || err?.message || "Could not place your order")
      return
    }
    setPlacingOrder(false)

    if (isTrain) {
      try {
        const existing = JSON.parse(localStorage.getItem("pvp_train_orders") || "[]")
        const trainOrderEntry = {
          orderId,
          id: orderId,
          isTrainOrder: true,
          orderType: "train",
          createdAt: new Date().toISOString(),
          status: "confirmed",
          total,
          items: cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          trainDetails: {
            deliveryAddress: savedDeliveryAddress,
            pnr: trainPnr
          },
          deliveryAddress: {
            street: savedDeliveryAddress || newAddressObject.street,
            additionalDetails: `Train delivery PNR: ${trainPnr}`,
            city: newAddressObject.city
          }
        }
        localStorage.setItem("pvp_train_orders", JSON.stringify([trainOrderEntry, ...existing]))
      } catch (_) {}
    }

    // Clear cart in storage & context
    try {
      localStorage.removeItem("userCart")
      localStorage.removeItem("cart")
    } catch (e) {}
    if (typeof clearCart === "function") {
      clearCart()
    }
    replaceCart([]) // clear cart in context
    window.dispatchEvent(new Event("cartUpdated"))

    onClose()

    // Redirect to order tracking details page
    navigate(`/user/orders/${orderId}?confirmed=true`)
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          {/* Backdrop click to close */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />
          
          {/* Slide up panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="w-full max-w-md bg-white dark:bg-[#111111] rounded-t-3xl overflow-hidden flex flex-col relative z-10 shadow-2xl text-left border-t"
            style={{ 
              color: isDarkMode ? "#ffffff" : "#131313",
              borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              maxHeight: "92vh"
            }}
          >
            {/* View 1: Address collection step (Image 4) */}
            {modalView === "address" && (
              <>
                {/* Step Progress Bar Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b relative" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  {/* Contact Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </div>
                    <span className="text-[9px] font-semibold mt-1 opacity-70">Contact</span>
                    <div className="absolute top-2.5 left-[50%] right-[-50%] h-[2px] bg-primary -z-10"></div>
                  </div>
                  
                  {/* Address Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center bg-white dark:bg-[#111111] shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <span className="text-[9px] font-black text-primary mt-1">Address</span>
                    <div className="absolute top-2.5 left-[-50%] right-[50%] h-[2px] bg-primary -z-10"></div>
                    <div className="absolute top-2.5 left-[50%] right-[-50%] h-[2px] bg-primary -z-10"></div>
                  </div>

                  {/* Payment Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </div>
                    <span className="text-[9px] font-semibold mt-1 opacity-70">Payment</span>
                    <div className="absolute top-2.5 left-[-50%] right-[50%] h-[2px] bg-primary -z-10"></div>
                    <div className="absolute top-2.5 left-[50%] right-[-50%] h-[2px] bg-zinc-200 dark:bg-zinc-800 -z-10"></div>
                  </div>

                  {/* Checkout Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] shadow-sm"></div>
                    <span className="text-[9px] font-semibold mt-1 opacity-50">Checkout</span>
                    <div className="absolute top-2.5 left-[-50%] right-[50%] h-[2px] bg-zinc-200 dark:bg-zinc-800 -z-10"></div>
                  </div>
                </div>

                {/* Title Bar */}
                <div className="px-4 py-3.5 flex items-center gap-3 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <button 
                    onClick={onClose} 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer border-0 bg-transparent"
                  >
                    <ArrowLeft className="w-5 h-5 text-zinc-800 dark:text-white stroke-[2.5px]" />
                  </button>
                  <h1 className="text-sm sm:text-base font-black tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Help us deliver to you faster
                  </h1>
                </div>

                {/* Current Location Info */}
                <div className="px-5 py-4 border-b flex items-start gap-3" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <MapPin className="text-zinc-400 dark:text-zinc-500 w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block leading-none">Delivering to</span>
                    <p className="text-xs font-bold leading-normal opacity-90">
                      {currentAddress}
                    </p>
                  </div>
                </div>

                {/* Form Inputs Container */}
                <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: "40vh" }}>
                  {/* House/Flat Number */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      House number or flat number
                    </label>
                    <input 
                      type="text" 
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="House number or flat number"
                      className="w-full px-4 py-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-primary transition-all font-semibold shadow-2xs"
                    />
                  </div>

                  {/* Landmark */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Address Line 2 (Optional)
                    </label>
                    <input 
                      type="text" 
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Landmark"
                      className="w-full px-4 py-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-primary transition-all font-semibold shadow-2xs"
                    />
                  </div>

                  {/* Delivery Instructions */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Delivery instructions (Optional)
                    </label>
                    <textarea 
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="E.g. leave at the door"
                      rows={3}
                      className="w-full px-4 py-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-primary transition-all font-semibold resize-none shadow-2xs"
                    />
                  </div>
                </div>

                {/* Save/Action Button */}
                <div className="p-5 border-t" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <button 
                    onClick={() => {
                      if (!houseNumber.trim()) {
                        alert("House number or flat number is required")
                        return
                      }
                      setModalView("checkout") // transition to checkout dashboard
                    }}
                    className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10"
                  >
                    Save address details
                  </button>
                </div>
              </>
            )}

            {/* View 2: Secure Checkout Summary dashboard (Image 1) */}
            {modalView === "checkout" && (
              <>
                {/* Step Progress Bar Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b relative" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  {/* Contact Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </div>
                    <span className="text-[9px] font-semibold mt-1 opacity-70">Contact</span>
                    <div className="absolute top-2.5 left-[50%] right-[-50%] h-[2px] bg-primary -z-10"></div>
                  </div>
                  
                  {/* Address Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </div>
                    <span className="text-[9px] font-semibold mt-1 opacity-70">Address</span>
                    <div className="absolute top-2.5 left-[-50%] right-[50%] h-[2px] bg-primary -z-10"></div>
                    <div className="absolute top-2.5 left-[50%] right-[-50%] h-[2px] bg-primary -z-10"></div>
                  </div>

                  {/* Payment Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-black shadow-sm">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </div>
                    <span className="text-[9px] font-semibold mt-1 opacity-70">Payment</span>
                    <div className="absolute top-2.5 left-[-50%] right-[50%] h-[2px] bg-primary -z-10"></div>
                    <div className="absolute top-2.5 left-[50%] right-[-50%] h-[2px] bg-primary -z-10"></div>
                  </div>

                  {/* Checkout Step */}
                  <div className="flex flex-col items-center flex-1 relative z-10">
                    <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center bg-white dark:bg-[#111111] shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                    </div>
                    <span className="text-[9px] font-black text-primary mt-1">Checkout</span>
                    <div className="absolute top-2.5 left-[-50%] right-[50%] h-[2px] bg-primary -z-10"></div>
                  </div>
                </div>

                {/* Header Title */}
                <div className="px-5 pt-5 pb-2">
                  <h1 className="text-lg font-black tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Secure Checkout
                  </h1>
                </div>

                {/* Dashboard Options List */}
                <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  
                  {/* Row 1: Contact / User details */}
                  <div className="p-4 flex items-start gap-3">
                    <User className="w-5 h-5 text-zinc-450 dark:text-zinc-550 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-bold leading-normal">{contactName}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-normal truncate">{contactEmail}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-normal">+91 {contactPhone}</p>
                    </div>
                    <button 
                      onClick={triggerContactEdit}
                      className="text-xs font-black text-primary hover:text-primary-hover bg-transparent border-0 outline-none cursor-pointer"
                    >
                      View
                    </button>
                  </div>

                  {/* Row 2: Order Time Slot */}
                  <div className="p-4 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-zinc-450 dark:text-zinc-550 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold leading-normal">Order for {appConfig?.scheduledOrdersEnabled === false ? "ASAP" : timeOption}</p>
                    </div>
                    {appConfig?.scheduledOrdersEnabled !== false && (
                      <button 
                        onClick={() => setModalView("timeslot_edit")}
                        className="text-xs font-black text-primary hover:text-primary-hover bg-transparent border-0 outline-none cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* Row 3: Delivery Address */}
                  <div className="p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-zinc-450 dark:text-zinc-550 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
                        Delivering to: <span className="text-zinc-800 dark:text-zinc-200 font-bold">{currentAddress}</span>
                      </p>
                      <p className="text-xs font-bold leading-normal mt-0.5">{houseNumber}</p>
                    </div>
                    <button 
                      onClick={() => setModalView("address")}
                      className="text-xs font-black text-primary hover:text-primary-hover bg-transparent border-0 outline-none cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {/* Row 4: Gift Card */}
                  <div className="p-4 flex items-start gap-3">
                    <Gift className="w-5 h-5 text-zinc-450 dark:text-zinc-550 shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold leading-normal">Add Gift Card</p>
                    </div>
                    <button 
                      onClick={onOpenGiftCard}
                      className="text-xs font-black text-primary hover:text-primary-hover bg-transparent border-0 outline-none cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Row 5: Payment (UPI / Credit Card) */}
                  <div className="p-4 flex items-start gap-3">
                    <CreditCard className={`w-5 h-5 shrink-0 mt-0.5 ${isPaymentOptionDisabled ? "text-amber-500" : "text-zinc-450 dark:text-zinc-550"}`} />
                    <div className="flex-1 text-left">
                      {isPaymentOptionDisabled ? (
                        <>
                          <p className="text-xs font-bold leading-normal text-amber-600 dark:text-amber-400">
                            Online Payments Disabled
                          </p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                            {appConfig?.codEnabled !== false 
                              ? "Order will be placed via Cash on Delivery" 
                              : "Store payment options currently unavailable"}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-semibold leading-normal">UPI</p>
                      )}
                    </div>
                    {!isPaymentOptionDisabled && (
                      <button 
                        onClick={() => {
                          onClose()
                          navigate("/user/account/profile-details/payments")
                        }}
                        className="text-xs font-black text-primary hover:text-primary-hover bg-transparent border-0 outline-none cursor-pointer"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* Row 6: Consent Checkbox */}
                  <div className="p-4 flex items-start gap-3 select-none cursor-pointer" onClick={() => setPromoCommunication(!promoCommunication)}>
                    <div className={`w-5 h-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-all ${
                      promoCommunication 
                        ? "border-primary bg-primary text-white" 
                        : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                    }`}>
                      {promoCommunication && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>
                    <p className="text-[11px] font-semibold leading-relaxed text-zinc-500 dark:text-zinc-450 text-left">
                      I agree to receive promotional communication.
                    </p>
                  </div>
                </div>

                {/* Footer and Checkout Button */}
                <div className="p-5 border-t" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-zinc-455 dark:text-zinc-500">
                      Prices are GST-inclusive
                    </span>
                    <span className="text-sm font-black">
                      Total: ₹{total.toFixed(2)}
                    </span>
                  </div>

                  {isGuestCheckoutBlocked ? (
                    <button 
                      onClick={() => {
                        onClose?.();
                        navigate("/user/auth/login", { state: { from: "/user/cart" } });
                      }}
                      className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                    >
                      <span>Sign In to Place Order</span>
                    </button>
                  ) : isPaymentOptionDisabled ? (
                    appConfig?.codEnabled !== false ? (
                      <button 
                        onClick={handleSaveAddressAndCheckout}
                        className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-2"
                      >
                        <span>Place Order (Cash On Delivery)</span>
                      </button>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-center text-[11px] font-bold">
                          Store payment options are temporarily disabled.
                        </div>
                        <button 
                          disabled
                          className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                        >
                          Checkout Disabled
                        </button>
                      </div>
                    )
                  ) : (
                    <button 
                      onClick={() => setModalView("payment")}
                      className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10"
                    >
                      Continue to payment
                    </button>
                  )}
                </div>
              </>
            )}

            {/* View 3: Who's the order for? Contact edit (Image 2) */}
            {modalView === "contact_edit" && (
              <form onSubmit={handleSaveContactInfo} className="flex flex-col h-full">
                {/* Title Header */}
                <div className="px-4 py-4 flex items-center gap-3 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <button 
                    type="button"
                    onClick={() => setModalView("checkout")} 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer border-0 bg-transparent"
                  >
                    <ArrowLeft className="w-5 h-5 text-zinc-800 dark:text-white stroke-[2.5px]" />
                  </button>
                  <h1 className="text-sm sm:text-base font-black tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Who’s the order for?
                  </h1>
                </div>

                {/* Form Body */}
                <div className="p-5 space-y-4">
                  {/* Name Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">
                      Name
                    </label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter name"
                      className="w-full px-4 py-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-primary transition-all font-semibold"
                    />
                  </div>

                  {/* Mobile Number Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">
                      Mobile number
                    </label>
                    <div className="flex gap-2">
                      {/* Flag box */}
                      <div className="flex items-center gap-1.5 px-3 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 shrink-0">
                        {/* Indian Flag SVG */}
                        <div className="flex flex-col w-5 h-3.5 border border-zinc-200 shrink-0">
                          <div className="bg-[#FF9933] h-1/3"></div>
                          <div className="bg-[#FFFFFF] h-1/3 flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-[#000080]" />
                          </div>
                          <div className="bg-[#128807] h-1/3"></div>
                        </div>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">+91</span>
                      </div>
                      <input 
                        type="tel" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Mobile number"
                        className="flex-1 px-4 py-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-primary transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Email address Input */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider">
                      Email address
                    </label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full px-4 py-3 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-primary transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="p-5 border-t" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <button 
                    type="submit"
                    className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10"
                  >
                    Save contact info
                  </button>
                </div>
              </form>
            )}

            {/* View 4: Timeslot Selection View (Image 3) */}
            {modalView === "timeslot_edit" && (
              <>
                {/* Title Header */}
                <div className="px-4 py-4 flex items-center gap-3 border-b" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <button 
                    onClick={() => setModalView("checkout")} 
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer border-0 bg-transparent"
                  >
                    <ArrowLeft className="w-5 h-5 text-zinc-800 dark:text-white stroke-[2.5px]" />
                  </button>
                  <h1 className="text-sm sm:text-base font-black tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    When would you like your order?
                  </h1>
                </div>

                {/* Body options list */}
                <div className="p-5 space-y-4">
                  {/* ASAP Option */}
                  <div 
                    onClick={() => setTimeOption("ASAP")}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-850 hover:border-primary/30 cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center gap-3 select-none">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        timeOption === "ASAP" ? "border-primary bg-transparent" : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                      }`}>
                        {timeOption === "ASAP" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span className="text-xs font-bold">ASAP</span>
                    </div>
                  </div>

                  {/* Future Option */}
                  <div 
                    onClick={() => setTimeOption("future")}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-850 hover:border-primary/30 cursor-pointer transition-all text-left"
                  >
                    <div className="flex items-center gap-3 select-none">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        timeOption === "future" ? "border-primary bg-transparent" : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                      }`}>
                        {timeOption === "future" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                      <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-400">Order for future</span>
                    </div>
                  </div>
                </div>

                {/* Footer Save Button */}
                <div className="p-5 border-t" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <button 
                    onClick={() => setModalView("checkout")}
                    className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10"
                  >
                    Select Timeslot
                  </button>
                </div>
              </>
            )}

            {modalView === "payment" && (
              isPaymentOptionDisabled ? (
                <div className="p-6 text-center space-y-3">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Online Payments Temporarily Disabled</p>
                  <p className="text-xs text-zinc-500">Please choose Cash on Delivery or contact store support.</p>
                  <button 
                    onClick={() => setModalView("checkout")}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg"
                  >
                    Back to Checkout
                  </button>
                </div>
              ) : (
                <RazorpayPayment
                  total={total}
                  restaurantName={cartItems[0]?.restaurant || "Papa Veg Pizza"}
                  onClose={() => setModalView("checkout")}
                  onPaymentSuccess={handleSaveAddressAndCheckout}
                />
              )
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
