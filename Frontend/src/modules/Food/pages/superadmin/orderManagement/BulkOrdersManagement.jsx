import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Building,
  MapPin,
  MessageSquare,
  Settings,
  Save,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  Loader2,
  X,
  ExternalLink,
  ChevronRight,
  Gift,
  PartyPopper,
  UploadCloud,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import apiClient from "@/services/api/axios"
import { uploadAPI } from "@/services/api"
import { toast } from "sonner"

function ImageUploadControl({
  label,
  value,
  onChange,
  onUpload,
  uploading,
  helperText,
  recommendedSize = "1200x500"
}) {
  const fileInputRef = useRef(null)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[11px] text-rose-500 hover:text-rose-600 font-semibold bg-transparent border-0 cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Image Preview & Upload Dropzone */}
      {value ? (
        <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 group">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80"
            }}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-white text-zinc-900 rounded-lg text-xs font-bold shadow-md cursor-pointer hover:bg-zinc-100 flex items-center gap-1.5 border-0"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E53935]" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 text-[#E53935]" />
                  <span>Change Image</span>
                </>
              )}
            </button>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-black/70 hover:bg-black text-white rounded-lg text-xs font-bold shadow-md flex items-center gap-1.5 no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Preview</span>
            </a>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className="w-full h-36 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#E53935] dark:hover:border-[#E53935] bg-zinc-50 dark:bg-zinc-800/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group p-4 text-center"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-[#E53935]" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
                Uploading image to server...
              </span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/50 text-[#E53935] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 m-0">
                  Click to browse and upload image
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 m-0 mt-0.5">
                  Supports PNG, JPG, WEBP • Recommended {recommendedSize}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onUpload}
      />

      {/* Direct URL input fallback */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="relative flex-1">
          <input
            type="url"
            placeholder="Or enter direct image URL (https://...)"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-3 pr-8 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935] transition-colors"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 bg-transparent border-0 cursor-pointer p-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700 flex items-center gap-1.5 shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#E53935]" />
          ) : (
            <UploadCloud className="w-3.5 h-3.5 text-[#E53935]" />
          )}
          <span>Upload File</span>
        </button>
      </div>
      {helperText && (
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 m-0">
          {helperText}
        </p>
      )}
    </div>
  )
}

