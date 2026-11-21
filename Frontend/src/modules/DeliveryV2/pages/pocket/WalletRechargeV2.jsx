import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, IndianRupee, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"
import { deliveryAPI } from "@food/api"
import { initRazorpayPayment } from "@food/utils/razorpay"
import { getCompanyNameAsync } from "@food/utils/businessSettings"

const inr = (n) => `₹${(Number(n) || 0).toFixed(2)}`

/**
 * The delivery wallet: recharges minus the COD cash collected on delivered orders (below zero after cash orders).
 * To accept an order the balance must be at least the franchise minimum; the rider recharges here.
 */
export default function WalletRechargeV2() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState(null)
  const [history, setHistory] = useState([])
  const [amount, setAmount] = useState("")
  const [paying, setPaying] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await deliveryAPI.getWallet()
      const w = res?.data?.data?.wallet || {}
      setWallet(w.deliveryWallet || null)
      setHistory((w.transactions || []).filter((t) => t.type === "deposit"))
      if (w.deliveryWallet?.shortBy > 0) setAmount((v) => v || String(Math.ceil(w.deliveryWallet.shortBy)))
    } catch {
      toast.error("Could not load your wallet")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pay = async () => {
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt < 1) return toast.error("Enter an amount of at least ₹1")
    if (amt > 500000) return toast.error("Maximum recharge is ₹5,00,000")
    try {
      setPaying(true)
      const orderRes = await deliveryAPI.createDepositOrder(amt, "wallet_recharge")
      const rp = orderRes?.data?.data?.razorpay
      if (!rp?.orderId || !rp?.key) {
        setPaying(false)
        return toast.error("Payment is not available right now. Please try again.")
      }
      let profile = {}
      try {
        const pr = await deliveryAPI.getProfile()
        profile = pr?.data?.data?.profile || {}
      } catch (_) {}
      await initRazorpayPayment({
        key: rp.key,
        amount: rp.amount,
        currency: rp.currency || "INR",
        order_id: rp.orderId,
        name: await getCompanyNameAsync(),
        description: `Delivery wallet recharge - ${inr(amt)}`,
        prefill: { name: profile.name || "", email: profile.email || "", contact: String(profile.phone || "").replace(/\D/g, "").slice(-10) },
        handler: async (r) => {
          try {
            const v = await deliveryAPI.verifyDepositPayment({
              razorpay_order_id: r.razorpay_order_id,
              razorpay_payment_id: r.razorpay_payment_id,
              razorpay_signature: r.razorpay_signature,
              amount: amt,
              purpose: "wallet_recharge",
            })
            if (v?.data?.success) {
              toast.success(`Wallet recharged with ${inr(amt)}`)
              setAmount("")
              window.dispatchEvent(new CustomEvent("deliveryWalletStateUpdated"))
              load()
            } else toast.error("Payment could not be verified")
          } catch (err) {
            toast.error(err?.response?.data?.error || err?.response?.data?.message || "Payment could not be verified. Contact support.")
          } finally {
            setPaying(false)
          }
        },
        onError: (e) => { toast.error(e?.description || "Payment failed"); setPaying(false) },
        onClose: () => setPaying(false),
      })
    } catch (err) {
      setPaying(false)
      toast.error(err?.response?.data?.error || err?.response?.data?.message || "Could not start the payment")
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const w = wallet || { balance: 0, minBalance: 0, codCollected: 0, paidIn: 0, shortBy: 0, canAccept: true }
  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      <div className="bg-white px-4 py-5 flex items-center gap-4 fixed top-0 w-full z-50 shadow-sm">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-xl font-black">Delivery Wallet</h1>
      </div>

      <div className="pt-24 px-4 pb-10 space-y-4">
        <div className={`rounded-2xl p-5 shadow-sm border ${w.canAccept ? "bg-white border-gray-100" : "bg-red-50 border-red-100"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"><Wallet className="w-5 h-5" /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wallet balance</p>
              <p className={`text-3xl font-black ${w.balance < 0 ? "text-red-600" : "text-black"}`}>{inr(w.balance)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs font-bold">
            <div className="bg-gray-50 rounded-xl p-3"><span className="block text-[10px] text-gray-400 uppercase">Added by you</span>{inr(w.paidIn)}</div>
            <div className="bg-gray-50 rounded-xl p-3"><span className="block text-[10px] text-gray-400 uppercase">COD cash collected</span>{inr(w.codCollected)}</div>
            <div className="bg-gray-50 rounded-xl p-3 col-span-2"><span className="block text-[10px] text-gray-400 uppercase">Minimum to accept orders</span>{inr(w.minBalance)}</div>
          </div>
          <p className={`mt-3 text-xs font-bold ${w.canAccept ? "text-green-600" : "text-red-600"}`}>
            {w.canAccept ? "You can accept orders." : `Add at least ${inr(w.shortBy)} to accept orders.`}
          </p>
          <p className="mt-1 text-[10px] text-gray-400">Cash you collect on COD orders is taken from this wallet. Each store's franchise sets its own minimum.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Recharge amount</label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={pay}
            disabled={paying}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Recharge wallet
          </button>
        </div>

        {history.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Money added</p>
            {history.slice(0, 10).map((t) => (
              <div key={t.id} className="flex justify-between text-xs font-bold py-2 border-b border-gray-50 last:border-0">
                <span>{t.description}<span className="block text-[10px] text-gray-400 font-medium">{new Date(t.date).toLocaleString("en-IN")}</span></span>
                <span className={t.status === "Completed" ? "text-green-600" : "text-gray-400"}>{inr(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
