import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { ArrowLeft, Lock, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import api from "@food/api"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { API_ENDPOINTS } from "@food/api/config"

export default function Privacy() {
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const [loading, setLoading] = useState(true)
  const [privacyData, setPrivacyData] = useState({
    title: 'Privacy Policy',
    content: ''
  })

  useEffect(() => {
    fetchPrivacyData()
  }, [])

  const fallbackContent = `
<h3>1. Information We Collect</h3>
<p>At Papa Veg Pizza, we collect personal information that you provide to us such as name, address, contact information, passwords and security data, and payment information.</p>

<h3>2. How We Use Your Information</h3>
<p>We use personal information collected via our application for a variety of business purposes. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>

<h3>3. Will Your Information Be Shared?</h3>
<p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>

<h3>4. How Long Do We Keep Your Information?</h3>
<p>We keep your information for as long as necessary to fulfill the purposes outlined in this privacy policy unless otherwise required by law.</p>

<h3>5. How Do We Keep Your Information Safe?</h3>
<p>We aim to protect your personal information through a system of organizational and technical security measures.</p>
  `

  const fetchPrivacyData = async () => {
    try {
      setLoading(true)
      const response = await api.get(API_ENDPOINTS.ADMIN.PRIVACY_PUBLIC)
      if (response.data.success && response.data.data && response.data.data.content) {
        setPrivacyData(response.data.data)
      } else {
        setPrivacyData({ title: 'Privacy Policy', content: fallbackContent })
      }
    } catch (error) {
      console.error('Error fetching privacy data:', error)
      setPrivacyData({ title: 'Privacy Policy', content: fallbackContent })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (window.history.length > 0) {
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
               {privacyData.title || "Privacy Policy"}
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
          {privacyData.content ? (
            <div
              className="prose prose-slate dark:prose-invert max-w-none
                prose-headings:font-black prose-headings:text-gray-900 dark:prose-headings:text-white
                prose-p:text-gray-600 dark:prose-p:text-gray-400 prose-p:leading-relaxed
                prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-a:text-[#CB202D] dark:prose-a:text-[#7e3866]
                prose-li:text-gray-600 dark:prose-li:text-gray-400"
              dangerouslySetInnerHTML={{ __html: privacyData.content }}
            />
          ) : (
            <div className="text-center py-28 flex flex-col items-center justify-center">
               <Lock className="w-20 h-20 text-[#1e293b] dark:text-[#1e293b] mb-6 stroke-[1.5]" />
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


