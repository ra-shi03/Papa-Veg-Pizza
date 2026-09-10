import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Printer, Search, Info, Check, AlertTriangle, ShieldCheck } from "lucide-react"
import Header from "@food/components/user/Header"

export default function Nutrition() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAllergens, setSelectedAllergens] = useState([])
  const [activeItem, setActiveItem] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || localStorage.getItem("appTheme") === "dark"
    setIsDarkMode(isDark)
  }, [])

  const ALLERGENS_LIST = ["Gluten", "Dairy", "Soy", "Mustard"]

  const NUTRITION_DATABASE = [
    {
      id: "margherita",
      name: "Classic Margherita Pizza",
      description: "Simple yet elegant classic with our signature pizza sauce and 100% vegetarian mozzarella cheese.",
      servingSize: "1 slice (105g)",
      calories: 220,
      totalFat: 7,
      satFat: 3,
      transFat: 0,
      cholesterol: 15,
      sodium: 420,
      carbs: 28,
      fiber: 2,
      sugars: 3,
      protein: 9,
      calcium: 12,
      iron: 6,
      allergens: ["Gluten", "Dairy"]
    },
    {
      id: "paneer-tikka",
      name: "Paneer Tikka Pizza",
      description: "Spicy marinated paneer chunks, crisp capsicum, onions, and red paprika on cheese-burst base.",
      servingSize: "1 slice (130g)",
      calories: 320,
      totalFat: 14,
      satFat: 6,
      transFat: 0,
      cholesterol: 25,
      sodium: 560,
      carbs: 33,
      fiber: 3,
      sugars: 4,
      protein: 15,
      calcium: 22,
      iron: 10,
      allergens: ["Gluten", "Dairy", "Mustard"]
    },
    {
      id: "garden-supreme",
      name: "Garden Veggie Supreme Pizza",
      description: "Loaded with fresh mushrooms, green olives, sweet corn, red bell peppers, and fresh jalapenos.",
      servingSize: "1 slice (115g)",
      calories: 240,
      totalFat: 8,
      satFat: 3.5,
      transFat: 0,
      cholesterol: 15,
      sodium: 480,
      carbs: 31,
      fiber: 3,
      sugars: 4,
      protein: 10,
      calcium: 15,
      iron: 8,
      allergens: ["Gluten", "Dairy"]
    },
    {
      id: "veggie-overload",
      name: "Veggie Overload Oval Flatz",
      description: "Our signature artisanal flatbread crust loaded with seasonal organic vegetables and light cheese.",
      servingSize: "1 slice (120g)",
      calories: 270,
      totalFat: 9,
      satFat: 4,
      transFat: 0,
      cholesterol: 15,
      sodium: 510,
      carbs: 34,
      fiber: 4,
      sugars: 5,
      protein: 11,
      calcium: 18,
      iron: 10,
      allergens: ["Gluten", "Dairy"]
    },
    {
      id: "garlic-bread",
      name: "Garlic Breadsticks",
      description: "Freshly baked breadsticks infused with garlic butter and herbs, served with cheesy dip.",
      servingSize: "2 pieces (75g)",
      calories: 190,
      totalFat: 6,
      satFat: 2.5,
      transFat: 0,
      cholesterol: 10,
      sodium: 360,
      carbs: 26,
      fiber: 1,
      sugars: 2,
      protein: 6,
      calcium: 8,
      iron: 6,
      allergens: ["Gluten", "Dairy"]
    },
    {
      id: "stuffed-crust-veg",
      name: "Stuffed Crust Veg Treat",
      description: "Pizza crust stuffed with garlic cream cheese, topped with gold corn, paneer and red paprika.",
      servingSize: "1 slice (140g)",
      calories: 350,
      totalFat: 16,
      satFat: 8,
      transFat: 0,
      cholesterol: 35,
      sodium: 650,
      carbs: 36,
      fiber: 3,
      sugars: 4,
      protein: 16,
      calcium: 25,
      iron: 12,
      allergens: ["Gluten", "Dairy"]
    },
    {
      id: "choco-lava",
      name: "Choco Lava Cake",
      description: "Decadent chocolate cake filled with warm liquid chocolate center, 100% eggless.",
      servingSize: "1 cake (90g)",
      calories: 380,
      totalFat: 18,
      satFat: 9,
      transFat: 0,
      cholesterol: 20,
      sodium: 210,
      carbs: 48,
      fiber: 3,
      sugars: 32,
      protein: 5,
      calcium: 6,
      iron: 15,
      allergens: ["Gluten", "Dairy", "Soy"]
    }
  ]

  // Initialize active item to Margherita by default
  useEffect(() => {
    if (!activeItem && NUTRITION_DATABASE.length > 0) {
      setActiveItem(NUTRITION_DATABASE[0])
    }
  }, [activeItem])

  const toggleAllergenFilter = (allergen) => {
    setSelectedAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    )
  }

  const filteredItems = NUTRITION_DATABASE.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Allergen filtering (exclude items containing selected allergens)
    const containsExcludedAllergen = selectedAllergens.some(allergen => 
      item.allergens.includes(allergen)
    )

    return matchesSearch && !containsExcludedAllergen
  })

  const calculatePercentageDV = (amount, dailyValue) => {
    return Math.round((amount / dailyValue) * 100)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className={`font-body-md text-body-md min-h-screen pb-20 overflow-x-hidden flex flex-col transition-colors duration-300 ${isDarkMode ? "dark bg-[#111111] text-[#e5e2e1]" : "bg-[#fbf9f8] text-[#1c1b1b]"}`}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.9)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.06)"} !important;
        }
        .fda-label {
          background: #ffffff !important;
          color: #000000 !important;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .border-primary {
          border-color: #E53935 !important;
        }
        
        /* Print Styles mimicking PDF Sheet */
        @media print {
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          header, 
          .no-print, 
          .bottom-navigation,
          button,
          input {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .print-pdf-sheet {
            display: block !important;
            page-break-after: always;
            border: 2px solid #000 !important;
            padding: 20px !important;
            margin-top: 10px !important;
            background: white !important;
            color: black !important;
          }
          .fda-label {
            border: 2px solid #000 !important;
            padding: 10px !important;
            background: white !important;
            color: black !important;
          }
          .dark {
            background: white !important;
            color: black !important;
          }
        }
      ` }} />

      {/* Header */}
      <Header
        title="Nutrition Information"
        showBack={true}
        onBack={() => navigate("/account")}
        showThemeToggle={false}
      />

      <main className="flex-1 p-4 md:p-6 mt-20 max-w-4xl mx-auto w-full print-container">
        {/* Printable/Exportable header row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 no-print">
          <div>
            <h2 className="font-headline-lg-mobile text-2xl font-black text-slate-900 dark:text-white leading-tight">
              Nutritional Facts &amp; Allergens
            </h2>
            <p className="text-sm opacity-70 leading-relaxed text-slate-600 dark:text-[#e4beb9] mt-1">
              Official food values report for Papa Veg Pizza crusts, toppings and desserts.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:opacity-90 active:scale-95 transition-all duration-200 cursor-pointer border-0 font-bold shadow-md shadow-red-500/10 text-sm whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF Report
          </button>
        </div>

        {/* Dynamic PDF view indicator for accessibility */}
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-2xl mb-6 text-xs leading-relaxed no-print">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold">Standard PDF Printable View Enabled:</span> Clicking "Print / Save PDF Report" will export a clean, ink-friendly official PDF sheet formatted for standard paper sheets.
          </div>
        </div>

        {/* Filters and search section (no-print) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
          {/* Left / Search & Allergen filters */}
          <div className="md:col-span-1 space-y-5">
            <div className="glass-card p-4 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold tracking-wide uppercase opacity-90 text-primary">
                Search &amp; Filters
              </h3>
              
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Search menu item..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:border-primary transition-colors text-slate-800 dark:text-white"
                />
              </div>

              {/* Allergen Filters */}
              <div>
                <h4 className="text-xs font-black uppercase opacity-75 mb-2.5">
                  Exclude Items Containing
                </h4>
                <div className="flex flex-wrap gap-2">
                  {ALLERGENS_LIST.map((allergen) => {
                    const isSelected = selectedAllergens.includes(allergen)
                    return (
                      <button
                        key={allergen}
                        onClick={() => toggleAllergenFilter(allergen)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer border flex items-center gap-1 ${
                          isSelected
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                            : "bg-slate-100 dark:bg-white/5 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        {allergen}
                      </button>
                    )
                  })}
                </div>
                {selectedAllergens.length > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Currently hiding items containing selected allergens.
                  </p>
                )}
              </div>
            </div>

            {/* Menu List of filtered items */}
            <div className="glass-card p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-black tracking-wide uppercase opacity-75 mb-1">
                Select Item to view facts ({filteredItems.length})
              </h3>
              <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const isActive = activeItem?.id === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 cursor-pointer border text-xs font-semibold ${
                          isActive
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-slate-50 dark:bg-white/5 border-transparent text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        <div className="font-bold mb-0.5 truncate">{item.name}</div>
                        <div className={`text-[10px] opacity-80 truncate ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`}>
                          {item.calories} Kcal | {item.servingSize}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No items match filter criteria.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right / Interactive US FDA Style Nutrition Facts Label Display */}
          <div className="md:col-span-2">
            <div className="glass-card p-5 rounded-[2rem] flex flex-col lg:flex-row gap-6 items-start">
              {activeItem ? (
                <>
                  <div className="flex-1 space-y-4">
                    <div className="bg-primary/10 text-primary inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5" /> Selected Product Info
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {activeItem.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeItem.description}
                    </p>

                    {/* Allergens warning panel */}
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl space-y-1">
                      <div className="text-xs font-black uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Allergens Warning
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-95">
                        This item contains: <span className="font-bold">{activeItem.allergens.join(", ")}</span>.
                        All pizzas are prepared in a 100% vegetarian environment using shared equipment.
                      </p>
                    </div>

                    {/* Helpful tips panel */}
                    <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 rounded-xl space-y-1 text-[11px] leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5 mb-0.5">
                        💡 Dietary Recommendations
                      </div>
                      We utilize microbial rennet cheeses that are completely vegetarian. Try our Oval Flatz flatbreads for a lighter crust option with higher whole grain fibers.
                    </div>
                  </div>

                  {/* FDA label card */}
                  <div className="fda-label border-8 border-black p-4 w-full max-w-[310px] mx-auto shadow-xl rounded-sm">
                    <h2 className="text-center font-black text-3xl tracking-tight leading-none mb-1">Nutrition Facts</h2>
                    <div className="border-b-[5px] border-black pb-1 mb-1 text-[11px]">
                      <span>Serving Size <strong>{activeItem.servingSize}</strong></span>
                    </div>
                    
                    <div className="border-b-[10px] border-black py-1 mb-1.5 flex justify-between items-baseline">
                      <span className="font-black text-base">Amount Per Serving</span>
                    </div>

                    <div className="border-b-4 border-black pb-1 mb-1 flex justify-between items-baseline">
                      <span className="font-black text-2xl leading-none">Calories</span>
                      <span className="font-black text-3xl leading-none">{activeItem.calories}</span>
                    </div>

                    <div className="text-right text-[10px] font-black border-b border-black pb-0.5 mb-1">% Daily Value *</div>

                    <div className="border-b border-black py-0.5 flex justify-between text-xs">
                      <span><strong>Total Fat</strong> {activeItem.totalFat}g</span>
                      <strong>{calculatePercentageDV(activeItem.totalFat, 65)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 pl-3 flex justify-between text-xs">
                      <span>Saturated Fat {activeItem.satFat}g</span>
                      <strong>{calculatePercentageDV(activeItem.satFat, 20)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 pl-3 flex justify-between text-xs">
                      <span><em>Trans</em> Fat {activeItem.transFat}g</span>
                      <span></span>
                    </div>

                    <div className="border-b border-black py-0.5 flex justify-between text-xs">
                      <span><strong>Cholesterol</strong> {activeItem.cholesterol}mg</span>
                      <strong>{calculatePercentageDV(activeItem.cholesterol, 300)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 flex justify-between text-xs">
                      <span><strong>Sodium</strong> {activeItem.sodium}mg</span>
                      <strong>{calculatePercentageDV(activeItem.sodium, 2400)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 flex justify-between text-xs">
                      <span><strong>Total Carbohydrate</strong> {activeItem.carbs}g</span>
                      <strong>{calculatePercentageDV(activeItem.carbs, 300)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 pl-3 flex justify-between text-xs">
                      <span>Dietary Fiber {activeItem.fiber}g</span>
                      <strong>{calculatePercentageDV(activeItem.fiber, 25)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 pl-3 flex justify-between text-xs">
                      <span>Sugars {activeItem.sugars}g</span>
                      <span></span>
                    </div>

                    <div className="border-b-[8px] border-black py-0.5 flex justify-between text-xs">
                      <span><strong>Protein</strong> {activeItem.protein}g</span>
                      <strong>{calculatePercentageDV(activeItem.protein, 50)}%</strong>
                    </div>

                    <div className="border-b border-black py-0.5 flex justify-between text-xs">
                      <span>Calcium</span>
                      <span>{activeItem.calcium}%</span>
                    </div>

                    <div className="border-b border-black py-0.5 flex justify-between text-xs">
                      <span>Iron</span>
                      <span>{activeItem.iron}%</span>
                    </div>
                    
                    <div className="text-[9px] leading-tight pt-1.5 text-slate-700">
                      * Percent Daily Values are based on a 2,000 calorie diet. Your Daily Values may be higher or lower depending on your calorie needs.
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-20 text-slate-400">
                  Select a product to view its official nutritional details.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* -------------------- PRINT/PDF EXPORT VIEW SHEET -------------------- */}
        {/* This full section displays when printing, rendering as a clean, standardized report */}
        <div className="hidden print-pdf-sheet fda-label p-8">
          <div className="text-center border-b-4 border-black pb-4 mb-6">
            <h1 className="text-3xl font-black uppercase tracking-tight">Papa Veg Pizza</h1>
            <p className="text-sm font-bold uppercase tracking-widest mt-1">Official Nutritional &amp; Allergens Report</p>
            <p className="text-xs opacity-75 mt-1">Compiled on: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <p className="text-xs leading-relaxed mb-6">
            This document outlines the nutritional counts, ingredients, serving weights, calories, and allergens values of menu items prepared at Papa Veg Pizza outlets. All data values are monitored and tested regularly. Papa Veg Pizza is a 100% vegetarian kitchen.
          </p>

          <h2 className="text-xl font-bold uppercase border-b-2 border-black pb-1 mb-4">Complete Nutrition Index Table</h2>
          <table className="w-full text-xs text-left border-collapse border border-black mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 font-bold">Product Name</th>
                <th className="border border-black p-2 font-bold">Serving Size</th>
                <th className="border border-black p-2 font-bold">Calories</th>
                <th className="border border-black p-2 font-bold">Protein</th>
                <th className="border border-black p-2 font-bold">Carbs</th>
                <th className="border border-black p-2 font-bold">Total Fat</th>
                <th className="border border-black p-2 font-bold">Sodium</th>
                <th className="border border-black p-2 font-bold">Allergens</th>
              </tr>
            </thead>
            <tbody>
              {NUTRITION_DATABASE.map(item => (
                <tr key={item.id}>
                  <td className="border border-black p-2 font-bold">{item.name}</td>
                  <td className="border border-black p-2">{item.servingSize}</td>
                  <td className="border border-black p-2">{item.calories} Kcal</td>
                  <td className="border border-black p-2">{item.protein}g</td>
                  <td className="border border-black p-2">{item.carbs}g</td>
                  <td className="border border-black p-2">{item.totalFat}g</td>
                  <td className="border border-black p-2">{item.sodium}mg</td>
                  <td className="border border-black p-2 font-bold">{item.allergens.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="page-break-after"></div>

          <h2 className="text-xl font-bold uppercase border-b-2 border-black pb-1 mb-4 mt-8">Selected Product Factsheet</h2>
          {activeItem && (
            <div className="border border-black p-6 flex flex-col md:flex-row justify-between gap-6 items-start">
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-black">{activeItem.name}</h3>
                <p className="text-sm italic">{activeItem.description}</p>
                <div className="p-3 border border-black rounded-sm space-y-1">
                  <div className="text-xs font-bold uppercase">Allergen Notice:</div>
                  <p className="text-xs">Contains: {activeItem.allergens.join(", ")}. Prepared in a kitchen that processes wheat, milk products, soy and mustard seeds.</p>
                </div>
              </div>

              <div className="fda-label border-4 border-black p-4 w-[280px]">
                <h2 className="text-center font-black text-2xl tracking-tight leading-none mb-1">Nutrition Facts</h2>
                <div className="border-b-2 border-black pb-1 mb-1 text-[10px]">
                  <span>Serving Size <strong>{activeItem.servingSize}</strong></span>
                </div>
                
                <div className="border-b-4 border-black pb-1 mb-1 flex justify-between items-baseline">
                  <span className="font-bold text-xs">Calories</span>
                  <span className="font-black text-2xl">{activeItem.calories}</span>
                </div>

                <div className="border-b border-black py-0.5 flex justify-between text-xs">
                  <span><strong>Total Fat</strong> {activeItem.totalFat}g</span>
                  <span>{calculatePercentageDV(activeItem.totalFat, 65)}%</span>
                </div>
                <div className="border-b border-black py-0.5 pl-2 flex justify-between text-xs">
                  <span>Saturated Fat {activeItem.satFat}g</span>
                  <span>{calculatePercentageDV(activeItem.satFat, 20)}%</span>
                </div>
                <div className="border-b border-black py-0.5 flex justify-between text-xs">
                  <span><strong>Cholesterol</strong> {activeItem.cholesterol}mg</span>
                  <span>{calculatePercentageDV(activeItem.cholesterol, 300)}%</span>
                </div>
                <div className="border-b border-black py-0.5 flex justify-between text-xs">
                  <span><strong>Sodium</strong> {activeItem.sodium}mg</span>
                  <span>{calculatePercentageDV(activeItem.sodium, 2400)}%</span>
                </div>
                <div className="border-b border-black py-0.5 flex justify-between text-xs">
                  <span><strong>Total Carbohydrate</strong> {activeItem.carbs}g</span>
                  <span>{calculatePercentageDV(activeItem.carbs, 300)}%</span>
                </div>
                <div className="border-b border-black py-0.5 pl-2 flex justify-between text-xs">
                  <span>Dietary Fiber {activeItem.fiber}g</span>
                  <span>{calculatePercentageDV(activeItem.fiber, 25)}%</span>
                </div>
                <div className="border-b-2 border-black py-0.5 flex justify-between text-xs">
                  <span><strong>Protein</strong> {activeItem.protein}g</span>
                  <span>{calculatePercentageDV(activeItem.protein, 50)}%</span>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-[10px] uppercase font-bold mt-16 tracking-widest">
            Papa Veg Pizza, India Ltd. | Corporate Food Regulatory &amp; Quality Control Cell
          </p>
        </div>
      </main>
    </div>
  )
}