export default function BulkOrdersManagement() {
  const [activeTab, setActiveTab] = useState("inquiries") // 'inquiries' | 'config'
  const [activeCmsTab, setActiveCmsTab] = useState("virtual_party") // 'virtual_party' | 'egift_voucher'

  // Inquiries State
  const [inquiries, setInquiries] = useState([])
  const [loadingInquiries, setLoadingInquiries] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    inProgressCount: 0,
    completedCount: 0
  })

  // Selected Inquiry for details modal
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  // Config State (Dynamic CMS)
  const [config, setConfig] = useState({
    virtualParty: {
      isActive: true,
      title: "Virtual Pizza Party",
      bannerImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
      title1: "WORK TOGETHER, EAT TOGETHER",
      description1: "As virtual parties have become the new way to bond and enjoy together, it's time to up these unique celebrations with a unique feast.",
      calloutText: "Introducing Papa Veg Pizza's Virtual Feast, a new way to place a bulk order for your virtual celebration and get it delivered in specially designed packages.",
      title2: "CELEBRATIONS MADE EASY",
      description2: "Convert your work from home into party from home with Papa Veg Pizza's Virtual Feast. Order some good old favourites from Papa Veg Pizza and celebrate with your colleagues in a new and safer way.",
      featureImage: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80",
      corporateEmail: "corporate.sales@papavegpizza.com",
      corporatePhone: "+91 9300990940"
    },
    egiftVoucher: {
      isActive: true,
      title: "E-Gift Voucher",
      bannerImage: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80",
      heading1: "LAUNCH YOUR GIFTING WITH US NOW",
      subheading1: "Get access to place order across Papa Veg Pizza stores in India via our app/website using E-Gift Voucher",
      feature1Title: "Easy and secure ordering",
      feature1Desc: "Place your E-Gift Voucher order with ease.",
      feature2Title: "Customized to meet business needs",
      feature2Desc: "Instant digital incentive with the flexibility of choosing the denominations.",
      feature3Title: "Flexible delivery option",
      feature3Desc: "Get your code delivered as an E-Gift card via e-mail.",
      heading2: "SMALL GESTURES GO A LONG WAY",
      description2: "Ultimate gifting for corporate and businesses. The Papa Veg Pizza's E-Gift Voucher is a great solution when it comes to rewarding and recognizing employees, customers and supporters with a sophisticated gifting platform.",
      featureImage: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1000&q=80",
      corporateEmail: "corporate.sales@papavegpizza.com",
      corporatePhone: "+91 9300990940",
      denominationOptions: [
        "25 - 50 Vouchers",
        "50 - 100 Vouchers",
        "100 - 500 Vouchers",
        "500+ Corporate Vouchers",
        "Custom Bulk Denomination"
      ],
      redeemHeading: "HOW TO REDEEM",
      redeemSubheading: "Redeem only on Papa Veg Pizza App and Website",
      redeemSteps: [
        {
          stepNumber: 1,
          title: "Place Order",
          description: "Open Papa Veg Pizza App or visit papavegpizza.com. Add products to your cart and proceed to pay.",
          icon: "cart"
        },
        {
          stepNumber: 2,
          title: "Payment Method",
          description: "Change the Payment Mode to Gift Card / eVoucher option.",
          icon: "card"
        },
        {
          stepNumber: 3,
          title: "e-Voucher / Gift Card Number",
          description: "Enter your 16 digit eVoucher number and Submit.",
          icon: "ticket"
        },
        {
          stepNumber: 4,
          title: "Make Payment",
          description: "To pay the balance (if any) use cash or online payment modes.",
          icon: "wallet"
        },
        {
          stepNumber: 5,
          title: "Enter Pin",
          description: "Enter voucher PIN and Submit.",
          icon: "lock"
        },
        {
          stepNumber: 6,
          title: "Check Your Final Payment",
          description: "Review your order and click on Pay Now.",
          icon: "check"
        }
      ]
    },
    contactPage: {
      feedbackHeading: "Have any feedback or queries? We'd love to hear from you. Write to us at",
      feedbackEmail: "guestcare@papavegpizza.com",
      outletButtonText: "FIND YOUR NEAREST OUTLET",
      outletButtonLink: "/food/user/delivery-location",
      outletHelpText: "Try our delicious treats and satisfy hunger with Papa Veg Pizza.",
      locateLinkText: "Locate Nearby Pizza Restaurants",
      locateLinkUrl: "/food/user/delivery-location",
      customerCareTitle: "Papa Veg Pizza Customer Care Number",
      customerCareNumber: "1800-889-1234",
      corporateOfficeTitle: "Papa Veg Pizza Corporate Office",
      companyName: "Papa Veg Pizza Private Limited",
      addressLine1: "12/2 M.G. Road, Near Palasia Square",
      addressLine2: "Indore - 452001, Madhya Pradesh, India",
      mapEmbedUrl:
        "https://maps.google.com/maps?q=Rajasthan&t=&z=7&ie=UTF8&iwloc=&output=embed",
      mapExternalUrl: "https://maps.google.com/?q=Rajasthan",
      facebookText: "Visit our page on Facebook",
      facebookUrl: "https://facebook.com/papavegpizza",
      googleText: "Visit our page on Google",
      googleUrl: "https://google.com/search?q=Papa+Veg+Pizza",
      instagramText: "Visit our page on Instagram",
      instagramUrl: "https://instagram.com/papavegpizza",
      twitterText: "Follow us on twitter for latest updates",
      twitterUrl: "https://twitter.com/papavegpizza"
    }
  })
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  // Fetch Inquiries
  const fetchInquiries = async () => {
    try {
      setLoadingInquiries(true)
      const q = new URLSearchParams()
      if (statusFilter && statusFilter !== "all") q.append("status", statusFilter)
      if (searchQuery.trim()) q.append("search", searchQuery.trim())

      const res = await apiClient.get(`/food/admin/bulk-orders?${q.toString()}`)
      const data = res?.data?.data || res?.data
      if (data) {
        let list = data.inquiries || []
        if (typeFilter && typeFilter !== "all") {
          list = list.filter(i => (i.type || "virtual_party") === typeFilter)
        }
        setInquiries(list)
        if (data.stats) setStats(data.stats)
      }
    } catch (err) {
      // Fallback
    } finally {
      setLoadingInquiries(false)
    }
  }

  // Fetch Config
  const fetchConfig = async () => {
    try {
      setLoadingConfig(true)
      const res = await apiClient.get("/food/admin/bulk-orders/config")
      const data = res?.data?.data || res?.data
      if (data) {
        setConfig(prev => ({
          ...prev,
          ...data,
          virtualParty: { ...prev.virtualParty, ...(data.virtualParty || {}) },
          egiftVoucher: { ...prev.egiftVoucher, ...(data.egiftVoucher || {}) },
          contactPage: { ...prev.contactPage, ...(data.contactPage || {}) }
        }))
      }
    } catch (_) {
    } finally {
      setLoadingConfig(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter, typeFilter])

  useEffect(() => {
    if (activeTab === "config") {
      fetchConfig()
    }
  }, [activeTab])

  // Status Update Handler
  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingStatusId(id)
      await apiClient.patch(`/food/admin/bulk-orders/${id}/status`, {
        status: newStatus
      })
      toast.success(`Inquiry status updated to ${newStatus.replace("_", " ")}`)
      setInquiries(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i))
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      toast.error("Failed to update status")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Delete Inquiry
  const handleDeleteInquiry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this bulk order inquiry?")) return
    try {
      await apiClient.delete(`/food/admin/bulk-orders/${id}`)
      toast.success("Inquiry deleted successfully")
      setInquiries(prev => prev.filter(i => i._id !== id))
      if (selectedInquiry?._id === id) setSelectedInquiry(null)
    } catch (err) {
      toast.error("Failed to delete inquiry")
    }
  }

  // Save Config Handler
  const handleSaveConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setSavingConfig(true)
    try {
      await apiClient.put("/food/admin/bulk-orders/config", config)
      toast.success("Bulk order page configuration updated successfully!")
    } catch (err) {
      toast.error("Failed to save configuration")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleVPChange = (field, val) => {
    setConfig(prev => ({
      ...prev,
      virtualParty: { ...prev.virtualParty, [field]: val }
    }))
  }

  const handleGVChange = (field, val) => {
    setConfig(prev => ({
      ...prev,
      egiftVoucher: { ...prev.egiftVoucher, [field]: val }
    }))
  }

  const handleCPChange = (field, val) => {
    setConfig(prev => ({
      ...prev,
      contactPage: { ...prev.contactPage, [field]: val }
    }))
  }

  // Image Upload Handler
  const [uploadingField, setUploadingField] = useState(null)

  const handleFileUpload = async (e, fieldKey, isGV = false) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP, etc.)")
      return
    }

    const uniqueKey = `${fieldKey}_${isGV ? "gv" : "vp"}`
    setUploadingField(uniqueKey)
    try {
      const res = await uploadAPI.uploadMedia(file, { folder: "bulk-orders" })
      const url = res?.data?.data?.url || res?.data?.url
      if (url) {
        if (isGV) {
          handleGVChange(fieldKey, url)
        } else {
          handleVPChange(fieldKey, url)
        }
        toast.success("Image uploaded successfully!")
      } else {
        toast.error("Failed to get uploaded image URL")
      }
    } catch (err) {
      console.error("Image upload failed:", err)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setUploadingField(null)
      e.target.value = ""
    }
  }

  // Redeem Steps Handlers (E-Gift Voucher)
  const handleAddRedeemStep = () => {
    const curSteps = config.egiftVoucher?.redeemSteps || []
    const newStep = {
      stepNumber: curSteps.length + 1,
      title: "New Step",
      description: "Description of the step",
      icon: "check"
    }
    handleGVChange("redeemSteps", [...curSteps, newStep])
  }

  const handleUpdateRedeemStep = (index, field, value) => {
    const curSteps = [...(config.egiftVoucher?.redeemSteps || [])]
    if (!curSteps[index]) return
    curSteps[index] = { ...curSteps[index], [field]: value }
    handleGVChange("redeemSteps", curSteps)
  }

  const handleRemoveRedeemStep = (index) => {
    const curSteps = (config.egiftVoucher?.redeemSteps || []).filter((_, i) => i !== index)
    const renumbered = curSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    handleGVChange("redeemSteps", renumbered)
  }

  const handleMoveRedeemStep = (index, direction) => {
    const curSteps = [...(config.egiftVoucher?.redeemSteps || [])]
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= curSteps.length) return
    const temp = curSteps[index]
    curSteps[index] = curSteps[targetIdx]
    curSteps[targetIdx] = temp
    const renumbered = curSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
    handleGVChange("redeemSteps", renumbered)
  }

  const vp = config.virtualParty || {}
  const gv = config.egiftVoucher || {}
  const cp = config.contactPage || {}

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans max-w-7xl mx-auto text-zinc-900 dark:text-white">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E53935]">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight m-0">
                Bulk Orders Management
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0">
                Track customer bulk party inquiries and dynamically configure the user app page
              </p>
            </div>
          </div>
        </div>

        {/* View on User App Button */}
        <div className="flex items-center gap-2">
          <a
            href="/food/user/bulk-order"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 no-underline text-zinc-800 dark:text-zinc-200"
          >
            <span>Live User Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── Tabs (Inquiries vs Dynamic CMS Config) ── */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab("inquiries")}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 bg-transparent cursor-pointer ${
            activeTab === "inquiries"
              ? "border-[#E53935] text-[#E53935]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          Customer Inquiries ({stats.total || inquiries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`pb-3 px-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 bg-transparent cursor-pointer flex items-center gap-1.5 ${
            activeTab === "config"
              ? "border-[#E53935] text-[#E53935]"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Page Content (Dynamic CMS)</span>
        </button>
      </div>

      {activeTab === "inquiries" ? (
        /* ── Tab 1: Customer Inquiries ── */
        <div className="space-y-5">
          {/* Metrics Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Requests
              </span>
              <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1 m-0">
                {stats.total || inquiries.length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block">
                New Leads
              </span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 m-0">
                {stats.newCount || inquiries.filter(i => i.status === "new").length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider block">
                In Progress
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 m-0">
                {stats.inProgressCount || inquiries.filter(i => i.status === "in_progress").length}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block">
                Completed
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 m-0">
                {stats.completedCount || inquiries.filter(i => i.status === "completed").length}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by name, company, email, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchInquiries()}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="virtual_party">Virtual Party</option>
                <option value="egift_voucher">E-Gift Voucher</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="contacted">Contacted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                type="button"
                onClick={fetchInquiries}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Inquiries Table */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-400 uppercase tracking-wider font-bold text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Customer / Organisation</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Occasion / Size</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {loadingInquiries ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#E53935]" />
                        <span>Loading bulk inquiries...</span>
                      </td>
                    </tr>
                  ) : inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400">
                        No bulk order inquiries found.
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((inq) => {
                      const dateStr = new Date(inq.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })

                      const isVoucher = inq.type === "egift_voucher"

                      return (
                        <tr
                          key={inq._id}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-zinc-500 whitespace-nowrap">
                            {dateStr}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isVoucher
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                            }`}>
                              {isVoucher ? "E-Gift Voucher" : "Virtual Party"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <p className="font-bold text-zinc-900 dark:text-white m-0">
                              {inq.name}
                            </p>
                            {inq.organisation && (
                              <p className="text-[11px] text-zinc-400 mt-0.5 m-0 flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                <span>{inq.organisation}</span>
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                            <a
                              href={`tel:${inq.phone}`}
                              className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-[#E53935] font-semibold"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{inq.phone}</span>
                            </a>
                            <a
                              href={`mailto:${inq.email}`}
                              className="flex items-center gap-1.5 text-zinc-400 hover:text-[#E53935] text-[11px]"
                            >
                              <Mail className="w-3 h-3" />
                              <span>{inq.email}</span>
                            </a>
                          </td>

                          <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                            {inq.location || "N/A"}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                              {inq.eventDate || inq.occasion || "N/A"}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={inq.status}
                              disabled={updatingStatusId === inq._id}
                              onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                              className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 outline-none border cursor-pointer ${
                                inq.status === "completed"
                                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200"
                                  : inq.status === "in_progress"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200"
                                  : inq.status === "contacted"
                                  ? "bg-sky-50 dark:bg-sky-950/40 text-sky-600 border-sky-200"
                                  : inq.status === "rejected"
                                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 border-rose-200"
                                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-200"
                              }`}
                            >
                              <option value="new">New</option>
                              <option value="in_progress">In Progress</option>
                              <option value="contacted">Contacted</option>
                              <option value="completed">Completed</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedInquiry(inq)}
                              className="p-1.5 text-zinc-400 hover:text-[#E53935] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInquiry(inq._id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer bg-transparent border-0"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ── Tab 2: Dynamic Page Content (CMS) ── */
        <form onSubmit={handleSaveConfig} className="space-y-6">
          {/* Subtabs for CMS: Virtual Party vs E-Gift Voucher vs Contact Page */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCmsTab("virtual_party")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeCmsTab === "virtual_party"
                  ? "bg-[#E53935] text-white border-[#E53935] shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              Virtual Pizza Party Content
            </button>
            <button
              type="button"
              onClick={() => setActiveCmsTab("egift_voucher")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeCmsTab === "egift_voucher"
                  ? "bg-[#E53935] text-white border-[#E53935] shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              E-Gift Voucher Content
            </button>
            <button
              type="button"
              onClick={() => setActiveCmsTab("contact_page")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                activeCmsTab === "contact_page"
                  ? "bg-[#E53935] text-white border-[#E53935] shadow-xs"
                  : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800"
              }`}
            >
              Contact Page Content
            </button>
          </div>

          {activeCmsTab === "virtual_party" && (
            /* Virtual Party CMS */
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold m-0 tracking-tight">
                  Virtual Pizza Party - Live Page Content
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                  Update texts, banners, and options for the Virtual Pizza Party tab
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Corporate Sales Email
                  </label>
                  <input
                    type="email"
                    value={vp.corporateEmail || ""}
                    onChange={(e) => handleVPChange("corporateEmail", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Corporate Contact Phone
                  </label>
                  <input
                    type="text"
                    value={vp.corporatePhone || ""}
                    onChange={(e) => handleVPChange("corporatePhone", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>

              <ImageUploadControl
                label="Top Graphic Banner Image"
                value={vp.bannerImage || ""}
                onChange={(val) => handleVPChange("bannerImage", val)}
                onUpload={(e) => handleFileUpload(e, "bannerImage", false)}
                uploading={uploadingField === "bannerImage_vp"}
                recommendedSize="1200x500"
                helperText="Appears as the header graphic for the Virtual Pizza Party tab."
              />

              {/* Section 1 */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E53935] m-0">
                  Section 1 Content
                </h3>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={vp.title1 || ""}
                    onChange={(e) => handleVPChange("title1", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={vp.description1 || ""}
                    onChange={(e) => handleVPChange("description1", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Highlight Blue Callout Box Text
                  </label>
                  <textarea
                    rows={2}
                    value={vp.calloutText || ""}
                    onChange={(e) => handleVPChange("calloutText", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>
              </div>

              {/* Section 2 */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E53935] m-0">
                  Section 2 Content
                </h3>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={vp.title2 || ""}
                    onChange={(e) => handleVPChange("title2", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={vp.description2 || ""}
                    onChange={(e) => handleVPChange("description2", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <ImageUploadControl
                  label="Feature Celebration Photo"
                  value={vp.featureImage || ""}
                  onChange={(val) => handleVPChange("featureImage", val)}
                  onUpload={(e) => handleFileUpload(e, "featureImage", false)}
                  uploading={uploadingField === "featureImage_vp"}
                  recommendedSize="1000x800"
                  helperText="Celebration image displayed under Celebrations Made Easy."
                />
              </div>
            </div>
          )}

          {activeCmsTab === "egift_voucher" && (
            /* E-Gift Voucher CMS */
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold m-0 tracking-tight">
                  E-Gift Voucher - Live Page Content
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                  Update texts, features, and denominations for the E-Gift Voucher tab
                </p>
              </div>

              <ImageUploadControl
                label="Top E-Gift Voucher Banner Image"
                value={gv.bannerImage || ""}
                onChange={(val) => handleGVChange("bannerImage", val)}
                onUpload={(e) => handleFileUpload(e, "bannerImage", true)}
                uploading={uploadingField === "bannerImage_gv"}
                recommendedSize="1200x500"
                helperText="Appears as the header graphic for the E-Gift Voucher tab."
              />

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E53935] m-0">
                  Gifting Intro Section
                </h3>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={gv.heading1 || ""}
                    onChange={(e) => handleGVChange("heading1", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Subheading / Description
                  </label>
                  <textarea
                    rows={2}
                    value={gv.subheading1 || ""}
                    onChange={(e) => handleGVChange("subheading1", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                {/* 3 Features */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 mb-1">Feature 1</label>
                    <input
                      type="text"
                      value={gv.feature1Title || ""}
                      onChange={(e) => handleGVChange("feature1Title", e.target.value)}
                      placeholder="Title"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs mb-1 bg-white dark:bg-zinc-900"
                    />
                    <textarea
                      rows={2}
                      value={gv.feature1Desc || ""}
                      onChange={(e) => handleGVChange("feature1Desc", e.target.value)}
                      placeholder="Description"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 mb-1">Feature 2</label>
                    <input
                      type="text"
                      value={gv.feature2Title || ""}
                      onChange={(e) => handleGVChange("feature2Title", e.target.value)}
                      placeholder="Title"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs mb-1 bg-white dark:bg-zinc-900"
                    />
                    <textarea
                      rows={2}
                      value={gv.feature2Desc || ""}
                      onChange={(e) => handleGVChange("feature2Desc", e.target.value)}
                      placeholder="Description"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-500 mb-1">Feature 3</label>
                    <input
                      type="text"
                      value={gv.feature3Title || ""}
                      onChange={(e) => handleGVChange("feature3Title", e.target.value)}
                      placeholder="Title"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs mb-1 bg-white dark:bg-zinc-900"
                    />
                    <textarea
                      rows={2}
                      value={gv.feature3Desc || ""}
                      onChange={(e) => handleGVChange("feature3Desc", e.target.value)}
                      placeholder="Description"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
              </div>

              {/* Corporate Card */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#E53935] m-0">
                  Gestures / Corporate Gifting Card
                </h3>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Heading
                  </label>
                  <input
                    type="text"
                    value={gv.heading2 || ""}
                    onChange={(e) => handleGVChange("heading2", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={gv.description2 || ""}
                    onChange={(e) => handleGVChange("description2", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                  />
                </div>

                <ImageUploadControl
                  label="Corporate Celebration Photo"
                  value={gv.featureImage || ""}
                  onChange={(val) => handleGVChange("featureImage", val)}
                  onUpload={(e) => handleFileUpload(e, "featureImage", true)}
                  uploading={uploadingField === "featureImage_gv"}
                  recommendedSize="1000x800"
                  helperText="Celebration image displayed under Small Gestures Go A Long Way."
                />
              </div>

              {/* How to Redeem CMS Section (Dynamic) */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#E53935] m-0">
                      How To Redeem Section (Dynamic)
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 m-0">
                      Configure the steps shown to users for redeeming E-Gift Vouchers on the live app
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRedeemStep}
                    className="px-3 py-1.5 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer border-0 flex items-center gap-1.5 shadow-xs w-fit"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Step</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Section Heading
                    </label>
                    <input
                      type="text"
                      value={gv.redeemHeading || "HOW TO REDEEM"}
                      onChange={(e) => handleGVChange("redeemHeading", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Section Subtitle
                    </label>
                    <input
                      type="text"
                      value={gv.redeemSubheading || "Redeem only on Papa Veg Pizza App and Website"}
                      onChange={(e) => handleGVChange("redeemSubheading", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>

                {/* Steps List */}
                <div className="space-y-3 pt-2">
                  {(gv.redeemSteps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 space-y-3 relative shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/50 text-[#E53935] font-black text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            Step {idx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveRedeemStep(idx, -1)}
                            title="Move Up"
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 bg-transparent border-0 cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === (gv.redeemSteps || []).length - 1}
                            onClick={() => handleMoveRedeemStep(idx, 1)}
                            title="Move Down"
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 bg-transparent border-0 cursor-pointer rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRedeemStep(idx)}
                            title="Delete Step"
                            className="p-1.5 text-zinc-400 hover:text-rose-500 bg-transparent border-0 cursor-pointer rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            Step Title
                          </label>
                          <input
                            type="text"
                            value={step.title || ""}
                            onChange={(e) => handleUpdateRedeemStep(idx, "title", e.target.value)}
                            placeholder="e.g. Place Order"
                            className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                            Icon
                          </label>
                          <select
                            value={step.icon || "check"}
                            onChange={(e) => handleUpdateRedeemStep(idx, "icon", e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                          >
                            <option value="cart">Shopping Cart</option>
                            <option value="card">Payment Card</option>
                            <option value="ticket">Ticket / Voucher</option>
                            <option value="wallet">Wallet</option>
                            <option value="lock">Lock / PIN</option>
                            <option value="check">Checkmark</option>
                            <option value="gift">Gift</option>
                            <option value="info">Info / Help</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                          Step Description
                        </label>
                        <textarea
                          rows={2}
                          value={step.description || ""}
                          onChange={(e) => handleUpdateRedeemStep(idx, "description", e.target.value)}
                          placeholder="Step instructions for the customer..."
                          className="w-full px-2.5 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                        />
                      </div>
                    </div>
                  ))}

                  {(gv.redeemSteps || []).length === 0 && (
                    <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <p className="text-xs text-zinc-400 m-0">No redeem steps configured.</p>
                      <button
                        type="button"
                        onClick={handleAddRedeemStep}
                        className="mt-2 text-xs font-bold text-[#E53935] hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        + Add First Step
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeCmsTab === "contact_page" && (
            /* Contact Page CMS */
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold m-0 tracking-tight">
                  Contact Page - Live Content & Details
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 m-0">
                  Manage the public contact information, customer care numbers, corporate office address, interactive map, and social media links.
                </p>
              </div>

              {/* ── 1. Feedback & Outlet Locator Box ── */}
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 m-0">
                  Feedback Card & Nearest Outlet Button
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Feedback / Query Heading Text
                    </label>
                    <input
                      type="text"
                      value={cp.feedbackHeading || ""}
                      onChange={(e) => handleCPChange("feedbackHeading", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Guest Care Email Address
                    </label>
                    <input
                      type="email"
                      value={cp.feedbackEmail || ""}
                      onChange={(e) => handleCPChange("feedbackEmail", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Nearest Outlet Button Text
                    </label>
                    <input
                      type="text"
                      value={cp.outletButtonText || ""}
                      onChange={(e) => handleCPChange("outletButtonText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Outlet Button Target Route / Link
                    </label>
                    <input
                      type="text"
                      value={cp.outletButtonLink || ""}
                      onChange={(e) => handleCPChange("outletButtonLink", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Help / Description Text Below Button
                    </label>
                    <input
                      type="text"
                      value={cp.outletHelpText || ""}
                      onChange={(e) => handleCPChange("outletHelpText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Locate Text (Clickable Link)
                    </label>
                    <input
                      type="text"
                      value={cp.locateLinkText || ""}
                      onChange={(e) => handleCPChange("locateLinkText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Locate Target Route / Link
                    </label>
                    <input
                      type="text"
                      value={cp.locateLinkUrl || ""}
                      onChange={(e) => handleCPChange("locateLinkUrl", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>
              </div>

              {/* ── 2. Customer Care & Corporate Office ── */}
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 m-0">
                  Customer Care & Corporate Office Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Customer Care Section Title
                    </label>
                    <input
                      type="text"
                      value={cp.customerCareTitle || ""}
                      onChange={(e) => handleCPChange("customerCareTitle", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Customer Care Number (Toll Free / Primary)
                    </label>
                    <input
                      type="text"
                      value={cp.customerCareNumber || ""}
                      onChange={(e) => handleCPChange("customerCareNumber", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Corporate Office Section Title
                    </label>
                    <input
                      type="text"
                      value={cp.corporateOfficeTitle || ""}
                      onChange={(e) => handleCPChange("corporateOfficeTitle", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Registered Company Name
                    </label>
                    <input
                      type="text"
                      value={cp.companyName || ""}
                      onChange={(e) => handleCPChange("companyName", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Office Address Line 1
                    </label>
                    <input
                      type="text"
                      value={cp.addressLine1 || ""}
                      onChange={(e) => handleCPChange("addressLine1", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Office Address Line 2 (City, Pincode, State, Country)
                    </label>
                    <input
                      type="text"
                      value={cp.addressLine2 || ""}
                      onChange={(e) => handleCPChange("addressLine2", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>
              </div>

              {/* ── 3. Social Media Channels ── */}
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 m-0">
                  Social Media Links & Labels
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Facebook Link Text
                    </label>
                    <input
                      type="text"
                      value={cp.facebookText || ""}
                      onChange={(e) => handleCPChange("facebookText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Facebook URL
                    </label>
                    <input
                      type="text"
                      value={cp.facebookUrl || ""}
                      onChange={(e) => handleCPChange("facebookUrl", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Google / G+ Link Text
                    </label>
                    <input
                      type="text"
                      value={cp.googleText || ""}
                      onChange={(e) => handleCPChange("googleText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Google Review / Search URL
                    </label>
                    <input
                      type="text"
                      value={cp.googleUrl || ""}
                      onChange={(e) => handleCPChange("googleUrl", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Instagram Link Text
                    </label>
                    <input
                      type="text"
                      value={cp.instagramText || ""}
                      onChange={(e) => handleCPChange("instagramText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Instagram Profile URL
                    </label>
                    <input
                      type="text"
                      value={cp.instagramUrl || ""}
                      onChange={(e) => handleCPChange("instagramUrl", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Twitter / X Link Text
                    </label>
                    <input
                      type="text"
                      value={cp.twitterText || ""}
                      onChange={(e) => handleCPChange("twitterText", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Twitter / X Profile URL
                    </label>
                    <input
                      type="text"
                      value={cp.twitterUrl || ""}
                      onChange={(e) => handleCPChange("twitterUrl", e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 bg-[#E53935] hover:bg-[#D32F2F] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/20 cursor-pointer border-0 flex items-center gap-2"
            >
              {savingConfig ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Dynamic Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── View Inquiry Details Modal ── */}
      <AnimatePresence>
        {selectedInquiry && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedInquiry(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E53935]">
                    <Users className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base m-0">Inquiry Details</h3>
                    <span className="text-[11px] text-zinc-400">
                      Received {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer bg-transparent border-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400 font-medium">Inquiry Type:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    selectedInquiry.type === "egift_voucher"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                  }`}>
                    {selectedInquiry.type === "egift_voucher" ? "E-Gift Voucher" : "Virtual Party"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 font-medium">Customer Name:</span>
                    <p className="font-bold text-zinc-900 dark:text-white mt-0.5 m-0 text-sm">
                      {selectedInquiry.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium">Organisation:</span>
                    <p className="font-bold text-zinc-900 dark:text-white mt-0.5 m-0 text-sm">
                      {selectedInquiry.organisation || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-400 font-medium">Contact Phone:</span>
                    <p className="font-bold text-zinc-900 dark:text-white mt-0.5 m-0">
                      <a href={`tel:${selectedInquiry.phone}`} className="text-[#E53935] hover:underline">
                        {selectedInquiry.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium">Email:</span>
                    <p className="font-bold text-zinc-900 dark:text-white mt-0.5 m-0">
                      <a href={`mailto:${selectedInquiry.email}`} className="text-[#E53935] hover:underline">
                        {selectedInquiry.email}
                      </a>
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-400 font-medium">Location:</span>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 m-0">
                    {selectedInquiry.location || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 font-medium">Selected Date / Occasion:</span>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 m-0">
                    {selectedInquiry.eventDate ? `Date: ${selectedInquiry.eventDate}` : selectedInquiry.occasion || "N/A"}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-400 font-medium">Customer Query / Message:</span>
                  <div className="mt-1 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedInquiry.query || "No additional message provided."}
                  </div>
                </div>

                {/* Status Switcher in Modal */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-zinc-400 font-medium">Update Status:</span>
                  <select
                    value={selectedInquiry.status}
                    onChange={(e) => handleStatusChange(selectedInquiry._id, e.target.value)}
                    className="text-xs font-bold rounded-lg px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 outline-none cursor-pointer"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
