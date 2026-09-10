import React, { useState, useEffect } from 'react';
import { X, FileText, Calculator, HelpCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useGenerateTaxReport } from '../hooks/useTaxQuery';

export default function GenerateTaxReportModal({ isOpen, onClose, onSuccess }) {
  const { generateReport, loading } = useGenerateTaxReport();

  const [formData, setFormData] = useState({
    financialYear: '2026-27',
    quarter: 'Q1',
    month: 'April',
    regionId: 'reg-north',
    state: 'Madhya Pradesh',
    franchiseId: 'fran-bhopal',
    exportFormat: 'pdf'
  });

  const [previewData, setPreviewData] = useState({
    sales: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    cess: 0,
    totalTax: 0,
    invoiceCount: 0
  });

  const [previewLoading, setPreviewLoading] = useState(false);

  // Set months list depending on the selected quarter
  const getMonthsForQuarter = (quarter) => {
    switch (quarter) {
      case 'Q1': return ['April', 'May', 'June'];
      case 'Q2': return ['July', 'August', 'September'];
      case 'Q3': return ['October', 'November', 'December'];
      case 'Q4': return ['January', 'February', 'March'];
      default: return ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
    }
  };

  // Adjust month selection if it doesn't belong to the newly selected quarter
  const handleQuarterChange = (e) => {
    const q = e.target.value;
    const months = getMonthsForQuarter(q);
    setFormData(prev => ({
      ...prev,
      quarter: q,
      month: q === 'All' ? 'All' : months[0]
    }));
  };

  // Recalculate or simulate estimation preview whenever filters change
  useEffect(() => {
    if (!isOpen) return;

    setPreviewLoading(true);
    const handler = setTimeout(() => {
      // Create a deterministic factor based on form fields to simulate live calculations
      let baseSales = 12000000; // default MP April 2026-27

      if (formData.financialYear === '2025-26') baseSales *= 0.82;
      
      switch (formData.month) {
        case 'May': baseSales *= 1.25; break;
        case 'June': baseSales *= 1.10; break;
        case 'July': baseSales *= 0.95; break;
        case 'August': baseSales *= 0.90; break;
        case 'September': baseSales *= 1.05; break;
        case 'October': baseSales *= 1.40; break; // Festive
        case 'November': baseSales *= 1.35; break;
        case 'December': baseSales *= 1.50; break;
        case 'January': baseSales *= 1.15; break;
        case 'February': baseSales *= 1.08; break;
        case 'March': baseSales *= 1.30; break;
        case 'All': 
          // Quarter calculation
          if (formData.quarter === 'Q1') baseSales *= 3.35;
          else if (formData.quarter === 'Q2') baseSales *= 2.90;
          else if (formData.quarter === 'Q3') baseSales *= 4.25;
          else if (formData.quarter === 'Q4') baseSales *= 3.53;
          else baseSales *= 14.2; // All Year
          break;
        default: break;
      }

      if (formData.franchiseId === 'All') baseSales *= 2.5;
      if (formData.state === 'Maharashtra') baseSales *= 1.4;
      else if (formData.state === 'Karnataka') baseSales *= 1.25;
      else if (formData.state === 'Delhi NCR') baseSales *= 1.15;
      else if (formData.state === 'All') baseSales *= 3.8;

      const taxable = Math.round(baseSales * 0.84); // 84% taxable, rest non-taxable or exempt
      const cgst = formData.state === 'All' || formData.franchiseId === 'All' ? Math.round(taxable * 0.045) : Math.round(taxable * 0.09); // 9% CGST
      const sgst = formData.state === 'All' || formData.franchiseId === 'All' ? Math.round(taxable * 0.045) : Math.round(taxable * 0.09); // 9% SGST
      const igst = formData.state === 'All' || formData.franchiseId === 'All' ? Math.round(taxable * 0.09) : 0; // Interstate or mixed
      const cess = Math.round(taxable * 0.01); // 1% Cess
      const totalTax = cgst + sgst + igst + cess;
      const invoiceCount = Math.round(baseSales / 282); // average ticket size of 282 Rs

      setPreviewData({
        sales: Math.round(baseSales),
        taxable,
        cgst,
        sgst,
        igst,
        cess,
        totalTax,
        invoiceCount
      });
      setPreviewLoading(false);
    }, 400);

    return () => clearTimeout(handler);
  }, [formData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await generateReport(formData);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[950px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-black dark:text-white">
                Compile GST Tax Report
              </h3>
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                Generate CGST, SGST, IGST liability statements and invoicing records for GST returns filling
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex flex-col shrink-0">
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Controls (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider pb-1 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5">
                <span>Compliance Filters</span>
              </h4>

              {/* Financial Year */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Financial Year</label>
                <select
                  value={formData.financialYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, financialYear: e.target.value }))}
                  className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                >
                  <option value="2026-27">FY 2026-27 (Current)</option>
                  <option value="2025-26">FY 2025-26 (Previous)</option>
                </select>
              </div>

              {/* Period Selectors (Quarter & Month) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Quarter</label>
                  <select
                    value={formData.quarter}
                    onChange={handleQuarterChange}
                    className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                  >
                    <option value="All">All Quarters</option>
                    <option value="Q1">Q1 (Apr - Jun)</option>
                    <option value="Q2">Q2 (Jul - Sep)</option>
                    <option value="Q3">Q3 (Oct - Dec)</option>
                    <option value="Q4">Q4 (Jan - Mar)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Month</label>
                  <select
                    value={formData.month}
                    disabled={formData.quarter === 'All'}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white disabled:opacity-50"
                  >
                    {formData.quarter === 'All' ? (
                      <option value="All">All Months</option>
                    ) : (
                      <>
                        <option value="All">All Q-Months</option>
                        {getMonthsForQuarter(formData.quarter).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Region & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Region Zone</label>
                  <select
                    value={formData.regionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, regionId: e.target.value }))}
                    className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                  >
                    <option value="All">All Regions</option>
                    <option value="reg-north">North Zone</option>
                    <option value="reg-west">West Zone</option>
                    <option value="reg-south">South Zone</option>
                    <option value="reg-east">East Zone</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">GST Filing State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                  >
                    <option value="All">All States</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                  </select>
                </div>
              </div>

              {/* Franchise ID Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Franchise Account</label>
                <select
                  value={formData.franchiseId}
                  onChange={(e) => setFormData(prev => ({ ...prev, franchiseId: e.target.value }))}
                  className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                >
                  <option value="All">All Franchisees</option>
                  <option value="fran-bhopal">Bhopal Central Franchise</option>
                  <option value="fran-mumbai">Mumbai Premium Franchise</option>
                  <option value="fran-bangalore">Bangalore South Franchise</option>
                  <option value="fran-delhi">Delhi Central Franchise</option>
                </select>
              </div>

              {/* Export Target Format */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Primary Compilation Format</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {['pdf', 'excel', 'csv'].map((fmt) => (
                    <label 
                      key={fmt}
                      className={`h-9 flex items-center justify-center gap-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-all uppercase select-none ${
                        formData.exportFormat === fmt
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="exportFormat" 
                        value={fmt}
                        checked={formData.exportFormat === fmt}
                        onChange={() => setFormData(prev => ({ ...prev, exportFormat: fmt }))}
                        className="hidden" 
                      />
                      <FileText size={13} />
                      {fmt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Estimation Preview Panel (7 Cols) */}
            <div className="lg:col-span-7 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center pb-3 border-b border-zinc-250 dark:border-zinc-800">
                  <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Calculator size={14} className="text-[var(--primary)]" />
                    GST Tax liability Estimation Preview
                  </h4>
                  {previewLoading && (
                    <RefreshCw size={12} className="animate-spin text-[var(--primary)]" />
                  )}
                </div>

                {/* Estimate Info Notice */}
                <div className="mt-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 text-[10px] text-orange-800 dark:text-orange-350 leading-relaxed font-semibold">
                  This preview aggregates mock estimates from GSTR-1 & GSTR-3B filings for the chosen period. Compiling will log this query with your IP for regulatory audit trails.
                </div>

                {/* Calculation breakdown */}
                <div className="mt-4 space-y-2.5">
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-zinc-500 font-semibold">Projected Gross Sales</span>
                    <span className={`font-extrabold text-zinc-900 dark:text-white ${previewLoading ? 'opacity-30' : ''}`}>
                      ₹ {previewData.sales.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs py-1">
                    <span className="text-zinc-500 font-semibold">Taxable Amount (Excl. Exempt/Zero)</span>
                    <span className={`font-extrabold text-zinc-900 dark:text-white ${previewLoading ? 'opacity-30' : ''}`}>
                      ₹ {previewData.taxable.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2"></div>

                  {/* CGST, SGST, IGST breakdown table */}
                  <div className="space-y-1.5 pl-3">
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-450 dark:text-zinc-400">
                      <span>Central GST (CGST)</span>
                      <span className={previewLoading ? 'opacity-30' : ''}>₹ {previewData.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-450 dark:text-zinc-400">
                      <span>State GST (SGST)</span>
                      <span className={previewLoading ? 'opacity-30' : ''}>₹ {previewData.sgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-450 dark:text-zinc-400">
                      <span>Integrated GST (IGST)</span>
                      <span className={previewLoading ? 'opacity-30' : ''}>₹ {previewData.igst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-zinc-450 dark:text-zinc-400">
                      <span>Compensation Cess</span>
                      <span className={previewLoading ? 'opacity-30' : ''}>₹ {previewData.cess.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2"></div>

                  <div className="flex justify-between text-xs font-bold py-1 bg-zinc-100/50 dark:bg-zinc-900/40 p-2 rounded-lg">
                    <span className="text-zinc-900 dark:text-zinc-100">Total Tax Liability</span>
                    <span className={`text-[var(--primary)] font-extrabold ${previewLoading ? 'opacity-30' : ''}`}>
                      ₹ {previewData.totalTax.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-400 font-bold px-2">
                    <span>Total Invoices Scanned</span>
                    <span className={previewLoading ? 'opacity-30' : ''}>{previewData.invoiceCount.toLocaleString()} Invoices</span>
                  </div>
                </div>
              </div>

              {/* Ready message */}
              <div className="mt-6 border-t border-zinc-200 dark:border-zinc-800 pt-4 flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                <span className="text-[10px] font-bold text-zinc-550 dark:text-zinc-400">
                  Filters are verified. Form is ready to compile compliance statement.
                </span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || previewLoading}
              className="px-5 py-1.5 bg-[var(--primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg shadow active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading && <RefreshCw size={12} className="animate-spin" />}
              Compile & Generate Report
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
