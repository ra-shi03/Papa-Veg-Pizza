import React, { useState, useEffect } from "react"
import { Map, X, Battery, Wifi, Navigation, ShieldCheck, RefreshCw, Compass, AlertCircle, ShoppingBag, Clock } from "lucide-react"
import { getDeliveryPartnerLiveTracking } from "../mockManagersData"

export default function LiveRiderModal({ isOpen, onClose, rider }) {
  const [telemetry, setTelemetry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pulsePosition, setPulsePosition] = useState(0)

  useEffect(() => {
    if (isOpen && rider) {
      setLoading(true)
      // Load initial telemetry
      const stats = getDeliveryPartnerLiveTracking(rider.id)
      setTelemetry(stats)
      setLoading(false)

      // Start an interval to simulate moving rider position along the route
      const moveInterval = setInterval(() => {
        setPulsePosition(prev => (prev + 1) % 100)
      }, 800)

      return () => {
        clearInterval(moveInterval)
      }
    }
  }, [isOpen, rider])

  if (!isOpen || !rider) return null

  // Generate dynamic location coordinates based on pulse position along SVG route
  const getRiderCoordinatesOnSvgPath = () => {
    // Basic linear interpolation along our mockup street segments
    // Segment 1: Store (40, 220) to Palasia (150, 160) - 30% of journey
    // Segment 2: Palasia (150, 160) to Vijay Nagar (280, 80) - 40% of journey
    // Segment 3: Vijay Nagar (280, 80) to Customer (440, 40) - 30% of journey
    const p = pulsePosition
    if (p < 30) {
      const ratio = p / 30
      return { x: 40 + ratio * 110, y: 220 - ratio * 60 }
    } else if (p < 70) {
      const ratio = (p - 30) / 40
      return { x: 150 + ratio * 130, y: 160 - ratio * 80 }
    } else {
      const ratio = (p - 70) / 30
      return { x: 280 + ratio * 160, y: 80 - ratio * 40 }
    }
  }

  const riderPos = getRiderCoordinatesOnSvgPath()

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop restricted to content area */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Compass className="w-5 h-5 text-[var(--primary)] animate-spin-slow" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Live Rider Tracking Telemetry: {rider.name} ({rider.employeeCode})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[350px]">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest animate-pulse">
              Connecting GPS Telemetry...
            </span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            
            {/* Left: Map tracking canvas (Interactive SVG) */}
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 p-4 flex flex-col relative min-h-[300px]">
              {/* Map Title Overlay */}
              <div className="absolute top-6 left-6 z-10 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-850 px-3 py-1.5 rounded-xl shadow-md text-[10px] font-bold text-zinc-650 dark:text-zinc-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Realtime GPS Signal: Active</span>
              </div>

              {/* Animated Map Canvas */}
              <div className="flex-1 w-full border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-900 relative shadow-inner">
                <svg className="w-full h-full min-h-[280px]" viewBox="0 0 500 280">
                  {/* Grid Lines to represent maps grid */}
                  <defs>
                    <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                      <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(120, 120, 120, 0.05)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Simulated Road Paths (Gray lines) */}
                  <path d="M 20 220 L 460 220" stroke="rgba(100,100,100,0.15)" strokeWidth="8" strokeLinecap="round" fill="none" />
                  <path d="M 40 40 L 40 260" stroke="rgba(100,100,100,0.15)" strokeWidth="8" strokeLinecap="round" fill="none" />
                  <path d="M 280 20 L 280 260" stroke="rgba(100,100,100,0.15)" strokeWidth="8" strokeLinecap="round" fill="none" />

                  {/* Active Delivery Route path (Sunset orange line) */}
                  <path 
                    d="M 40 220 L 150 160 L 280 80 L 440 40" 
                    stroke="var(--primary)" 
                    strokeWidth="3.5" 
                    strokeDasharray="4 3" 
                    strokeLinecap="round" 
                    fill="none" 
                    className="opacity-75"
                  />

                  {/* Start Point: Store Hub */}
                  <circle cx="40" cy="220" r="7" fill="rgb(34, 197, 94)" />
                  <circle cx="40" cy="220" r="14" fill="rgba(34, 197, 94, 0.2)" className="animate-pulse" />
                  <text x="50" y="225" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-500 dark:text-zinc-400">
                    Store Hub
                  </text>

                  {/* Intermediate Waypoint: Palasia */}
                  <circle cx="150" cy="160" r="4.5" fill="currentColor" className="text-zinc-400" />
                  <text x="160" y="165" fontSize="7" fill="currentColor" className="text-zinc-400">
                    Palasia Jnc.
                  </text>

                  {/* Intermediate Waypoint: Vijay Nagar */}
                  <circle cx="280" cy="80" r="4.5" fill="currentColor" className="text-zinc-400" />
                  <text x="290" y="85" fontSize="7" fill="currentColor" className="text-zinc-400">
                    Vijay Nagar
                  </text>

                  {/* End Point: Customer Delivery Point */}
                  <circle cx="440" cy="40" r="7" fill="rgb(220, 38, 38)" />
                  <circle cx="440" cy="40" r="14" fill="rgba(220, 38, 38, 0.2)" className="animate-pulse" />
                  <text x="385" y="44" fontSize="8" fontWeight="bold" fill="currentColor" className="text-zinc-500 dark:text-zinc-400">
                    Customer Drop
                  </text>

                  {/* Active Rider Indicator (Moving along the path) */}
                  <g transform={`translate(${riderPos.x}, ${riderPos.y})`}>
                    <circle cx="0" cy="0" r="8" fill="var(--primary)" />
                    <circle cx="0" cy="0" r="15" fill="var(--primary)" className="animate-ping opacity-40" />
                    {/* Tiny Arrow/Rider avatar */}
                    <path d="M -3 3 L 0 -4 L 3 3 Z" fill="#ffffff" />
                  </g>
                </svg>

                {/* Simulated telemetry logs at bottom of map */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl flex items-center justify-between text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-[var(--primary)] animate-bounce" />
                    <span>Heading: Northeast</span>
                  </div>
                  <span>ETA: {telemetry.eta}</span>
                  <span>Dist: {telemetry.distanceRemaining}</span>
                </div>
              </div>
            </div>

            {/* Right: Detailed Rider Telemetry Stats */}
            <div className="w-full lg:w-[350px] border-t lg:border-t-0 lg:border-l border-zinc-150 dark:border-zinc-800 p-5 space-y-5 bg-white dark:bg-zinc-900 overflow-y-auto">
              
              {/* Telemetry Status Grid */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                  Device Telemetry
                </h4>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Battery className={`w-4 h-4 ${telemetry.battery < 20 ? "text-rose-500 animate-pulse" : "text-emerald-500"}`} />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">Battery</span>
                    </div>
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                      {telemetry.battery}% ({telemetry.batteryStatus})
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Wifi className="w-4 h-4 text-sky-500" />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">Network</span>
                    </div>
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                      {telemetry.networkStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">Speed</span>
                    </div>
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                      {telemetry.speed}
                    </span>
                  </div>

                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-[9px] uppercase tracking-wider font-extrabold">GPS Lock</span>
                    </div>
                    <span className="text-xs font-black text-zinc-850 dark:text-zinc-200">
                      Precision 3m
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Order Card */}
              {telemetry.currentOrder ? (
                <div className="p-4 border border-[var(--primary)]/20 bg-[var(--primary)]/5 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                      <ShoppingBag className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="block text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                        Active Order Assignment
                      </span>
                      <span className="text-xs font-black text-[var(--primary)] block">
                        {telemetry.currentOrder.orderNumber}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-zinc-150 dark:border-zinc-800 pt-2.5 space-y-1 text-[11px] font-medium text-zinc-650 dark:text-zinc-350">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Customer:</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-100">
                        {telemetry.currentOrder.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Destination:</span>
                      <span className="font-extrabold text-zinc-800 dark:text-zinc-100 text-right truncate max-w-[160px]" title={telemetry.currentOrder.destination}>
                        {telemetry.currentOrder.destination}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Estimated Delivery:</span>
                      <span className="font-extrabold text-emerald-600">
                        {telemetry.currentOrder.estTime}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl text-center py-6 text-zinc-450 dark:text-zinc-500 text-xs font-bold bg-zinc-50/50 dark:bg-zinc-950/20">
                  <AlertCircle className="w-5 h-5 mx-auto mb-2 text-zinc-400" />
                  Rider is currently waiting in store queue. No active order assigned.
                </div>
              )}

              {/* Rider quick stats */}
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-2 text-[11px] font-medium text-zinc-500 bg-zinc-50/20 dark:bg-zinc-950/10">
                <div className="flex justify-between">
                  <span>Rider Vehicle:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    {rider.vehicleType} ({rider.vehicleNumber})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Store Hub:</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Indore Main Hub
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Rider Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 font-bold text-[9px]">
                    Online & Active
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-150 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Telemetry View
          </button>
        </div>

      </div>
    </div>
  )
}
