import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Landmark } from "lucide-react"
import { toast } from "sonner"
import useDeliveryBackNavigation from "../../hooks/useDeliveryBackNavigation"

// Signup step: bank and payment details. Optional here (Skip), but needed before the rider can go online or deliver.
// Kept with the other signup details in sessionStorage; sent with the registration on the documents step.
const FIELDS = [
  { key: "bankAccountHolderName", label: "Account holder name", placeholder: "As on your bank account" },
  { key: "bankAccountNumber", label: "Account number", placeholder: "9 to 18 digits", inputMode: "numeric" },
  { key: "bankIfscCode", label: "IFSC code", placeholder: "e.g. HDFC0001234" },
  { key: "bankName", label: "Bank name", placeholder: "e.g. HDFC Bank", optional: true },
  { key: "upiId", label: "UPI ID", placeholder: "e.g. name@okaxis" },
]

const readDetails = () => {
  try {
    return JSON.parse(sessionStorage.getItem("deliverySignupDetails") || "{}") || {}
  } catch {
    return {}
  }
}

export const validatePayout = (f) => {
  if (!String(f.bankAccountHolderName || "").trim()) return "Enter the account holder name"
  if (!/^[0-9]{9,18}$/.test(String(f.bankAccountNumber || "").trim())) return "Account number must be 9 to 18 digits"
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(f.bankIfscCode || "").trim().toUpperCase())) return "Enter a valid IFSC code"
  if (!/^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(String(f.upiId || "").trim())) return "Enter a valid UPI ID"
  return ""
}

export default function SignupBank() {
  const navigate = useNavigate()
  const goBack = useDeliveryBackNavigation()
  const saved = readDetails()
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, saved[f.key] || ""])))

  const keep = (values) => {
    const details = { ...readDetails(), ...values }
    sessionStorage.setItem("deliverySignupDetails", JSON.stringify(details))
  }

  const handleContinue = () => {
    const error = validatePayout(form)
    if (error) return toast.error(error)
    keep({ ...form, bankIfscCode: form.bankIfscCode.trim().toUpperCase() })
    navigate("/food/delivery/signup/documents")
  }

  const handleSkip = () => {
    // nothing saved: the rider adds these later in Profile > Bank details (needed before going online)
    keep(Object.fromEntries(FIELDS.map((f) => [f.key, ""])))
    toast.info("You can add bank details later. They are needed before you go online.")
    navigate("/food/delivery/signup/documents")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 flex items-center gap-4 border-b border-gray-200">
        <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-medium">Bank & Payment Details</h1>
        </div>
        <button onClick={handleSkip} className="text-sm font-bold text-[#00B761] px-3 py-1.5 rounded-lg hover:bg-green-50">
          Skip
        </button>
      </div>

      <div className="px-4 py-6 space-y-4 pb-32">
        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex gap-3">
          <Landmark className="w-5 h-5 text-[#00B761] shrink-0 mt-0.5" />
          <p className="text-xs text-gray-700">
            Your earnings are paid to this account. You can skip now, but you must add these details before you go online and deliver orders.
          </p>
        </div>

        {FIELDS.map((f) => (
          <div key={f.key} className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {f.label} {!f.optional && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              inputMode={f.inputMode}
              value={form[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setForm({ ...form, [f.key]: f.key === "bankIfscCode" ? e.target.value.toUpperCase() : e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B761]"
            />
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <button onClick={handleContinue} className="w-full py-3 rounded-lg bg-[#00B761] text-white font-medium hover:bg-[#00A055]">
          Continue
        </button>
        <button onClick={handleSkip} className="w-full py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100">
          Skip for now
        </button>
      </div>
    </div>
  )
}
