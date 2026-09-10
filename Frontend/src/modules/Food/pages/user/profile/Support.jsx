import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Pizza } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { supportAPI } from "@food/api"
import { toast } from "sonner"

export default function Support() {
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState("")
  const [selectedIssues, setSelectedIssues] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : true
  })

  const issuesList = [
    "Code did not work",
    "Store team did not apply the coupon",
    "Wrong coupon info",
    "Do not know how to redeem",
    "Other"
  ]

  const handleCheckboxChange = (issue) => {
    setSelectedIssues((prev) =>
      prev.includes(issue)
        ? prev.filter((i) => i !== issue)
        : [...prev, issue]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!couponCode.trim()) {
      toast.error("Please enter the coupon code.")
      return
    }

    if (selectedIssues.length === 0) {
      toast.error("Please select at least one issue.")
      return
    }

    setSubmitting(true)

    // Build description payload
    const description = `Coupon Code: ${couponCode.trim()}\nSelected Issues:\n${selectedIssues.map(i => `- ${i}`).join("\n")}`

    try {
      const payload = {
        type: "coupon",
        issueType: selectedIssues[0], // primary issue selected
        description
      }

      const res = await supportAPI.createTicket(payload)
      const data = res?.data

      if (!data?.success && data?.message) {
        throw new Error(data.message)
      }

      toast.success("Issue reported successfully!")
      navigate("/user/account/coupons")
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit issue. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatedPage className={`min-h-screen pb-20 select-none transition-colors duration-300 ${
      isDarkMode ? "dark bg-[#111111] text-white" : "bg-[#f8f9fa] text-zinc-900"
    }`}>
      
      {/* Header 1 */}
      <header className={`sticky top-0 left-0 w-full z-50 h-14 flex items-center px-4 justify-between border-b transition-colors ${
        isDarkMode ? "bg-[#111111]/90 backdrop-blur-md border-white/10 text-white" : "bg-white/90 backdrop-blur-md border-zinc-200 text-zinc-950"
      }`}>
        <button
          onClick={() => navigate("/user/account/coupons")}
          className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
            isDarkMode ? "text-white hover:bg-white/10" : "text-zinc-950 hover:bg-zinc-100"
          }`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-bold text-center flex-1 pr-8">
          Exclusive Offers for you
        </h1>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-5 flex flex-col mt-4">
        
        {/* Header 2 (Sub-header with back arrow and Papa Veg Pizza logo) */}
        <div className={`flex items-center h-12 border-b mb-4 ${
          isDarkMode ? "border-white/10" : "border-zinc-200"
        }`}>
          <button
            onClick={() => navigate("/user/account/coupons")}
            className={`flex items-center justify-center p-2 rounded-full cursor-pointer transition-all active:scale-95 bg-transparent border-0 outline-none ${
              isDarkMode ? "text-zinc-400 hover:text-white" : "text-zinc-650 hover:text-zinc-950"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Brand Logo & Name */}
          <div className="flex-1 flex items-center justify-center pr-8 gap-1.5">
            <Pizza className="w-5 h-5 text-[#E53935]" />
            <span className="text-sm font-black uppercase tracking-wider text-[#E53935] font-sans">
              Papa Veg Pizza
            </span>
          </div>
        </div>

        {/* Form Title */}
        <h2 className={`text-base font-extrabold text-left mb-6 font-sans ${
          isDarkMode ? "text-white" : "text-zinc-900"
        }`}>
          Report an issue
        </h2>

        {/* Issue Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          
          {/* Coupon Code Input */}
          <div className="flex flex-col gap-2">
            <label className={`text-xs font-extrabold font-sans ${
              isDarkMode ? "text-zinc-300" : "text-zinc-700"
            }`}>
              Enter the coupon code facing issues
            </label>
            <input
              type="text"
              placeholder="Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              disabled={submitting}
              className={`h-12 px-4 border rounded-xl text-sm font-sans font-semibold focus:outline-none focus:border-[#E53935] transition-all ${
                isDarkMode 
                  ? "bg-white/5 border-white/10 text-white placeholder-zinc-500" 
                  : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400"
              }`}
            />
          </div>

          {/* Issue Checkboxes list */}
          <div className="flex flex-col gap-3.5 mt-2">
            <label className={`text-xs font-extrabold font-sans ${
              isDarkMode ? "text-zinc-300" : "text-zinc-700"
            }`}>
              What's the issue?
            </label>
            
            <div className="flex flex-col gap-3">
              {issuesList.map((issue, idx) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={selectedIssues.includes(issue)}
                    onChange={() => handleCheckboxChange(issue)}
                    disabled={submitting}
                    className="w-5 h-5 rounded border border-zinc-300 dark:border-zinc-750 text-[#E53935] focus:ring-[#E53935] cursor-pointer"
                  />
                  <span className={`text-xs font-bold font-sans transition-colors ${
                    isDarkMode 
                      ? "text-zinc-400 group-hover:text-zinc-200" 
                      : "text-zinc-550 group-hover:text-zinc-900"
                  }`}>
                    {issue}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex gap-4 mt-8">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => navigate("/user/account/coupons")}
              disabled={submitting}
              className={`flex-1 h-12 rounded-xl text-xs font-extrabold font-sans cursor-pointer transition-all active:scale-[0.98] outline-none border-0 ${
                isDarkMode 
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                  : "bg-zinc-150 hover:bg-zinc-200 text-zinc-750"
              }`}
            >
              Cancel
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-12 rounded-xl text-xs font-extrabold font-sans text-white cursor-pointer transition-all active:scale-[0.98] outline-none border-0 bg-[#E53935] hover:bg-red-700 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting...</span>
                </div>
              ) : (
                "Submit"
              )}
            </button>
          </div>

        </form>

      </main>

    </AnimatedPage>
  )
}
