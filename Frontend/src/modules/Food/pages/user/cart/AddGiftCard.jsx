import React, { useState } from "react"
import { X } from "lucide-react"

export default function AddGiftCard({ show, onClose, onApply }) {
  const [cardNumber, setCardNumber] = useState("")
  const [cardPin, setCardPin] = useState("")

  if (!show) return null

  const isFormValid = cardNumber.trim().length >= 6 && cardPin.trim().length >= 4

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    onApply({
      cardNumber: cardNumber.trim(),
      cardPin: cardPin.trim(),
      value: 200 // Mock gift card value of ₹200
    })
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[32px] shadow-2xl flex flex-col text-left transition-transform duration-300 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-zinc-100">
          <h3 className="font-bold text-xl text-zinc-950">Add Gift Card</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-zinc-100 text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto hide-scrollbar">
          {/* Card Number Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Enter your Gift card number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="100714 0123456789"
              className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-400"
            />
          </div>

          {/* Card PIN Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Card Pin</label>
            <input
              type="password"
              value={cardPin}
              onChange={(e) => setCardPin(e.target.value)}
              placeholder="******"
              maxLength={8}
              className="w-full h-12 bg-white border border-zinc-200 rounded-xl px-4 text-sm font-semibold text-zinc-800 focus:outline-none focus:border-primary transition-colors placeholder:text-zinc-400 tracking-widest"
            />
          </div>

          {/* Note text */}
          <p className="text-xs text-zinc-400 font-medium leading-relaxed">
            You can apply a Gift Card to one order only. Any balance left will not be usable on other orders.
          </p>

          {/* Apply Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full h-12 rounded-xl text-sm font-bold transition-all active:scale-98 ${
              isFormValid 
                ? "bg-primary hover:opacity-90 text-on-primary shadow-md" 
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200"
            }`}
          >
            Apply Gift Card
          </button>
        </form>
      </div>
    </div>
  )
}
