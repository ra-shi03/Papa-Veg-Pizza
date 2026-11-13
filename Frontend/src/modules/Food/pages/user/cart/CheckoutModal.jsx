import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, MapPin, Check, User, Clock, ShieldCheck, CreditCard, ChevronRight, AlertTriangle, Home as HomeIcon, Navigation, MessageSquare } from "lucide-react"
import { useCart } from "@food/context/CartContext"
import { useProfile } from "@food/context/ProfileContext"
import { useAppConfig } from "@food/context/AppConfigContext"
import { motion, AnimatePresence } from "framer-motion"
import { initRazorpayPayment } from "@food/utils/razorpay"
import { usePaymentGateways } from "./usePaymentGateways"
import apiClient from "@/services/api/axios"
import { orderAPI, userAPI } from "@food/api"
import { toast } from "sonner"
import { slotLabel, toOrderItems, readPaymentMethod } from "./cartHelpers"
import CheckoutStepper from "./CheckoutStepper"
import PaymentSuccessScreen from "../orders/PaymentSuccessScreen"
import { readTrainJourney, trainOrderFields, trainStoreQuery } from "@food/utils/trainJourney"
import {
  addressProblem,
  assertOwnOrderDetails,
  buildOrderDetails,
  contactFromAccount,
  contactProblem,
  houseFromStreet,
  isSamePlace,
  readPickedLocation,
  readRememberedDelivery,
  rememberedFromOrderAddress,
  saveRememberedDelivery,
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
  const payMethod = readPaymentMethod(appConfig, usePaymentGateways())
  const isLoggedIn = localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
  const isGuestCheckoutBlocked = appConfig?.guestCheckoutEnabled === false && !isLoggedIn

  // Navigation / View state: "address", "checkout", "contact_edit", "payment"
  const [modalView, setModalView] = useState("address")
  // A saved address that is already complete goes straight to the summary, once per time the checkout opens
  const skippedAddressStep = useRef(false)

  // Form inputs
  const [houseNumber, setHouseNumber] = useState("")
  const [houseError, setHouseError] = useState("")
  const [landmark, setLandmark] = useState("")
  const [instructions, setInstructions] = useState("")
  // The address this order goes to (checkoutDetails.js); null until the customer has selected one
  const [selectedAddress, setSelectedAddress] = useState(null)
  const selectedAddressKey = useRef(null)
  // Which address the form was last pre-filled for, and where from (shown as a small note)
  const prefilledFor = useRef("")
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])
  const [prefilledFrom, setPrefilledFrom] = useState("")
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
      setModalView("address") // start with the address form; a complete saved address skips it (below)
      skippedAddressStep.current = false
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
    // The customer already saved this address with its house / flat number: nothing to ask, they can edit it from the summary
    if (!skippedAddressStep.current && selected?.kind === "saved" && String(selected.street || "").trim()) {
      skippedAddressStep.current = true
      setModalView("checkout")
    }
  }, [show, addresses])

  // Pre-fill house / flat, landmark and delivery instructions from what this customer entered before: on this device, or
  // in their last order. The house and landmark only carry over when it is the same place; instructions follow the person.
  useEffect(() => {
    if (!show || !selectedAddress || !isLoggedIn) return
    const key = `${selectedAddress.kind}:${selectedAddress.id || selectedAddress.display}`
    if (prefilledFor.current === key) return
    prefilledFor.current = key
    setPrefilledFrom("")

    const apply = ({ house, landmark: lm, instructions: note }, from) => {
      let used = false
      if (house && selectedAddress.kind !== "saved") {
        setHouseNumber((current) => { if (current.trim()) return current; used = true; return house })
      }
      if (lm && selectedAddress.kind !== "saved") setLandmark((current) => (current.trim() ? current : lm))
      if (note) setInstructions((current) => (current.trim() ? current : note.slice(0, 200)))
      if (house || lm || note) setPrefilledFrom(from)
      return used
    }

    const remembered = readRememberedDelivery(contactOwnerId.current)
    if (remembered) {
      const same = isSamePlace(selectedAddress, remembered)
      apply({ house: same ? remembered.house : "", landmark: same ? remembered.landmark : "", instructions: remembered.instructions }, "your last order")
      if (same && remembered.house) return
    }

    // Nothing on this device (new browser, cleared data): ask for the last order instead
    orderAPI.getOrders({ limit: 1, page: 1 })
      .then((res) => {
        if (!mounted.current) return
        const data = res?.data?.data
        const last = (data?.orders || data?.docs || (Array.isArray(data) ? data : []))[0]
        const place = rememberedFromOrderAddress(last?.deliveryAddress || last?.address, last?.note)
        if (!place) return
        const same = isSamePlace(selectedAddress, place)
        apply({ house: same ? houseFromStreet(place.street, selectedAddress) : "", landmark: same ? place.landmark : "", instructions: place.instructions }, "your last order")
      })
      .catch(() => {})
  }, [show, selectedAddress, isLoggedIn])

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

  // Tapping a finished step in the progress bar goes back to it
  const goToStep = (index) => {
    if (index === 0) triggerContactEdit()
    else if (index === 1) setModalView("address")
    else if (index === 2 && !isPaymentOptionDisabled) {
      onClose()
      navigate("/user/account/profile-details/payments", { state: { from: "checkout", total } })
    }
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
  // Shown from the moment Razorpay says the payment went through, until the order page takes over
  const [paidScreen, setPaidScreen] = useState(false)

  // Pays an online order through Razorpay's own checkout. "paid": verified by the server; "unverified": the customer
  // paid but the server could not confirm it yet (the order stays); "abandoned": not paid, so the order is cancelled
  // and the cart is kept for another try.
  const collectOnlinePayment = async (orderId, razorpay) => {
    const abandon = async (message) => {
      try { await orderAPI.cancelOrder(orderId, { reason: "Online payment was not completed" }) } catch (_) {}
      toast.error(message)
      return "abandoned"
    }
    if (!razorpay?.key || !razorpay?.orderId) return abandon("Online payment is not available right now. Please choose Cash on Delivery.")
    return new Promise((resolve) => {
      let settled = false
      const finish = (value) => { if (!settled) { settled = true; resolve(value) } }
      initRazorpayPayment({
        key: razorpay.key,
        amount: razorpay.amount,
        currency: razorpay.currency,
        order_id: razorpay.orderId,
        description: "Papa Veg Pizza order",
        prefill: { name: contactName, email: contactEmail, contact: contactPhone },
        notes: { orderId: String(orderId) },
        handler: async (res) => {
          setPaidScreen(true)
          try {
            await orderAPI.verifyPayment({
              orderId: String(orderId),
              razorpayOrderId: res.razorpay_order_id,
              razorpayPaymentId: res.razorpay_payment_id,
              razorpaySignature: res.razorpay_signature,
            })
            finish("paid")
          } catch (err) {
            toast.error(`Payment received (${res.razorpay_payment_id}) but not confirmed yet. Please contact support if it does not update.`)
            finish("unverified")
          }
        },
        onClose: () => { if (!settled) abandon("Payment was cancelled. Your cart is still here.").then(finish) },
        onError: (err) => toast.error(err?.description || "Payment failed. You can try again."),
      }).catch(() => {
        if (!settled) abandon("Could not open the payment window. Please try again.").then(finish)
      })
    })
  }

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
    let razorpayPayload = null
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
        ...(orderDetails.customerEmail ? { customerEmail: orderDetails.customerEmail } : {}),
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
        // What the customer chose on the Payment Options page: online goes through Razorpay, otherwise pay on delivery
        paymentMethod: payMethod.kind === "online" ? "razorpay" : "cash",
        note: instructions.trim(),
      }, { contact, selected: selectedAddress }))
      const created = response?.data?.data?.order
      orderId = created?._id || created?.id
      razorpayPayload = response?.data?.data?.razorpay || null
      if (!orderId) throw new Error("Order could not be created")
    } catch (err) {
      setPlacingOrder(false)
      toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || "Could not place your order")
      return false
    }
    if (payMethod.kind === "online") {
      const result = await collectOnlinePayment(orderId, razorpayPayload)
      if (result === "abandoned") {
        setPaidScreen(false)
        setPlacingOrder(false)
        return false
      }
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
    saveRememberedDelivery(contactOwnerId.current, { selected: selectedAddress, houseNumber, landmark, instructions })
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
    navigate(`/user/orders/${orderId}?confirmed=true${payMethod.kind === "online" ? "&paid=1" : ""}`)
    return true
  }

  return (
    <>
    <AnimatePresence>{paidScreen && <PaymentSuccessScreen key="paid" paid />}</AnimatePresence>
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
                <CheckoutStepper current={1} onStepClick={goToStep} isDarkMode={isDarkMode} />

                {/* Title Bar */}
                <div className="px-4 pt-3.5 pb-3 flex items-center gap-3">
                  <button
                    onClick={() => (skippedAddressStep.current ? setModalView("checkout") : onClose())}
                    aria-label="Back"
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer border-0 active:scale-95 transition-all"
                  >
                    <ArrowLeft className="w-[18px] h-[18px] text-zinc-800 dark:text-white stroke-[2.5px]" />
                  </button>
                  <div className="min-w-0">
                    <h1 className="text-[15px] font-black tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Help us deliver to you faster
                    </h1>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                      A few details help the delivery partner find you.
                    </p>
                  </div>
                </div>

                {/* Scrollable form */}
                <div className="px-4 pb-4 space-y-4 overflow-y-auto min-h-0 flex-1">
                  {/* Delivering to */}
                  <div className="flex items-center gap-3 rounded-2xl p-3 border bg-primary/5 dark:bg-primary/10" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(229,57,53,0.16)" }}>
                    <span className="w-10 h-10 shrink-0 rounded-full bg-primary/15 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block leading-none">Delivering to</span>
                      <p className="text-xs font-bold leading-snug mt-1 line-clamp-2">{currentAddress}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose()
                        const base = window.location.pathname.startsWith("/food") ? "/food" : ""
                        navigate(`${base}/user/location/setup`, { state: { from: window.location.pathname } })
                      }}
                      className="shrink-0 text-[11px] font-black text-primary bg-transparent border-0 cursor-pointer px-1 py-1"
                    >
                      Change
                    </button>
                  </div>

                  {/* House / flat number */}
                  {prefilledFrom && (houseNumber || landmark || instructions) && (
                    <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/15 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3} />
                      Filled in from {prefilledFrom}. Change anything that is different this time.
                    </p>
                  )}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="checkout-house" className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                      House / flat number <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <HomeIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${houseError ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
                      <input
                        id="checkout-house"
                        type="text"
                        value={houseNumber}
                        onChange={(e) => { setHouseNumber(e.target.value); if (houseError) setHouseError("") }}
                        placeholder="e.g. Flat 302, Tower B"
                        autoComplete="address-line1"
                        aria-invalid={!!houseError}
                        className={`w-full pl-10 pr-4 py-3.5 text-[13px] rounded-xl border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-semibold ${houseError ? "border-primary" : "border-zinc-200 dark:border-zinc-800"}`}
                      />
                    </div>
                    {houseError && <p role="alert" className="text-[11px] font-semibold text-primary">{houseError}</p>}
                  </div>

                  {/* Landmark */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="checkout-landmark" className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                      Landmark <span className="font-medium text-zinc-400">(optional)</span>
                    </label>
                    <div className="relative">
                      <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <input
                        id="checkout-landmark"
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. Near City Mall gate"
                        autoComplete="address-line2"
                        className="w-full pl-10 pr-4 py-3.5 text-[13px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-semibold"
                      />
                    </div>
                  </div>

                  {/* Delivery instructions */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="checkout-notes" className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                      Delivery instructions <span className="font-medium text-zinc-400">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Leave at the door", "Call on arrival", "Don't ring the bell"].map((chip) => {
                        const on = instructions.includes(chip)
                        return (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setInstructions((prev) => (prev.includes(chip) ? prev.replace(chip, "").replace(/\s*[.,]\s*$/, "").trim() : (prev.trim() ? `${prev.trim().replace(/[.,]$/, "")}. ${chip}` : chip)).slice(0, 200))}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer transition-all active:scale-95 ${on ? "bg-primary text-white border-primary" : "bg-transparent text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-primary/50"}`}
                          >
                            {chip}
                          </button>
                        )
                      })}
                    </div>
                    <div className="relative">
                      <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                      <textarea
                        id="checkout-notes"
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value.slice(0, 200))}
                        placeholder="Anything else the delivery partner should know?"
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 text-[13px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all font-semibold resize-none"
                      />
                      <span className="absolute right-3 bottom-2 text-[10px] font-medium text-zinc-400">{instructions.length}/200</span>
                    </div>
                  </div>
                </div>

                {/* Save/Action Button */}
                <div className="px-4 pt-3 pb-5 border-t bg-white dark:bg-[#111111]" style={{ borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", boxShadow: "0 -8px 20px rgba(0,0,0,0.04)" }}>
                  <button
                    onClick={() => {
                      if (blockedByAddress()) return
                      if (!houseNumber.trim()) {
                        setHouseError("Please add your house or flat number")
                        document.getElementById("checkout-house")?.focus()
                        return
                      }
                      setModalView("checkout") // transition to checkout dashboard
                    }}
                    className="w-full h-12 rounded-xl text-[13px] font-extrabold tracking-wide transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-[0.98] cursor-pointer shadow-lg shadow-primary/25 flex items-center justify-center gap-1.5"
                  >
                    Save address &amp; continue
                    <ChevronRight className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </>
            )}

            {/* View 2: Secure Checkout Summary dashboard (Image 1) */}
            {modalView === "checkout" && (
              <>
                {/* Step Progress Bar Header */}
                <CheckoutStepper current={3} onStepClick={goToStep} isDarkMode={isDarkMode} />

                {/* Header Title */}
                <div className="px-4 pt-4 pb-2 flex items-center gap-3">
                  <button
                    onClick={() => setModalView("address")}
                    aria-label="Back to address"
                    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer border-0 active:scale-95 transition-all"
                  >
                    <ArrowLeft className="w-[18px] h-[18px] text-zinc-800 dark:text-white stroke-[2.5px]" />
                  </button>
                  <div className="min-w-0 text-left">
                    <h1 className="text-lg font-black tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Secure Checkout
                    </h1>
                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">Review your order before you pay.</p>
                  </div>
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
                      {landmark && <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-normal">{landmark}</p>}
                      {instructions && <p className="text-[11px] italic text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5">Note: {instructions}</p>}
                    </div>
                    <button 
                      onClick={() => setModalView("address")}
                      className="text-xs font-black text-primary hover:text-primary-hover bg-transparent border-0 outline-none cursor-pointer"
                    >
                      Edit
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
                  ) : payMethod.kind === "cash" ? (
                    <button
                      onClick={handleSaveAddressAndCheckout}
                      disabled={placingOrder}
                      className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-60"
                    >
                      {placingOrder ? "Placing order..." : "Place Order (Cash / UPI on Delivery)"}
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveAddressAndCheckout}
                      disabled={placingOrder}
                      className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border-0 bg-primary hover:bg-primary-hover text-white active:scale-95 cursor-pointer shadow-md shadow-primary/10 disabled:opacity-60"
                    >
                      {placingOrder ? "Processing..." : `Pay ₹${Number(total.toFixed(2))} securely`}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  )
}
