import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

export default function TrainTerms() {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pvp_home_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.trainConfig && parsed.trainConfig.faqs) {
          setFaqs(parsed.trainConfig.faqs);
        }
      }
    } catch (e) {
      console.error("Failed to parse home config for faqs", e);
    }

    const handleHomeConfigChange = (e) => {
      let parsed = null;
      if (e.type === 'homePageConfigUpdated') {
        parsed = e.detail;
      } else if (e && e.key === 'pvp_home_config' && e.newValue) {
        parsed = JSON.parse(e.newValue);
      }
      
      if (parsed && parsed.trainConfig && parsed.trainConfig.faqs) {
        setFaqs(parsed.trainConfig.faqs);
      }
    };

    window.addEventListener('homePageConfigUpdated', handleHomeConfigChange);
    window.addEventListener('storage', handleHomeConfigChange);

    return () => {
      window.removeEventListener('homePageConfigUpdated', handleHomeConfigChange);
      window.removeEventListener('storage', handleHomeConfigChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-10">
      {/* Header */}
      <div className="bg-[#E53935] text-white px-4 py-4 flex items-center sticky top-0 z-50 shadow-md">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-3 p-1 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] font-semibold tracking-wide">IRCTC T&C</h1>
      </div>

      <div className="px-4 py-6">
        <h2 className="text-xl font-bold text-center text-zinc-800 mb-6">Disclaimer</h2>

        <div className="space-y-3">
          {faqs.length > 0 ? (
            faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="bg-white rounded-md shadow-sm border border-zinc-100 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-4 py-3.5 flex justify-between items-center text-left"
                  >
                    <span className="text-[13px] font-medium text-zinc-700">{faq.question}</span>
                    <span className="text-[#E53935] ml-2 shrink-0 font-bold text-lg leading-none">
                      {isOpen ? '-' : '+'}
                    </span>
                  </button>
                  
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-[13px] text-zinc-600 bg-zinc-50/50 leading-relaxed border-t border-zinc-50">
                      {faq.answer.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-zinc-500 text-sm mt-10">No FAQs available at the moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
