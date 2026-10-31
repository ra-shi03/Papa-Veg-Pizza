import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight, MessageSquare, Plus, X } from "lucide-react"
import { orderAPI, supportAPI } from "@food/api"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"

const PAGE_SIZE = 20

const STATUS = {
  open: { label: "Received", className: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  "in-progress": { label: "In progress", className: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  resolved: { label: "Resolved", className: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
}

const when = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : ""

function Reply({ title, message, at }) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3">
      <p className="text-xs font-semibold text-[#7e3866] dark:text-[#d9a3c6]">{title}</p>
      <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words">{message}</p>
      {at && <p className="text-xs text-gray-400 mt-1">{when(at)}</p>}
    </div>
  )
}

function ComplaintCard({ ticket }) {
  const status = STATUS[ticket.status] || STATUS.open
  const outcome = ticket.resolution
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800 dark:text-white break-words">{ticket.issueType}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {[ticket.orderNumber && `Order #${ticket.orderNumber}`, ticket.storeName].filter(Boolean).join(" · ")}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>{status.label}</span>
      </div>

      {ticket.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">{ticket.description}</p>
      )}
      <p className="text-xs text-gray-400">Sent {when(ticket.createdAt)}</p>

      {(ticket.responses || []).map((reply, index) => (
        <Reply key={index} title="Reply from the store" message={reply.message} at={reply.at} />
      ))}
      {ticket.adminResponse && <Reply title="Reply from Papa Veg Pizza" message={ticket.adminResponse} />}

      {outcome && (
        <div className="bg-green-50 dark:bg-green-500/10 rounded-lg p-3 text-sm">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400">How it was resolved</p>
          <p className="text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words">{outcome.actionTaken}</p>
          {outcome.refundAmount > 0 && (
            <p className="text-gray-700 dark:text-gray-200 mt-1">Refund: ₹{outcome.refundAmount}</p>
          )}
          {outcome.couponIssued && <p className="text-gray-700 dark:text-gray-200 mt-1">Coupon: {outcome.couponIssued}</p>}
          {outcome.replacementOrderId && (
            <p className="text-gray-700 dark:text-gray-200 mt-1">Replacement order: {outcome.replacementOrderId}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">{when(outcome.resolvedAt)}</p>
        </div>
      )}
    </div>
  )
}

function OrderPicker({ onClose, onPick }) {
  const [orders, setOrders] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    orderAPI
      .getOrders({ limit: 20, page: 1 })
      .then((res) => {
        if (alive) setOrders(res?.data?.data?.orders || [])
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Choose an order"
        className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-t-2xl max-h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10">
          <h2 className="font-semibold text-gray-800 dark:text-white">Which order is this about?</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
        <div className="overflow-y-auto p-2">
          {failed && <p className="text-sm text-gray-500 p-4 text-center">Could not load your orders. Please try again.</p>}
          {!failed && orders === null && <p className="text-sm text-gray-500 p-4 text-center">Loading your orders...</p>}
          {orders?.length === 0 && (
            <p className="text-sm text-gray-500 p-4 text-center">You can raise a complaint once you have placed an order.</p>
          )}
          {orders?.map((order) => (
            <button
              key={order._id}
              type="button"
              onClick={() => onPick(order._id)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/5"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-800 dark:text-white truncate">
                  Order #{order.order_id || order.orderId || order._id}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">{when(order.createdAt)}</span>
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MyComplaints() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const [picking, setPicking] = useState(false)

  const load = useCallback(async (nextPage) => {
    const res = await supportAPI.getMyTickets({ page: nextPage, limit: PAGE_SIZE })
    const data = res?.data?.data || {}
    setTickets((current) => (nextPage === 1 ? data.tickets || [] : [...current, ...(data.tickets || [])]))
    setTotal(data.total || 0)
    setPage(nextPage)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      await load(1)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [load])

  useEffect(() => {
    refresh()
  }, [refresh])

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      await load(page + 1)
    } catch {
      setFailed(true)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24">
      <div className="bg-white dark:bg-[#1a1a1a] p-4 flex items-center sticky top-0 z-20 shadow-sm">
        <button type="button" onClick={goBack} aria-label="Back" className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10">
          <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white ml-3">My Complaints</h1>
      </div>

      <div className="mx-4 mt-4 space-y-3 max-w-2xl md:mx-auto">
        {loading && <p className="text-gray-600 dark:text-gray-400 text-sm text-center py-10">Loading...</p>}

        {!loading && failed && (
          <div className="text-center py-10">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Could not load your complaints.</p>
            <button type="button" onClick={refresh} className="mt-3 text-sm font-semibold text-[#7e3866] dark:text-[#d9a3c6]">
              Try again
            </button>
          </div>
        )}

        {!loading && !failed && tickets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
            <p className="font-semibold text-gray-800 dark:text-white mt-3">No complaints yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">If something went wrong with an order, tell us here.</p>
          </div>
        )}

        {!loading && tickets.map((ticket) => <ComplaintCard key={ticket._id} ticket={ticket} />)}

        {!loading && tickets.length < total && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 text-sm font-semibold text-[#7e3866] dark:text-[#d9a3c6] disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Show more"}
          </button>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-white/10 p-4 z-20">
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="w-full bg-[#7e3866] text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Raise a complaint
        </button>
      </div>

      {picking && (
        <OrderPicker
          onClose={() => setPicking(false)}
          onPick={(orderId) => navigate(`/user/complaints/submit/${encodeURIComponent(String(orderId))}`)}
        />
      )}
    </div>
  )
}
