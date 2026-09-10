import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function DeliverOnTrainModal({ show, onClose }) {
  const navigate = useNavigate()
  
  // Theme state synced with local storage or default to dark
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "light" ? false : true
  })

  // States for PNR flow
  const [pnr, setPnr] = useState("")
  const [agreed, setAgreed] = useState(true)
  const [loading, setLoading] = useState(false)
  const [journeyData, setJourneyData] = useState(null)
  const [selectedStation, setSelectedStation] = useState("")
  const [seatNo, setSeatNo] = useState("")
  const [coachNo, setCoachNo] = useState("")
  const [pnrError, setPnrError] = useState("")

  // Modal / Drawer states
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: "" })

  const triggerToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 2500)
  }

  // Load custom fonts & icons
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

  // Sync theme changes with localStorage
  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light")
  }, [isDarkMode])

  // PNR submit logic
  const handlePnrSubmit = (e) => {
    e.preventDefault()
    
    // PNR number validation (exactly 10 digits)
    const cleanPnr = pnr.replace(/\D/g, "")
    if (cleanPnr.length !== 10) {
      setPnrError("Please enter a valid 10-digit IRCTC PNR number.")
      return
    }
    
    if (!agreed) {
      triggerToast("You must agree to the Terms & Conditions")
      return
    }

    setPnrError("")
    setLoading(true)
    
    // Simulate real IRCTC API retrieval
    setTimeout(() => {
      setLoading(false)
      setJourneyData({
        trainNo: "12050",
        trainName: "GATIMAN EXPRESS",
        date: "Tomorrow, 03 Jun 2026",
        from: "H. NIZAMUDDIN (NZM)",
        to: "AGRA CANTT (AGC)",
        stations: [
          { name: "H. Nizamuddin (NZM)", time: "08:10 AM", catered: false },
          { name: "Mathura Jn (MTJ)", time: "09:15 AM", catered: true },
          { name: "Agra Cantt (AGC)", time: "09:50 AM", catered: true }
        ]
      })
      triggerToast("Journey details retrieved!")
    }, 1800)
  }

  // Handle station selection & routing
  const handleConfirmOrder = () => {
    if (!selectedStation) {
      triggerToast("Please select a delivery station")
      return
    }
    if (!coachNo || !seatNo) {
      triggerToast("Please enter your Coach and Seat number")
      return
    }

    // Save journey delivery details to localStorage
    const deliveryDetails = `Train: ${journeyData.trainName} (${journeyData.trainNo}), Coach: ${coachNo.toUpperCase()}, Seat: ${seatNo}, Station: ${selectedStation}`
    localStorage.setItem("deliveryAddress", deliveryDetails)
    localStorage.setItem("activeService", "train")
    
    triggerToast("Delivery details set! Redirecting to menu...")
    setTimeout(() => {
      navigate("/user/menu")
    }, 1000)
  }

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[60] font-body-md overflow-y-auto overflow-x-hidden pb-12 transition-colors duration-300 animate-fadeIn ${isDarkMode ? "dark bg-[#111111] text-[#e5e2e1]" : "bg-[#fbf9f8] text-[#1c1b1b]"}`}
    >
      {/* Styles Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.85)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 4px 20px rgba(0, 0, 0, 0.04)"} !important;
        }
        .header-glass {
          background: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
          backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }
        `
      }} />

      {/* Custom Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl glass-card font-label-sm text-xs border border-white/20 animate-bounce">
          {toast.message}
        </div>
      )}

      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 header-glass h-16 flex items-center justify-between px-5">
        <button
          onClick={onClose}
          className={`material-symbols-outlined hover:opacity-80 transition-all active:scale-90 cursor-pointer bg-transparent border-0 outline-none ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`}
        >
          arrow_back
        </button>
        <h1 className={`font-headline-lg-mobile text-lg font-bold ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`}>Deliver on Train</h1>
        <button
          onClick={() => {
            setIsDarkMode(!isDarkMode)
            triggerToast(isDarkMode ? "Switched to Light mode" : "Switched to Dark mode")
          }}
          className="material-symbols-outlined text-[#E53935] hover:opacity-80 transition-opacity active:scale-95 cursor-pointer bg-transparent border-0 outline-none"
        >
          {isDarkMode ? "light_mode" : "dark_mode"}
        </button>
      </header>

      {/* Main Container */}
      <main className="mt-16 max-w-md mx-auto space-y-4 px-4 pt-4">
        
        {/* PIZZA ON YOUR SEAT Banner */}
        <section className={`w-full overflow-hidden rounded-2xl relative shadow-md border ${isDarkMode ? "bg-[#1d2d38] border-sky-900/30" : "bg-[#E1F5FE] border-sky-100"}`}>
          <div className="p-5 pr-32 relative z-10">
            <h2 className="text-[#0288D1] font-bold text-sm tracking-wider uppercase mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              PIZZA ON YOUR SEAT
            </h2>
            <p className={`text-xs leading-relaxed font-semibold max-w-[200px] ${isDarkMode ? "text-sky-100" : "text-sky-900"}`}>
              We will deliver your favourite Pizza right on your train seat while you travel
            </p>
          </div>
          
          {/* Custom Beautiful SVG Vector Illustration */}
          <div className="absolute right-0 bottom-0 top-0 w-36 flex items-end justify-end pointer-events-none opacity-90">
            <svg viewBox="0 0 160 120" className="w-full h-full">
              {/* Ceiling light lamps */}
              <line x1="40" y1="0" x2="40" y2="25" stroke={isDarkMode ? "#0288D1" : "#0288D1"} strokeWidth="1.5" />
              <circle cx="40" cy="25" r="4" fill="#FFC107" />
              <path d="M34 25 L46 25 L43 20 L37 20 Z" fill={isDarkMode ? "#00838F" : "#0288D1"} />

              <line x1="110" y1="0" x2="110" y2="25" stroke={isDarkMode ? "#0288D1" : "#0288D1"} strokeWidth="1.5" />
              <circle cx="110" cy="25" r="4" fill="#FFC107" />
              <path d="M104 25 L116 25 L113 20 L107 20 Z" fill={isDarkMode ? "#00838F" : "#0288D1"} />

              {/* High Speed Train vector outline */}
              <path d="M140 100 L70 100 L50 85 L90 85 L140 85 Z" fill={isDarkMode ? "#006064" : "#B2EBF2"} />
              <path d="M50 85 L70 100 L120 100" stroke="#0288D1" strokeWidth="2" fill="none" />
              {/* Train windows */}
              <rect x="95" y="89" width="10" height="6" rx="1" fill={isDarkMode ? "#e0f7fa" : "#01579B"} />
              <rect x="110" y="89" width="10" height="6" rx="1" fill={isDarkMode ? "#e0f7fa" : "#01579B"} />
              <rect x="125" y="89" width="10" height="6" rx="1" fill={isDarkMode ? "#e0f7fa" : "#01579B"} />
              {/* Train Nose window */}
              <path d="M58 87 L68 87 L64 92 Z" fill="#01579B" />
              
              {/* Delivery boy on scooter icon style */}
              <g transform="translate(10, 55)">
                {/* Wheels */}
                <circle cx="15" cy="40" r="8" fill="#546E7A" stroke="#ECEFF1" strokeWidth="1" />
                <circle cx="45" cy="40" r="8" fill="#546E7A" stroke="#ECEFF1" strokeWidth="1" />
                {/* Scooter Frame */}
                <path d="M15 40 L25 40 L35 32 L45 40 L45 28 L30 28 Z" fill="#E53935" />
                <rect x="10" y="22" width="12" height="12" rx="2" fill="#E53935" /> {/* Delivery box */}
                <circle cx="16" cy="28" r="3" fill="white" />
                {/* Handlebar */}
                <line x1="42" y1="28" x2="38" y2="18" stroke="#37474F" strokeWidth="2.5" />
                <circle cx="38" cy="18" r="2" fill="#E53935" />
                {/* Scooter headlight */}
                <circle cx="45" cy="28" r="1.5" fill="#FFF" />
              </g>
            </svg>
          </div>
        </section>

        {/* Enter PNR Form Card */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className={`font-bold text-base ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Enter PNR to get started
          </h3>

          <form onSubmit={handlePnrSubmit} className="space-y-4">
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="text"
                  maxLength="10"
                  pattern="\d*"
                  value={pnr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "")
                    setPnr(val)
                    if (pnrError) setPnrError("")
                  }}
                  placeholder="Enter PNR"
                  className={`w-full h-12 bg-white/5 border rounded-xl px-4 text-sm font-bold outline-none transition-all ${
                    pnrError 
                      ? "border-red-500 text-red-500" 
                      : pnr.length === 10 
                        ? "border-green-500 focus:border-green-500" 
                        : "border-white/10 focus:border-[#E53935]/50"
                  } ${isDarkMode ? "text-white" : "text-zinc-900 bg-[#FAF9F6]"}`}
                />
                {pnr.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPnr("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 hover:text-white/80 bg-transparent border-0"
                  >
                    cancel
                  </button>
                )}
              </div>

              {pnrError ? (
                <p className="text-red-500 text-[11px] font-bold mt-1">{pnrError}</p>
              ) : (
                <p className="text-[#00C853] text-[11px] font-bold mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">check_circle</span>
                  Valid PNR Number is Mandatory
                </p>
              )}
            </div>

            {/* Checkbox agreement */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded accent-[#E53935] cursor-pointer"
              />
              <span className={`text-xs opacity-75 font-semibold leading-snug ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
                I agree to the IRCTC Ordering Terms & Conditions
              </span>
            </label>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={loading || pnr.length < 10}
              className={`w-full h-12 rounded-xl bg-[#E53935] hover:bg-red-700 text-white font-bold text-sm tracking-wider uppercase transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                pnr.length < 10 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit</span>
              )}
            </button>
          </form>
        </section>

        {/* Dynamic Journey Details Drawer (Rendered after successful PNR retrieval) */}
        {journeyData && (
          <section className="glass-card rounded-2xl p-5 space-y-4 border border-[#00C853]/30 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div>
                <h4 className="text-[#00C853] font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  PNR VERIFIED
                </h4>
                <p className={`text-base font-bold mt-0.5 ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`}>
                  {journeyData.trainName} ({journeyData.trainNo})
                </p>
              </div>
              <span className="text-[10px] bg-[#E53935]/15 text-[#E53935] px-2 py-0.5 rounded font-extrabold uppercase">
                {journeyData.date}
              </span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs opacity-80">
                <div>
                  <span className="block opacity-50 uppercase tracking-widest text-[9px] font-bold">From Station</span>
                  <span className="font-extrabold">{journeyData.from}</span>
                </div>
                <div>
                  <span className="block opacity-50 uppercase tracking-widest text-[9px] font-bold">To Station</span>
                  <span className="font-extrabold">{journeyData.to}</span>
                </div>
              </div>

              {/* Station Selection */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className={`block text-xs font-bold ${isDarkMode ? "text-white" : "text-zinc-800"}`}>
                  1. Select Station to Order Food
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {journeyData.stations.map((st) => (
                    <button
                      key={st.name}
                      type="button"
                      disabled={!st.catered}
                      onClick={() => setSelectedStation(st.name)}
                      className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                        !st.catered 
                          ? "opacity-40 cursor-not-allowed border-transparent bg-white/2" 
                          : selectedStation === st.name 
                            ? "bg-[#E53935]/10 border-[#E53935] text-[#E53935]" 
                            : "bg-white/5 border-white/10 hover:bg-white/10 text-inherit"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold">{st.name}</span>
                        <span className="text-[10px] opacity-60">Arrival: {st.time}</span>
                      </div>
                      {st.catered ? (
                        <span className="text-[9px] bg-[#00C853]/15 text-[#00C853] px-2 py-0.5 rounded font-black uppercase">
                          Papa Veg Pizza Available
                        </span>
                      ) : (
                        <span className="text-[9px] bg-white/10 opacity-70 px-2 py-0.5 rounded font-black uppercase">
                          Not Catered
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coach & Seat Number details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-60 font-bold tracking-wider">Coach No.</label>
                  <input 
                    type="text"
                    placeholder="e.g. A1, S3"
                    value={coachNo}
                    onChange={(e) => setCoachNo(e.target.value)}
                    className={`w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-extrabold outline-none focus:border-[#E53935]/40 ${isDarkMode ? "text-white" : "text-zinc-900 bg-white"}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase opacity-60 font-bold tracking-wider">Seat No.</label>
                  <input 
                    type="text"
                    placeholder="e.g. 24, 45"
                    value={seatNo}
                    onChange={(e) => setSeatNo(e.target.value)}
                    className={`w-full h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-extrabold outline-none focus:border-[#E53935]/40 ${isDarkMode ? "text-white" : "text-zinc-900 bg-white"}`}
                  />
                </div>
              </div>

              {/* Confirm & Proceed Button */}
              <button
                onClick={handleConfirmOrder}
                className="w-full h-12 mt-2 rounded-xl bg-[#00C853] hover:bg-green-700 text-white font-extrabold text-xs uppercase tracking-widest shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <span>Proceed to Order Food</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </section>
        )}

        {/* IRCTC Order History Card */}
        <section 
          onClick={() => setShowHistoryModal(true)}
          className="glass-card rounded-2xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[#E53935] font-black">train</span>
            <span className={`text-xs font-extrabold uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`}>
              IRCTC ORDER HISTORY
            </span>
          </div>
          <span className="material-symbols-outlined opacity-60">chevron_right</span>
        </section>

        {/* IRCTC Terms and Conditions Card */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className={`font-bold text-xs uppercase tracking-wider ${isDarkMode ? "text-white" : "text-[#1c1b1b]"}`}>
            IRCTC T&C
          </h3>
          
          <ul className="space-y-3 pl-0 text-xs opacity-85 leading-relaxed">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] mt-1.5 shrink-0" />
              <span>Ordering is only allowed for stations which are catered by Papa Veg Pizza and are ahead by 2 hours or more.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] mt-1.5 shrink-0" />
              <span>Delivery is available only between 12:00 and 23:00 hours. The order would get cancelled if train reaches selected station outside of these operational hours.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E53935] mt-1.5 shrink-0" />
              <span>Cancellation is only permitted within 2 hours of actual arrival at station.</span>
            </li>
          </ul>

          <button
            onClick={() => setShowTermsModal(true)}
            className="text-[#E53935] font-extrabold text-xs flex items-center gap-0.5 cursor-pointer bg-transparent border-0 outline-none hover:opacity-80 pt-1"
          >
            Read More <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </section>
      </main>

      {/* IRCTC ORDER HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm rounded-3xl p-6 space-y-4 text-left ${isDarkMode ? "bg-[#181818] border border-white/10" : "bg-white border border-black/10 shadow-2xl"}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className={`font-headline-lg-mobile text-base font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                Train Order History
              </h3>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className={`material-symbols-outlined hover:opacity-100 cursor-pointer bg-transparent border-0 outline-none ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                close
              </button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {/* Past Order Item 1 */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#00C853]">
                  <span>Delivered</span>
                  <span className="text-white/40">24 May 2026</span>
                </div>
                <div className="text-xs">
                  <p className="font-extrabold text-white">1x Margherita Supreme (Medium)</p>
                  <p className="opacity-60 text-[10px] mt-0.5">Train 12050 (Seat C2-18), Mathura Jn</p>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-white/5 font-extrabold">
                  <span className="opacity-60">Total Paid</span>
                  <span className="text-white">₹348</span>
                </div>
              </div>

              {/* Past Order Item 2 */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#E53935]">
                  <span>Cancelled</span>
                  <span className="text-white/40">10 Apr 2026</span>
                </div>
                <div className="text-xs">
                  <p className="font-extrabold text-white">2x Farmhouse Delight (Personal)</p>
                  <p className="opacity-60 text-[10px] mt-0.5">Train 12626 (Seat A3-4), Agra Cantt</p>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-white/5 font-extrabold">
                  <span className="opacity-60">Refund Status</span>
                  <span className="text-[#00C853]">Refunded (₹598)</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowHistoryModal(false)}
              className="w-full h-11 bg-[#E53935] text-white font-bold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-lg active:scale-95 transition-all"
            >
              Close History
            </button>
          </div>
        </div>
      )}

      {/* IRCTC TERMS & CONDITIONS MORE INFO MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm rounded-3xl p-6 space-y-4 text-left ${isDarkMode ? "bg-[#181818] border border-white/10" : "bg-white border border-black/10 shadow-2xl"}`}>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className={`font-headline-lg-mobile text-base font-extrabold ${isDarkMode ? "text-white" : "text-zinc-900"}`}>
                IRCTC Guidelines & FAQ
              </h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className={`material-symbols-outlined hover:opacity-100 cursor-pointer bg-transparent border-0 outline-none ${isDarkMode ? "text-white/50" : "text-black/50"}`}
              >
                close
              </button>
            </div>
            
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 text-xs opacity-90 leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-extrabold text-[#E53935]">How does train delivery work?</h4>
                <p className="opacity-75">We partner with authorized ecatering services to deliver fresh Papa Veg Pizza directly to your train coach and seat. You just need a valid PNR number of a running train.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-[#E53935]">Can I pay with Cash on Delivery?</h4>
                <p className="opacity-75">To ensure seamless deliveries on active trains, only online pre-payment is supported. This prevents delay when trains halt for limited durations.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-[#E53935]">What if my train gets delayed?</h4>
                <p className="opacity-75">We track your train real-time. If the train reaches the designated catered station outside the operational delivery hours (12:00 PM - 11:00 PM), the order is automatically cancelled and a full refund is processed within 3 business days.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-[#E53935]">Is a PNR number mandatory?</h4>
                <p className="opacity-75">Yes. We verify live journey details with the IRCTC database. Without a valid, active PNR number, we are unable to process the order or guarantee deliveries.</p>
              </div>
            </div>

            <button 
              onClick={() => setShowTermsModal(false)}
              className="w-full h-11 bg-[#E53935] text-white font-bold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-lg active:scale-95 transition-all"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
