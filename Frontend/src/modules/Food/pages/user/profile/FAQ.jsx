import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import Header from "@food/components/user/Header"

export default function FAQ() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("appTheme") === "dark"
    setIsDarkMode(isDark)
  }, [])

  const FAQ_DATA = [
    {
      id: 1,
      question: "Are all pizzas on the menu 100% vegetarian?",
      answer: "Yes, Papa Veg Pizza is a 100% vegetarian brand. We do not use meat, fish, or poultry products. All our cheeses are made with microbial rennet (non-animal source) and are 100% vegetarian friendly."
    },
    {
      id: 2,
      question: "How do I track my active order?",
      answer: "You can track your order in real-time by navigating to 'Track Order' from the Account page. This displays live status updates from order acceptance, preparation, baking, and delivery dispatcher coordinates."
    },
    {
      id: 3,
      question: "What is In-Car Dining and how does it work?",
      answer: "In-Car Dining allows you to enjoy hot pizza in the comfort of your parked car. Simply select the 'In-Car' option on the home screen, input your vehicle registration/car number, and confirm your order. Once parked at our designated spot, our server will deliver the order directly to your window."
    },
    {
      id: 4,
      question: "Can I customize the crust and cheese options?",
      answer: "Absolutely! You can choose from various crust sizes (Oval Flatz, Personal, Medium, Stuffed Crust) and customize toppings (paneer, olives, jalapenos, etc.) by clicking the 'Customise' button on any pizza in the Menu list."
    },
    {
      id: 5,
      question: "How do I cancel my order or request a refund?",
      answer: "Orders can be modified or cancelled within 5 minutes of placement by clicking the support button or calling the branch directly. Once order preparation begins, cancellation is not possible. Approved refunds are credited directly to your Papa Veg Money wallet instantly."
    },
    {
      id: 6,
      question: "Do you have any gluten-free or vegan crust options?",
      answer: "Currently, our pizzas contain wheat-based dough. We are actively working on developing certified gluten-free crusts and dairy-free vegan cheese options, which will be launched very soon!"
    }
  ]

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
          {FAQ_DATA.map((faq) => {
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
