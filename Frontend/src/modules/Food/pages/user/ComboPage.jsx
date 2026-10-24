import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight, Pizza } from "lucide-react"
import axiosInstance from "@/services/api/axios"

export default function ComboPage() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)

  useEffect(() => {
    let cancelled = false
    axiosInstance
      .get("/settings/combo-page")
      .then((res) => {
        if (!cancelled) setConfig(res?.data?.data || {})
      })
      .catch(() => {
        if (!cancelled) setConfig({})
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/user")
  }

  const handleBuild = () => {
    navigate("/user/combos/build")
  }

  return (
    <div className="user-app-theme min-h-screen flex justify-center bg-[#F8F6F2] dark:bg-[#0a0a0a]">
      <div className="w-full max-w-md min-h-screen bg-[#F8F6F2] dark:bg-[#131313] pb-10">
        {/* Top banner (only if topBannerUrl is set, otherwise a clean header bar with back navigation) */}
        {config?.topBannerUrl ? (
          <div className="relative w-full bg-[#FBE9E7] dark:bg-zinc-900">
            <img src={config.topBannerUrl} alt="Combo banner" className="w-full h-auto block" />
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="absolute top-1.5 left-2.5 w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-[#34373C] border-0 cursor-pointer active:bg-black/10"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            <div className="absolute -bottom-px left-0 w-full h-4 rounded-t-2xl bg-[#F8F6F2] dark:bg-[#131313]" />
          </div>
        ) : (
          <div className="sticky top-0 z-30 bg-[#F8F6F2] dark:bg-[#111111] border-b border-zinc-200/80 dark:border-zinc-800 px-4 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back"
              className="p-1.5 -ml-1.5 text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center bg-transparent border-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight m-0 font-['Poppins',sans-serif]">
              Combos
            </h1>
          </div>
        )}

        {config && config.isActive !== false && (
          <div className="pt-6 pb-6">
            {/* Section heading (padded) */}
            {(config.sectionTitle || config.sectionSubtitle) && (
              <div className="px-4 flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#EE3A43]/10 flex items-center justify-center shrink-0">
                  <Pizza className="w-6 h-6 text-[#EE3A43]" />
                </div>
                <div className="min-w-0">
                  {config.sectionTitle && (
                    <h2 className="text-lg font-semibold text-[#34373C] dark:text-[#F8F6F2] leading-tight">
                      {config.sectionTitle}
                    </h2>
                  )}
                  {config.sectionSubtitle && (
                    <p className="text-xs text-[#62666D] dark:text-zinc-400 mt-0.5">{config.sectionSubtitle}</p>
                  )}
                </div>
              </div>
            )}

            {/* Offer card (full width, edge-to-edge, zero gaps on sides) */}
            {config.bottomBannerUrl && (
              <div className="relative mx-4 rounded-xl overflow-hidden shadow-sm">
                <img src={config.bottomBannerUrl} alt={config.sectionTitle || "Combo Offer"} className="w-full h-auto block" />
                <button
                  type="button"
                  onClick={handleBuild}
                  className="absolute left-4 bottom-4 flex items-center gap-1.5 bg-[var(--accent-red,#EE3A43)] hover:bg-[#d92d36] active:scale-95 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow-md border-0 cursor-pointer transition-all"
                >
                  {config.buttonText || "Build your Combo"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
