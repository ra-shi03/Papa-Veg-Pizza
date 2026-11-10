import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Check, User, Clock, ShieldCheck, CreditCard, ChevronRight, AlertTriangle } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import { useProfile } from "@food/context/ProfileContext"
import { useAppConfig } from "@food/context/AppConfigContext"
import { motion, AnimatePresence } from "framer-motion"
import RazorpayPayment from "./RazorpayPayment"
import apiClient from "@/services/api/axios"
import { orderAPI, userAPI } from "@food/api"
import { toast } from "sonner"
import { slotLabel, toOrderItems, readPaymentMethod } from "./cartHelpers"
import { readTrainJourney, trainOrderFields, trainStoreQuery } from "@food/utils/trainJourney"
import {
  addressProblem,
  assertOwnOrderDetails,
  buildOrderDetails,
  contactFromAccount,
  contactProblem,
  readPickedLocation,
  selectDeliveryAddress,
  toTenDigitPhone,
} from "./checkoutDetails"

export default function CheckoutModal({
  show,
  onClose,
  cartItems,
  couponCode,
  subtotal,
  discount,
  handlingCharge,
  cgst,
  sgst,
  total,
  scheduledAt,
  onChangeTime,
  onOrderPlaced,
  blockedMessage
}) {
  const navigate = useNavigate()
  const { replaceCart, clearCart } = useCart()
  const { addAddress, addresses, paymentMethods } = useProfile()
  const { config: appConfig } = useAppConfig()
  const isPaymentOptionDisabled = appConfig?.paymentOptionEnabled === false
  // Chosen on the Payment Options page
  const payMethod = readPaymentMethod(appConfig)
  const isLoggedIn = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
  const isGuestCheckoutBlocked = appConfig?.guestCheckoutEnabled === false && !isLoggedIn

  // Navigation / View state: "address", "checkout", "contact_edit", "payment"
  const [modalView, setModalView] = useState("address")

  // Form inputs
  const [houseNumber, setHouseNumber] = useState("")
  const [landmark, setLandmark] = useState("")
  const [instructions, setInstructions] = useState("")
  // The address this order goes to (checkoutDetails.js); null until the customer has selected one
  const [selectedAddress, setSelectedAddress] = useState(null)
  const selectedAddressKey = useRef(null)
  const currentAddress = selectedAddress?.display || ""

  // Contact Details: the signed-in customer's own, from their profile; empty until loaded
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactLoading, setContactLoading] = useState(false)
  const contactOwnerId = useRef(null)
  const contactEdited = useRef(false)

  // Contact Details Temp Editing State
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editEmail, setEditEmail] = useState("")

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
    }
  }, [show])

  // The address the customer selected. A saved address fills the form; a newly picked location still needs the house number.
  useEffect(() => {
    if (!show) return
    const activeService = localStorage.getItem("activeService") || "delivery"
    const isTrainOrder = activeService === "train" || (localStorage.getItem("deliveryAddress") || "").toLowerCase().includes("train")
    const selected = selectDeliveryAddress({
      saved: addresses,
      picked: readPickedLocation(),
      service: isTrainOrder ? "train" : activeService,
    })
    setSelectedAddress(selected)
    const key = selected ? `${selected.kind}:${selected.id || selected.display}` : ""
    if (key !== selectedAddressKey.current) {
      selectedAddressKey.current = key
      // A train has no house number: the coach and seat fill the field, so the delivery partner finds the seat
      const journey = selected?.kind === "service" ? readTrainJourney() : null
      setHouseNumber(selected?.kind === "saved" ? selected.street : journey ? `Coach ${journey.coach}, Seat ${journey.seat}` : "")
      setLandmark(selected?.kind === "saved" ? selected.additionalDetails : "")
    }
  }, [show, addresses])

  // The customer's own contact details, always read fresh for the signed-in account
  useEffect(() => {
    if (!show || !isLoggedIn) return
    let current = true
    setContactLoading(true)
    userAPI.getMyProfile()
      .then((res) => {
        if (!current) return
        const account = res?.data?.data?.account
        if (contactOwnerId.current !== account?.id) {
          contactOwnerId.current = account?.id
          contactEdited.current = false
        }
        if (contactEdited.current) return
        const contact = contactFromAccount(account)
        setContactName(contact.name)
        setContactPhone(contact.phone)
        setContactEmail(contact.email)
      })
      .catch((err) => console.warn("Could not load the customer's contact details", err))
      .finally(() => {
        if (current) setContactLoading(false)
      })
    return () => {
      current = false
    }
  }, [show, isLoggedIn])

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
    const problem = contactProblem({ name: editName, phone: editPhone })
    if (problem) {
      toast.error(problem)
      return
    }
    contactEdited.current = true
    setContactName(editName.trim())
    setContactPhone(toTenDigitPhone(editPhone))
    setContactEmail(editEmail.trim())
    setModalView("checkout")
  }

  // Open Contact editing
  const triggerContactEdit = () => {
    setEditName(contactName)
    setEditPhone(contactPhone)
    setEditEmail(contactEmail)
    setModalView("contact_edit")
  }

  // No address selected: say so and send the customer to the location screen
  const blockedByAddress = () => {
    const problem = addressProblem(selectedAddress)
    if (!problem) return false
    toast.error(problem)
    onClose()
    const base = window.location.pathname.startsWith("/food") ? "/food" : ""
    navigate(`${base}/user/location/setup`, { state: { from: window.location.pathname } })
    return true
  }

  // A contact field is empty: say so and open the contact form
  const blockedByContact = () => {
    if (contactLoading) {
      toast.info("Loading your details. Please try again in a moment.")
      return true
    }
    const problem = contactProblem({ name: contactName, phone: contactPhone })
    if (!problem) return false
    toast.error(problem)
    triggerContactEdit()
    return true
  }

  // Final Order placement
  const [placingOrder, setPlacingOrder] = useState(false)

  const handleSaveAddressAndCheckout = async () => {
    // true only when the order was placed: the payment screen shows success from this
    if (placingOrder) return false
    if (blockedMessage) {
      toast.error(blockedMessage)
      return false
    }
    if (blockedByAddress() || blockedByContact()) return false
    if (!houseNumber.trim()) {
      toast.error("House number or flat number is required")
      setModalView("address")
      return false
    }

    const contact = { name: contactName, phone: contactPhone, email: contactEmail }
    const orderDetails = buildOrderDetails({ contact, selected: selectedAddress, houseNumber, landmark })

    // A location the customer has not saved yet becomes their Home address, so stores near it can see them.
    // A Home address they already have is left as it is.
    if (selectedAddress.kind === "picked" && !addresses.some((address) => address?.label === "Home")) {
      Promise.resolve(addAddress({
        ...orderDetails.address,
        location: undefined,
        latitude: selectedAddress.point?.lat,
        longitude: selectedAddress.point?.lng,
        isDefault: true,
      })).catch((e) => console.warn("Failed saving address to profile, continuing order placement", e))
    }

    const activeService = localStorage.getItem("activeService") || "delivery"
    const savedDeliveryAddress = localStorage.getItem("deliveryAddress") || ""
    const isTrain = activeService === "train" || savedDeliveryAddress.toLowerCase().includes("train")
    const trainJourney = readTrainJourney()
    const trainPnr = trainJourney?.pnr || ""

    // Pick the store that serves this delivery location, then place the order with it.
    let orderId
    setPlacingOrder(true)
    try {
      const point = selectedAddress.point

      // A scheduled order needs a store that can deliver at that time (it may be closed right now)
      const resolved = await apiClient.get("/food/stores/resolve", {
        params: { ...(trainStoreQuery(trainJourney) || point || {}), ...(scheduledAt ? { at: scheduledAt } : {}) },
        _isFallback: true,
      })
      const store = resolved?.data?.data
      if (!store?.storeId) throw new Error("No store is available right now")

      const response = await orderAPI.createOrder(assertOwnOrderDetails({
        storeId: store.storeId,
        customerName: orderDetails.customerName,
        customerPhone: orderDetails.customerPhone,
        address: {
          ...orderDetails.address,
          street: isTrain && savedDeliveryAddress ? savedDeliveryAddress : orderDetails.address.street,
          additionalDetails: isTrain && trainPnr ? `IRCTC Train PNR: ${trainPnr}` : orderDetails.address.additionalDetails,
        },
        // The server turns these into the address and the rider's delivery notes
        ...(trainJourney ? { train: trainOrderFields(trainJourney) } : {}),
        items: toOrderItems(cartItems),
        ...(couponCode ? { couponCode } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
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
      }, { contact, selected: selectedAddress }))
      const created = response?.data?.data?.order
      orderId = created?._id || created?.id
      if (!orderId) throw new Error("Order could not be created")
    } catch (err) {
      setPlacingOrder(false)
      toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Could not place your order")
      return false
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
            street: savedDeliveryAddress || orderDetails.address.street,
            additionalDetails: `Train delivery PNR: ${trainPnr}`,
            city: orderDetails.address.city
          }
        }
        localStorage.setItem("pvp_train_orders", JSON.stringify([trainOrderEntry, ...existing]))
      } catch (_) {}
    }

    // Tell the cart this order is placed: an empty cart must not send the customer to the menu now
    onOrderPlaced?.()

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
    return true
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
                      if (blockedByAddress()) return
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
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-normal">{contactPhone ? `+91 ${contactPhone}` : ""}</p>
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
                      <p className="text-xs font-semibold leading-normal">Order for {scheduledAt ? slotLabel(scheduledAt) : "Now (ASAP)"}</p>
                    </div>
                    {appConfig?.scheduledOrdersEnabled !== false && onChangeTime && (
                      <button 
                        onClick={onChangeTime}
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

                  {/* Row 4: Payment (UPI / Credit Card) */}
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
                        <p className="text-xs font-semibold leading-normal">{payMethod.title}</p>
                      )}
                    </div>
                    {!isPaymentOptionDisabled && (
                      <button 
                        onClick={() => {
                          onClose()
                          navigate("/user/account/profile-details/payments", { state: { from: "checkout", total } })
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
                  ) : payMethod.id === "cash" ? (
                    <button
                      onClick={handleSaveAddressAndCheckout}
                      disabled={placingOrder}
                      className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-60"
                    >
                      {placingOrder ? "Placing order..." : "Place Order (Cash / UPI on Delivery)"}
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        if (blockedByAddress() || blockedByContact()) return
                        setModalView("payment")
                      }}
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
