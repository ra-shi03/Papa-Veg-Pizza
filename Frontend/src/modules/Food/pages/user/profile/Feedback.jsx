import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Calendar, ThumbsUp, ThumbsDown, CheckCircle, ChevronDown } from "lucide-react"
import Header from "@food/components/user/Header"
import { Button } from "@food/components/ui/button"

const CITIES_STORES = {
  "Mumbai": ["Bandra West Store", "Andheri Link Road Store", "Colaba Causeway Store", "Thane Viviana Mall Store"],
  "Pune": ["Koregaon Park Store", "Kothrud Depot Store", "Viman Nagar Phoenix Store"],
  "Delhi": ["Connaught Place Store", "Saket Select City Store", "Rajouri Garden Store"],
  "Bangalore": ["Indiranagar 100ft Road Store", "Koramangala 5th Block Store", "Jayanagar Store"],
  "Ahmedabad": ["C.G. Road Store", "Satellite Area Store", "Sindhu Bhavan Store"]
}

export default function Feedback() {
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    store: "",
    orderType: "",
    orderMethod: "",
    timeOfVisit: "",
    dateOfVisit: "",
    orderId: "",
    experience: "", // "appreciation" or "complaint"
    feedbackText: ""
  })

  // Error States
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("appTheme") === "dark"
    setIsDarkMode(isDark)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSelectCity = (e) => {
    const selectedCity = e.target.value
    setForm(prev => ({ ...prev, city: selectedCity, store: "" }))
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: "", store: "" }))
    }
  }

  const handleRadioChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!form.name.trim()) newErrors.name = "Your name is required"
    if (!form.email.trim()) {
      newErrors.email = "Your email is required"
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Your phone number is required"
    } else if (!/^\d{10}$/.test(form.phone.replace(/[^0-9]/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit number"
    }
    if (!form.city) newErrors.city = "Please select a city"
    if (!form.store) newErrors.store = "Please select a store"
    if (!form.orderType) newErrors.orderType = "Please select an order type"
    if (!form.orderMethod) newErrors.orderMethod = "Please select an order method"
    if (!form.timeOfVisit) newErrors.timeOfVisit = "Please select visit time"
    if (!form.dateOfVisit) newErrors.dateOfVisit = "Please select visit date"
    if (!form.experience) newErrors.experience = "Please rate your experience"
    if (!form.feedbackText.trim()) newErrors.feedbackText = "Please write your feedback description"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0]
      const errorEl = document.getElementsByName(firstErrorKey)[0] || document.getElementById(firstErrorKey)
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    setLoading(true)
    // Simulate API request
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <div
      className={`font-body-md text-body-md min-h-screen flex flex-col transition-colors duration-300 ${isDarkMode ? "dark bg-[#111111] text-[#e5e2e1]" : "bg-[#f5f5f5] text-[#1c1b1b]"}`}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .feedback-banner {
          background-color: #CB202D !important;
          color: #ffffff !important;
        }
        .feedback-bg {
          background-image: radial-gradient(rgba(0,0,0,0.03) 1px, transparent 0), radial-gradient(rgba(0,0,0,0.03) 1px, transparent 0);
          background-size: 8px 8px;
          background-position: 0 0, 4px 4px;
        }
        .dark .feedback-bg {
          background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 0), radial-gradient(rgba(255,255,255,0.02) 1px, transparent 0);
        }
        .custom-input {
          background-color: ${isDarkMode ? "rgba(255,255,255,0.05)" : "#ffffff"} !important;
          border: 1px solid ${isDarkMode ? "rgba(255,255,255,0.15)" : "#dddddd"} !important;
          color: ${isDarkMode ? "#ffffff" : "#1c1b1b"} !important;
        }
        .custom-input:focus {
          border-color: #CB202D !important;
          outline: none;
        }
        .submit-btn {
          background-color: #CB202D !important;
          color: #ffffff !important;
          transition: all 0.2s ease-in-out;
        }
        .submit-btn:hover {
          opacity: 0.9;
        }
        .submit-btn:active {
          transform: scale(0.97);
        }
        .footer-bg {
          background-color: #0b0b0b !important;
        }
        .logo-text {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 900;
          color: #CB202D;
        }
      ` }} />

      {/* Header */}
      <Header
        title="Give feedback"
        showBack={true}
        onBack={() => navigate("/account")}
        showThemeToggle={false}
      />

      {/* Main scrolling content */}
      <div className="flex-1 mt-16 max-w-md mx-auto w-full feedback-bg flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">

          {/* Header Banner Section */}
          <div className="bg-white dark:bg-[#131313] py-6 px-5 flex flex-col items-center border-b border-gray-100 dark:border-white/5">
            {/* Logo replacement for Papa Veg Pizza brand */}
            <div className="flex items-center gap-2 mb-3">
              <span className="logo-text text-2xl uppercase tracking-tighter">
                🍕 Papa Veg Pizza
              </span>
            </div>

            {/* Red header banner banner banner */}
            <div className="feedback-banner w-full rounded-2xl py-6 px-4 text-center font-bold text-lg md:text-xl tracking-tight shadow-md">
              We would love to hear your feedback
            </div>
          </div>

          {/* Form Content container */}
          <div className="p-5 space-y-6">

            {/* Section 1: User details */}
            <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-1 text-left">
                Let us know you better
              </h3>

              {/* Name */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Your name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter Name"
                  className="custom-input rounded-xl px-4 py-3 text-sm transition-all"
                />
                {errors.name && <span className="text-[11px] text-red-500 font-bold">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Your email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="custom-input rounded-xl px-4 py-3 text-sm transition-all"
                />
                {errors.email && <span className="text-[11px] text-red-500 font-bold">{errors.email}</span>}
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Your number<span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="custom-input rounded-xl px-4 py-3 text-sm transition-all"
                />
                {errors.phone && <span className="text-[11px] text-red-500 font-bold">{errors.phone}</span>}
              </div>
            </div>

            {/* Section 2: Store Details */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-1 text-left">
                Store Details
              </h3>

              {/* City Dropdown */}
              <div className="flex flex-col gap-1.5 text-left" id="city">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  City of the Papa Veg Pizza<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="city"
                    value={form.city}
                    onChange={handleSelectCity}
                    className="custom-input rounded-xl px-4 py-3 text-sm w-full appearance-none pr-10"
                  >
                    <option value="">-Select-</option>
                    {Object.keys(CITIES_STORES).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
                </div>
                {errors.city && <span className="text-[11px] text-red-500 font-bold">{errors.city}</span>}
              </div>

              {/* Store Dropdown */}
              <div className="flex flex-col gap-1.5 text-left" id="store">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Select Store<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="store"
                    value={form.store}
                    disabled={!form.city}
                    onChange={handleChange}
                    className="custom-input rounded-xl px-4 py-3 text-sm w-full appearance-none pr-10 disabled:opacity-50"
                  >
                    <option value="">{!form.city ? "Select a city first" : "-Select Store-"}</option>
                    {form.city && CITIES_STORES[form.city].map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
                </div>
                {errors.store && <span className="text-[11px] text-red-500 font-bold">{errors.store}</span>}
              </div>

              {/* Order Type Radio Buttons */}
              <div className="flex flex-col gap-2 text-left" id="orderType">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Order Type<span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-4">
                  {["In-car", "Take Away", "Delivery", "Delivery on train"].map(type => (
                    <label key={type} className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="orderType"
                        checked={form.orderType === type}
                        onChange={() => handleRadioChange("orderType", type)}
                        className="w-4 h-4 accent-[#CB202D] cursor-pointer"
                      />
                      {type}
                    </label>
                  ))}
                </div>
                {errors.orderType && <span className="text-[11px] text-red-500 font-bold">{errors.orderType}</span>}
              </div>

              {/* Order Method Radio Buttons */}
              <div className="flex flex-col gap-2 text-left" id="orderMethod">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Order Method<span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "At the Store", value: "At the Store" },
                    { label: "Papa Veg Pizza (App)", value: "App" },
                    { label: "Aggregator (Swiggy/Zomato)", value: "Aggregator" }
                  ].map(method => (
                    <label key={method.value} className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="radio"
                        name="orderMethod"
                        checked={form.orderMethod === method.value}
                        onChange={() => handleRadioChange("orderMethod", method.value)}
                        className="w-4 h-4 accent-[#CB202D] cursor-pointer"
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
                {errors.orderMethod && <span className="text-[11px] text-red-500 font-bold">{errors.orderMethod}</span>}
              </div>

              {/* Time of Visit Dropdown */}
              <div className="flex flex-col gap-1.5 text-left" id="timeOfVisit">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Time Of Visit<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="timeOfVisit"
                    value={form.timeOfVisit}
                    onChange={handleChange}
                    className="custom-input rounded-xl px-4 py-3 text-sm w-full appearance-none pr-10"
                  >
                    <option value="">Select Time</option>
                    <option value="11:00 AM - 02:00 PM">11:00 AM - 02:00 PM</option>
                    <option value="02:00 PM - 05:00 PM">02:00 PM - 05:00 PM</option>
                    <option value="05:00 PM - 08:00 PM">05:00 PM - 08:00 PM</option>
                    <option value="08:00 PM - 11:00 PM">08:00 PM - 11:00 PM</option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60 pointer-events-none" />
                </div>
                {errors.timeOfVisit && <span className="text-[11px] text-red-500 font-bold">{errors.timeOfVisit}</span>}
              </div>

              {/* Date of Visit Input */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Date of Visit<span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    name="dateOfVisit"
                    value={form.dateOfVisit}
                    onChange={handleChange}
                    className="custom-input rounded-xl px-4 py-3 text-sm w-full"
                  />
                </div>
                {errors.dateOfVisit && <span className="text-[11px] text-red-500 font-bold">{errors.dateOfVisit}</span>}
              </div>

              {/* Order ID Input */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Your Order Id
                </label>
                <input
                  type="text"
                  name="orderId"
                  value={form.orderId}
                  onChange={handleChange}
                  placeholder="Order ID"
                  className="custom-input rounded-xl px-4 py-3 text-sm transition-all"
                />
              </div>
            </div>

            {/* Section 3: Feedback & Rating */}
            <div className="space-y-4 pt-2">
              <h3 className="text-lg font-black text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-1 text-left">
                Tell us about your experience<span className="text-red-500">*</span>
              </h3>
              <p className="text-xs opacity-75 text-left leading-relaxed">
                Would you like to give the staff recognition for the amazing Papa Veg Pizza experience, or raise a complaint?
              </p>

              {/* Appreciation or Complaint radio selection */}
              <div className="flex flex-col gap-3 py-1 text-left" id="experience">
                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="experience"
                    checked={form.experience === "appreciation"}
                    onChange={() => handleRadioChange("experience", "appreciation")}
                    className="w-4 h-4 accent-[#CB202D] cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    Appreciation <ThumbsUp className="w-4 h-4 text-green-600" />
                  </span>
                </label>
                <label className="flex items-center gap-3 text-sm font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="experience"
                    checked={form.experience === "complaint"}
                    onChange={() => handleRadioChange("experience", "complaint")}
                    className="w-4 h-4 accent-[#CB202D] cursor-pointer"
                  />
                  <span className="flex items-center gap-1.5">
                    Complaint <ThumbsDown className="w-4 h-4 text-red-500" />
                  </span>
                </label>
                {errors.experience && <span className="text-[11px] text-red-500 font-bold">{errors.experience}</span>}
              </div>

              {/* Detailed Feedback input */}
              <div className="flex flex-col gap-1.5 text-left" id="feedbackText">
                <label className="text-xs font-bold text-slate-700 dark:text-[#e4beb9]">
                  Your Feedback<span className="text-red-500">*</span>
                </label>
                <textarea
                  name="feedbackText"
                  rows={4}
                  value={form.feedbackText}
                  onChange={handleChange}
                  placeholder="Enter your feedback"
                  className="custom-input rounded-xl px-4 py-3 text-sm transition-all resize-none"
                />
                {errors.feedbackText && <span className="text-[11px] text-red-500 font-bold">{errors.feedbackText}</span>}
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-4 pb-2">
              <button
                type="submit"
                disabled={loading}
                className="submit-btn w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer border-none disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>

          </div>

          {/* Black Footer Section */}
          <div className="footer-bg text-white py-12 px-6 text-center text-xs space-y-6 mt-auto">
            <p className="leading-relaxed opacity-75 max-w-sm mx-auto">
              Order a delicious pizza on the go, anywhere, anytime. Papa Veg Pizza is happy to assist you with your home delivery. Every time you order, you get a hot and fresh pizza delivered at your doorstep in less than thirty minutes.
            </p>
            <p className="text-[10px] font-bold tracking-widest opacity-60">
              *T&amp;C Apply. Hurry up and place your order now!
            </p>
            <div className="border-t border-white/10 pt-6">
              <p className="opacity-55">
                © {new Date().getFullYear()} Papa Veg Pizza India. All rights reserved. <br />
                License Number: 10017011004220
              </p>
            </div>
          </div>

        </form>
      </div>

      {/* Success Modal overlay */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm flex items-center justify-center p-5"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#151515] p-8 rounded-[2rem] text-center max-w-xs w-full shadow-2xl border border-gray-100 dark:border-white/5 space-y-4"
            >
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Thank You!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  We have received your feedback. Your opinion helps us serve you better at Papa Veg Pizza.
                </p>
              </div>
              <button
                onClick={() => {
                  setSubmitted(false)
                  navigate("/account")
                }}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs hover:opacity-90 transition-opacity active:scale-95 border-none cursor-pointer"
              >
                Back to Account
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
