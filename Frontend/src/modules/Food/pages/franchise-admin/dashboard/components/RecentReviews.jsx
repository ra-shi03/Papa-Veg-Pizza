import React, { useState } from "react"
import { Star, MessageSquare, X, Send, Sparkles, User, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function RecentReviews({ reviews, onRefresh, loading }) {
  const [list, setList] = useState(reviews || [])
  const [selectedReview, setSelectedReview] = useState(null)
  const [replyText, setReplyText] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)

  React.useEffect(() => {
    setList(reviews || [])
  }, [reviews])

  const handleOpenReplyModal = (review) => {
    setSelectedReview(review)
    setReplyText(review.reply || "")
  }

  const handleSendReply = (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmittingReply(true)
    setTimeout(() => {
      setList(prev =>
        prev.map(r => r.id === selectedReview.id ? { ...r, reply: replyText.trim() } : r)
      )
      toast.success(`Reply sent successfully to ${selectedReview.customer}`)
      setSubmittingReply(false)
      setSelectedReview(null)
      setReplyText("")
    }, 1200)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <MessageSquare size={14} className="text-amber-500" />
            Recent Reviews
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Direct customer feedback and ratings</p>
        </div>

        <button onClick={onRefresh} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left">
          <thead>
            <tr className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">
              <th className="py-2 px-2.5">Customer</th>
              <th className="py-2 px-2.5">Outlet</th>
              <th className="py-2 px-2.5">Rating</th>
              <th className="py-2 px-2.5">Review</th>
              <th className="py-2 px-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-2.5"><div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3.5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5 text-right"><div className="h-5 w-12 bg-zinc-100 dark:bg-zinc-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : list.length > 0 ? (
              list.map((review) => (
                <tr key={review.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                  <td className="py-2.5 px-2.5 font-bold text-zinc-900 dark:text-white">{review.customer}</td>
                  <td className="py-2.5 px-2.5 truncate max-w-[100px]">{review.store.replace("Papa Veg Pizza - ", "")}</td>
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star size={11} className="fill-amber-500" />
                      <span className="font-extrabold text-[10px]">{review.rating}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2.5 max-w-[160px] truncate text-zinc-500 font-medium" title={review.review}>
                    {review.review}
                  </td>
                  <td className="py-2.5 px-2.5 text-right">
                    <button
                      onClick={() => handleOpenReplyModal(review)}
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                        review.reply 
                          ? "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700" 
                          : "bg-[var(--primary)] text-white border-transparent hover:bg-[var(--primary-hover)] shadow-sm"
                      }`}
                    >
                      {review.reply ? "Edit Reply" : "Reply"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-12 text-zinc-400">
                  <MessageSquare size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5] mb-2" />
                  No reviews received in this filter range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl animate-fade-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <span className="text-[8px] font-extrabold uppercase bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 w-max">
                  <Star size={10} className="fill-amber-500 text-amber-500" />
                  {selectedReview.rating} Rated
                </span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white mt-1">Review from {selectedReview.customer}</h3>
              </div>
              <button onClick={() => setSelectedReview(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSendReply} className="p-6 space-y-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                <p className="text-[9px] uppercase text-zinc-400 font-bold">Store Outlet</p>
                <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedReview.store}</p>
                
                <p className="text-[9px] uppercase text-zinc-400 font-bold mt-2.5">Review Message</p>
                <p className="text-zinc-550 dark:text-zinc-400 leading-relaxed font-medium mt-0.5">"{selectedReview.review}"</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Your Reply Message</label>
                <textarea
                  required
                  rows="3"
                  placeholder="Type a polite and professional response..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-zinc-800 dark:text-zinc-100 outline-none focus:border-[var(--primary)] font-semibold placeholder:text-zinc-400"
                />
              </div>

              {/* Footer buttons */}
              <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/10 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submittingReply ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Send Response</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
