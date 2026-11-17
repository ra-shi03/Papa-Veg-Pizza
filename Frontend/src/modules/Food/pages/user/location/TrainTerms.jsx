import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TRAIN_TERMS_TITLE, TRAIN_TERMS_FULL } from '@food/constants/trainDelivery';

// What train delivery does in this app (see constants/trainDelivery.js). No stored or admin-written copy.
export default function TrainTerms() {
  const navigate = useNavigate();

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
        <h1 className="text-[16px] font-semibold tracking-wide">{TRAIN_TERMS_TITLE}</h1>
      </div>

      <div className="px-4 py-6 space-y-3">
        {TRAIN_TERMS_FULL.map((item) => (
          <div key={item.title} className="bg-white rounded-md shadow-sm border border-zinc-100 px-4 py-3.5">
            <h2 className="text-[13px] font-semibold text-zinc-800">{item.title}</h2>
            <p className="mt-1.5 text-[13px] text-zinc-600 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
