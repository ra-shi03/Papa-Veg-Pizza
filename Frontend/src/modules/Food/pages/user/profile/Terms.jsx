import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import api from "@food/api"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { API_ENDPOINTS } from "@food/api/config"

export default function Terms() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const [loading, setLoading] = useState(true)
  const [termsData, setTermsData] = useState({
    title: 'Terms of Service',
    content: ''
  })

  useEffect(() => {
    fetchTermsData()
  }, [])

  const fallbackContent = `
<h3>1. Introduction</h3>
<p>Welcome to Papa Veg Pizza. By accessing our application and using our services, you agree to be bound by these Terms of Service. Please read them carefully.</p>

<h3>2. Ordering and Delivery</h3>
<p>All orders are subject to availability and confirmation of the order price. Dispatch times may vary according to availability and any guarantees or representations made as to delivery times are subject to any delays resulting from traffic or force majeure for which we will not be responsible.</p>

<h3>3. Pricing and Availability</h3>
<p>Whilst we try and ensure that all details, descriptions and prices which appear on this application are accurate, errors may occur. If we discover an error in the price of any goods which you have ordered we will inform you of this as soon as possible.</p>

<h3>4. Payment</h3>
<p>Upon receiving your order we carry out a standard pre-authorization check on your payment card to ensure there are sufficient funds to fulfill the transaction.</p>

<h3>5. Disclaimer of Liability</h3>
<p>The material displayed on this application is provided without any guarantees, conditions or warranties as to its accuracy. Papa Veg Pizza hereby expressly excludes all conditions, warranties and other terms which might otherwise be implied by statute.</p>
  `

  const fetchTermsData = async () => {
    try {
      setLoading(true)
      const response = await api.get(API_ENDPOINTS.ADMIN.TERMS_PUBLIC)
      if (response.data.success && response.data.data && response.data.data.content) {
        setTermsData(response.data.data)
      } else {
        setTermsData({ title: 'Terms of Service', content: fallbackContent })
      }
    } catch (error) {
      console.error('Error fetching terms data:', error)
      setTermsData({ title: 'Terms of Service', content: fallbackContent })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 0) {
      // goBack()
      navigate('/user/account')
    } else {
      navigate('/user/account')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#CB202D]" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatedPage className="min-h-screen bg-white dark:bg-[#0a0a0a] pb-10">
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-4xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 transition-all active:scale-95 flex-shrink-0"
          >
            <ArrowLeft className="h-6 w-6 text-gray-900 dark:text-white" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              {termsData.title || "Terms of Service"}
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Papa Veg Pizza Policy</p>
          </div>
          <div className="w-10 h-10 flex-shrink-0"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111] rounded-[2rem] p-6 md:p-10 shadow-sm border border-gray-50 dark:border-gray-900"
        >
          {termsData.content ? (
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-black prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-a:text-[#CB202D] dark:prose-a:text-[#7e3866]
                prose-li:text-gray-600 dark:prose-li:text-gray-400"
              dangerouslySetInnerHTML={{ __html: termsData.content }}
            />
          ) : (
            <div className="text-center py-28 flex flex-col items-center justify-center">
              <FileText className="w-20 h-20 text-[#1e293b] dark:text-[#1e293b] mb-6 stroke-[1.5]" />
              <p className="text-[#94a3b8] dark:text-[#94a3b8] text-lg font-medium tracking-tight">No content available at the moment.</p>
            </div>
          )}
        </motion.div>

        <p className="text-center mt-10 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} <br />
          © {new Date().getFullYear()} Papa Veg Pizza. All Rights Reserved.
        </p>
      </div>
    </AnimatedPage>
  )
}


