import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import Header from "@food/components/user/Header"
import { faqAPI } from "@/services/api/faqApi"

export default function FAQ() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("appTheme") === "dark"
    setIsDarkMode(isDark)
  }, [])

  // FAQs the super admin manages (Settings > FAQ), active ones only, in their saved order
  const [faqs, setFaqs] = useState([])
  const [faqState, setFaqState] = useState("loading") // loading | ready | error

  useEffect(() => {
    let cancelled = false
    faqAPI.getPublicFaqs()
      .then((res) => {
        if (cancelled) return
        const list = Array.isArray(res?.data?.data) ? res.data.data : []
        setFaqs(list
          .filter((f) => f && f.isActive !== false && (f.title || f.question))
          .map((f) => ({ id: String(f._id || f.id), question: f.title || f.question, answer: f.content || f.answer || "" })))
        setFaqState("ready")
      })
      .catch(() => { if (!cancelled) setFaqState("error") })
    return () => { cancelled = true }
  }, [])

  const toggleAccordion = (id) => {
    setActiveId(activeId === id ? null : id)
  }

  return (
    <div
      className={`font-body-md text-body-md min-h-screen pb-20 overflow-x-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? "dark" : ""}`}
      style={{ backgroundColor: isDarkMode ? "#111111" : "#fbf9f8", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
        }
        .font-headline-lg-mobile {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
        }
        .font-body-md {
          font-family: 'Inter', sans-serif !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .bg-surface {
          background-color: ${isDarkMode ? "#131313" : "#ffffff"} !important;
        }
      ` }} />

      {/* Header */}
      <Header
        title="FAQs"
        showBack={true}
        onBack={() => navigate("/account")}
        showThemeToggle={false}
      />

      <main className="flex-1 p-5 mt-20 max-w-md mx-auto w-full space-y-4">
        <h2 className="font-headline-lg-mobile text-2xl font-black text-slate-900 dark:text-white mb-2 text-left">
          Frequently Asked Questions
        </h2>
        <p className="text-sm opacity-70 mb-6 text-left leading-relaxed text-slate-600 dark:text-[#e4beb9]">
          Quick answers to help you with your Papa Veg Pizza orders, delivery, and services.
        </p>

        {/* Collapsible Accordions */}
        <div className="space-y-3">
          {faqState === "loading" && (
            <p className="text-sm opacity-70 text-left text-slate-600 dark:text-[#e4beb9]">Loading FAQs...</p>
          )}
          {faqState === "error" && (
            <p className="text-sm opacity-70 text-left text-slate-600 dark:text-[#e4beb9]">FAQs could not be loaded. Please try again later.</p>
          )}
          {faqState === "ready" && faqs.length === 0 && (
            <p className="text-sm opacity-70 text-left text-slate-600 dark:text-[#e4beb9]">No FAQs have been added yet.</p>
          )}
          {faqs.map((faq) => {
            const isOpen = activeId === faq.id
            return (
              <div
                key={faq.id}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* FAQ Header Row */}
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full p-4 flex items-center justify-between text-left cursor-pointer bg-transparent border-0 outline-none"
                >
                  <span className="font-bold text-sm text-slate-800 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown className={`text-primary w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* FAQ Expandable Answer */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-4 pb-4 pt-1 text-xs leading-relaxed opacity-80 border-t border-slate-300/10 text-slate-700 dark:text-[#e4beb9]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
