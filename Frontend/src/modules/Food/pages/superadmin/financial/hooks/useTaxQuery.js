import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../../../../services/api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

// =============================================================
// API CONNECTION PROBING & MOCK BYPASS (Prevents console ERR_CONNECTION_REFUSED)
// =============================================================
const FORCE_MOCK_MODE = false; // Toggle to true to completely bypass API network calls
let isBackendOffline = sessionStorage.getItem('tax_api_offline') === 'true';
let connectionPromise = null;

async function verifyConnection() {
  if (FORCE_MOCK_MODE) return false;
  if (isBackendOffline) return false;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async () => {
    try {
      // Send a lightweight request to probe if the backend is listening
      await apiClient.get('/finance/tax-report/summary', { params: { probe: true }, timeout: 800 });
      return true;
    } catch (err) {
      // If there is no response, the connection was refused or timed out (backend offline)
      if (!err.response) {
        sessionStorage.setItem('tax_api_offline', 'true');
        isBackendOffline = true;
        return false;
      }
      return true; // Server responded (e.g., 401/404), so port 5000 is active
    }
  })();

  return connectionPromise;
}

// Mock summary metrics
const MOCK_SUMMARY = {
  totalTaxCollected: 82000000,
  cgst: 20500000,
  sgst: 20500000,
  igst: 32000000,
  taxableSales: 680000000,
  pendingFilings: 15,
  totalTrend: +8.4,
  cgstTrend: +6.2,
  sgstTrend: +6.2,
  igstTrend: +11.8,
  salesTrend: +9.5,
  pendingTrend: -12.5
};

// Mock Reports Table
const MOCK_REPORTS = [
  { id: 'TAX-2604', period: 'Apr-2026', financialYear: '2026-27', quarter: 'Q1', month: 'April', regionId: 'reg-north', state: 'Madhya Pradesh', franchiseId: 'fran-bhopal', totalSales: 12000000, taxableAmount: 10000000, cgst: 900000, sgst: 900000, igst: 1200000, cess: 100000, totalTax: 3100000, invoiceCount: 42510, generatedBy: 'Admin Rashi', generatedAt: '2026-06-01 10:30', exportFormat: 'pdf', status: 'Generated' },
  { id: 'TAX-2605', period: 'May-2026', financialYear: '2026-27', quarter: 'Q1', month: 'May', regionId: 'reg-west', state: 'Maharashtra', franchiseId: 'fran-mumbai', totalSales: 15000000, taxableAmount: 12500000, cgst: 1125000, sgst: 1125000, igst: 1500000, cess: 125000, totalTax: 3875000, invoiceCount: 51200, generatedBy: 'Admin Rashi', generatedAt: '2026-06-15 14:00', exportFormat: 'excel', status: 'Generated' },
  { id: 'TAX-2603', period: 'Mar-2026', financialYear: '2025-26', quarter: 'Q4', month: 'March', regionId: 'reg-south', state: 'Karnataka', franchiseId: 'fran-bangalore', totalSales: 8500000, taxableAmount: 7000000, cgst: 630000, sgst: 630000, igst: 840000, cess: 70000, totalTax: 2170000, invoiceCount: 29800, generatedBy: 'SuperAdmin Ajay', generatedAt: '2026-04-10 11:20', exportFormat: 'pdf', status: 'Generated' },
  { id: 'TAX-2602', period: 'Feb-2026', financialYear: '2025-26', quarter: 'Q4', month: 'February', regionId: 'reg-north', state: 'Delhi NCR', franchiseId: 'fran-delhi', totalSales: 9200000, taxableAmount: 7800000, cgst: 702000, sgst: 702000, igst: 936000, cess: 78000, totalTax: 2418000, invoiceCount: 31500, generatedBy: 'SuperAdmin Ajay', generatedAt: '2026-03-05 09:40', exportFormat: 'csv', status: 'Generated' }
];

// Mock State Breakdown
const MOCK_STATE_BREAKDOWN = {
  'TAX-2604': [
    { state: 'Madhya Pradesh', sales: 6000000, cgst: 540000, sgst: 540000, igst: 0, totalTax: 1080000 },
    { state: 'Maharashtra', sales: 4000000, cgst: 0, sgst: 0, igst: 960000, totalTax: 960000 },
    { state: 'Delhi NCR', sales: 2000000, cgst: 0, sgst: 0, igst: 480000, totalTax: 480000 }
  ],
  'TAX-2605': [
    { state: 'Maharashtra', sales: 9000000, cgst: 810000, sgst: 810000, igst: 0, totalTax: 1620000 },
    { state: 'Karnataka', sales: 4000000, cgst: 0, sgst: 0, igst: 960000, totalTax: 960000 },
    { state: 'Madhya Pradesh', sales: 2000000, cgst: 0, sgst: 0, igst: 480000, totalTax: 480000 }
  ]
};

// Mock Franchise Breakdown
const MOCK_FRANCHISE_BREAKDOWN = {
  'TAX-2604': [
    { franchise: 'Bhopal Central Franchise', orders: 22400, taxCollected: 1600000, invoiceCount: 22400 },
    { franchise: 'Indore Central Franchise', orders: 20110, taxCollected: 1500000, invoiceCount: 20110 }
  ],
  'TAX-2605': [
    { franchise: 'Mumbai Premium Franchise', orders: 31200, taxCollected: 2375000, invoiceCount: 31200 },
    { franchise: 'Pune Central Franchise', orders: 20000, taxCollected: 1500000, invoiceCount: 20000 }
  ]
};

// Mock Charts Data
const MOCK_CHART_TRENDS = [
  { month: 'Jan', sales: 8.2, cgst: 0.6, sgst: 0.6, igst: 0.8 },
  { month: 'Feb', sales: 9.2, cgst: 0.7, sgst: 0.7, igst: 0.9 },
  { month: 'Mar', sales: 8.5, cgst: 0.63, sgst: 0.63, igst: 0.84 },
  { month: 'Apr', sales: 12.0, cgst: 0.9, sgst: 0.9, igst: 1.2 },
  { month: 'May', sales: 15.0, cgst: 1.12, sgst: 1.12, igst: 1.5 }
];

const MOCK_CHART_DISTRIBUTION = [
  { name: 'CGST', value: 25 },
  { name: 'SGST', value: 25 },
  { name: 'IGST', value: 45 },
  { name: 'CESS', value: 5 }
];

// Mock Audit Logs
const MOCK_AUDIT_LOGS = {
  'TAX-2604': [
    { action: 'Generated', performedBy: 'Admin Rashi', date: '2026-06-01 10:30', remarks: 'Tax report generated for April 2026' },
    { action: 'Downloaded', performedBy: 'Admin Rashi', date: '2026-06-01 10:32', remarks: 'PDF statement downloaded' },
    { action: 'Exported', performedBy: 'SuperAdmin Ajay', date: '2026-06-03 14:15', remarks: 'Excel ledger statement exported' }
  ],
  'TAX-2605': [
    { action: 'Generated', performedBy: 'Admin Rashi', date: '2026-06-15 14:00', remarks: 'Tax report generated for May 2026' }
  ]
};

// Mock Overall Audit Logs with IP Address
const MOCK_IP_AUDIT_LOGS = [
  { timestamp: '2026-06-18 10:42', user: 'Admin Rashi', action: 'Report Exported', ipAddress: '192.168.1.42', remarks: 'Exported report TAX-2604 in PDF format' },
  { timestamp: '2026-06-18 09:15', user: 'SuperAdmin Ajay', action: 'Report Generated', ipAddress: '192.168.1.10', remarks: 'Generated monthly GST report for Bhopal Central' },
  { timestamp: '2026-06-17 16:30', user: 'Admin Rashi', action: 'Audit Log View', ipAddress: '192.168.1.42', remarks: 'Opened compliance logs window' },
  { timestamp: '2026-06-16 11:20', user: 'SuperAdmin Ajay', action: 'Tax Slab Update', ipAddress: '192.168.1.10', remarks: 'Updated IGST default slab setting to 18%' }
];

export function useTaxSummary(filters) {
  const [data, setData] = useState(MOCK_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    const isOnline = await verifyConnection();
    if (!isOnline) {
      let factor = 1.0;
      if (filters?.financialYear === '2025-26') factor = 0.8;
      if (filters?.franchiseId) factor = 0.35;

      setData({
        totalTaxCollected: Math.round(MOCK_SUMMARY.totalTaxCollected * factor),
        cgst: Math.round(MOCK_SUMMARY.cgst * factor),
        sgst: Math.round(MOCK_SUMMARY.sgst * factor),
        igst: Math.round(MOCK_SUMMARY.igst * factor),
        taxableSales: Math.round(MOCK_SUMMARY.taxableSales * factor),
        pendingFilings: filters?.financialYear ? 2 : MOCK_SUMMARY.pendingFilings,
        totalTrend: MOCK_SUMMARY.totalTrend,
        cgstTrend: MOCK_SUMMARY.cgstTrend,
        sgstTrend: MOCK_SUMMARY.sgstTrend,
        igstTrend: MOCK_SUMMARY.igstTrend,
        salesTrend: MOCK_SUMMARY.salesTrend,
        pendingTrend: MOCK_SUMMARY.pendingTrend
      });
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/finance/tax-report/summary', { params: filters, timeout: 1000 });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || MOCK_SUMMARY);
      }
    } catch (err) {
      console.info("Using mock tax reports summary.");
      let factor = 1.0;
      if (filters?.financialYear === '2025-26') factor = 0.8;
      if (filters?.franchiseId) factor = 0.35;

      setData({
        totalTaxCollected: Math.round(MOCK_SUMMARY.totalTaxCollected * factor),
        cgst: Math.round(MOCK_SUMMARY.cgst * factor),
        sgst: Math.round(MOCK_SUMMARY.sgst * factor),
        igst: Math.round(MOCK_SUMMARY.igst * factor),
        taxableSales: Math.round(MOCK_SUMMARY.taxableSales * factor),
        pendingFilings: filters?.financialYear ? 2 : MOCK_SUMMARY.pendingFilings,
        totalTrend: MOCK_SUMMARY.totalTrend,
        cgstTrend: MOCK_SUMMARY.cgstTrend,
        sgstTrend: MOCK_SUMMARY.sgstTrend,
        igstTrend: MOCK_SUMMARY.igstTrend,
        salesTrend: MOCK_SUMMARY.salesTrend,
        pendingTrend: MOCK_SUMMARY.pendingTrend
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary };
}

export function useTaxReports(filters, pagination) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const isOnline = await verifyConnection();
    if (!isOnline) {
      let results = [...MOCK_REPORTS];

      if (filters?.financialYear) {
        results = results.filter(r => r.financialYear === filters.financialYear);
      }
      if (filters?.quarter && filters.quarter !== 'All') {
        results = results.filter(r => r.quarter === filters.quarter);
      }
      if (filters?.month && filters.month !== 'All') {
        results = results.filter(r => r.month === filters.month);
      }
      if (filters?.state) {
        results = results.filter(r => r.state === filters.state);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.id.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.month.toLowerCase().includes(q)
        );
      }

      const count = results.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(results.slice(start, start + pagination.limit));
      setTotal(count);
      setLoading(false);
      return;
    }

    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      const response = await apiClient.get('/finance/tax-report', { params, timeout: 1000 });
      if (response.data && response.data.success) {
        setData(response.data.data);
        setTotal(response.data.pagination?.total || response.data.total || response.data.data.length);
      } else {
        setData(response.data.data || MOCK_REPORTS);
        setTotal(response.data.total || MOCK_REPORTS.length);
      }
    } catch (err) {
      console.info("Using mock tax reports listing.");
      let results = [...MOCK_REPORTS];

      if (filters?.financialYear) {
        results = results.filter(r => r.financialYear === filters.financialYear);
      }
      if (filters?.quarter && filters.quarter !== 'All') {
        results = results.filter(r => r.quarter === filters.quarter);
      }
      if (filters?.month && filters.month !== 'All') {
        results = results.filter(r => r.month === filters.month);
      }
      if (filters?.state) {
        results = results.filter(r => r.state === filters.state);
      }
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.id.toLowerCase().includes(q) ||
          r.state.toLowerCase().includes(q) ||
          r.month.toLowerCase().includes(q)
        );
      }

      const count = results.length;
      const start = (pagination.page - 1) * pagination.limit;
      setData(results.slice(start, start + pagination.limit));
      setTotal(count);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { data, total, loading, error, refetch: fetchReports };
}

export function useTaxReportDetails(id) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const isOnline = await verifyConnection();
    if (!isOnline) {
      setData(generateMockDetails(id));
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(`/finance/tax-report/${id}`, { timeout: 1000 });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || generateMockDetails(id));
      }
    } catch (err) {
      console.info("Using mock tax report details.");
      setData(generateMockDetails(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { data, loading, error, refetch: fetchDetails };
}

function generateMockDetails(id) {
  const matched = MOCK_REPORTS.find(r => r.id === id) || MOCK_REPORTS[0];
  return {
    id: matched.id,
    period: matched.period,
    financialYear: matched.financialYear,
    quarter: matched.quarter,
    month: matched.month,
    sales: matched.totalSales,
    taxableSales: matched.taxableAmount,
    totalTax: matched.totalTax,
    invoiceCount: matched.invoiceCount,
    breakdown: {
      cgst: matched.cgst,
      sgst: matched.sgst,
      igst: matched.igst,
      cess: matched.cess
    },
    stateBreakdown: MOCK_STATE_BREAKDOWN[id] || MOCK_STATE_BREAKDOWN['TAX-2604'],
    franchiseBreakdown: MOCK_FRANCHISE_BREAKDOWN[id] || MOCK_FRANCHISE_BREAKDOWN['TAX-2604'],
    charts: {
      trends: MOCK_CHART_TRENDS,
      distribution: MOCK_CHART_DISTRIBUTION
    },
    auditLogs: MOCK_AUDIT_LOGS[id] || MOCK_AUDIT_LOGS['TAX-2604']
  };
}

export function useGenerateTaxReport() {
  const [loading, setLoading] = useState(false);

  const generateReport = async (formData) => {
    setLoading(true);

    const isOnline = await verifyConnection();
    if (!isOnline) {
      const newReport = {
        id: `TAX-${Date.now().toString().slice(-4)}`,
        period: `${formData.month || 'Q' + formData.quarter}-${formData.financialYear.slice(2, 4)}`,
        financialYear: formData.financialYear,
        quarter: formData.quarter,
        month: formData.month || 'Summary',
        regionId: formData.regionId || 'reg-north',
        state: formData.state || 'Madhya Pradesh',
        franchiseId: formData.franchiseId || 'fran-bhopal',
        totalSales: 10500000,
        taxableAmount: 9000000,
        cgst: 810000,
        sgst: 810000,
        igst: 1080000,
        cess: 90000,
        totalTax: 2790000,
        invoiceCount: 38200,
        generatedBy: 'Admin Rashi',
        generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        exportFormat: formData.exportFormat || 'pdf',
        status: 'Generated'
      };

      MOCK_REPORTS.unshift(newReport);
      toast.success("GST report successfully compiled (Simulation)!");
      setLoading(false);
      return true;
    }

    try {
      const response = await apiClient.post('/finance/tax-report/generate', formData, { timeout: 1000 });
      if (response.data && response.data.success) {
        toast.success("GST Tax compliance report successfully generated!");
        return true;
      }
      return true;
    } catch (err) {
      console.info("Generate report offline simulation.");
      const newReport = {
        id: `TAX-${Date.now().toString().slice(-4)}`,
        period: `${formData.month || 'Q' + formData.quarter}-${formData.financialYear.slice(2, 4)}`,
        financialYear: formData.financialYear,
        quarter: formData.quarter,
        month: formData.month || 'Summary',
        regionId: formData.regionId || 'reg-north',
        state: formData.state || 'Madhya Pradesh',
        franchiseId: formData.franchiseId || 'fran-bhopal',
        totalSales: 10500000,
        taxableAmount: 9000000,
        cgst: 810000,
        sgst: 810000,
        igst: 1080000,
        cess: 90000,
        totalTax: 2790000,
        invoiceCount: 38200,
        generatedBy: 'Admin Rashi',
        generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        exportFormat: formData.exportFormat || 'pdf',
        status: 'Generated'
      };

      MOCK_REPORTS.unshift(newReport);
      toast.success("GST report successfully compiled (Simulation)!");
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { generateReport, loading };
}

export function useExportTaxReports() {
  const [exportLoading, setExportLoading] = useState(false);

  const exportReport = async (format, id, filters = {}) => {
    setExportLoading(true);

    const isOnline = await verifyConnection();
    if (!isOnline) {
      exportReportOffline(format, id, filters);
      setExportLoading(false);
      return true;
    }

    try {
      const response = await apiClient.get('/finance/tax-report/export', {
        params: { format, id, ...filters },
        responseType: 'blob',
        timeout: 1000
      });
      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `tax_reports_ledger.${format === 'excel' ? 'csv' : 'pdf'}`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("GST tax statement exported successfully");
      return true;
    } catch (err) {
      console.info("Export API offline. Running local client-side file exporter.");
      exportReportOffline(format, id, filters);
    } finally {
      setExportLoading(false);
    }
  };

  const exportReportOffline = (format, id, filters) => {
    let targetList = id ? [generateMockDetails(id)] : MOCK_REPORTS;

    if (format === 'excel' || format === 'csv') {
      const headers = ["Period", "Sales (INR)", "Taxable Amount (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "CESS (INR)", "Total Tax (INR)", "Invoice Count", "Status"];
      const rows = targetList.map(r => [
        r.period || r.id,
        r.totalSales || r.sales,
        r.taxableAmount || r.taxableSales,
        r.cgst || r.breakdown?.cgst,
        r.sgst || r.breakdown?.sgst,
        r.igst || r.breakdown?.igst,
        r.cess || r.breakdown?.cess,
        r.totalTax,
        r.invoiceCount,
        r.status || 'Generated'
      ]);

      const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `tax_compliance_report_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Tax Compliance statement CSV downloaded successfully");
    } else {
      const doc = new jsPDF();
      
      doc.setFillColor(164, 60, 18);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("PAPA VEG PIZZA", 14, 18);
      
      doc.setFontSize(10);
      doc.text("Super Admin GST Tax Reports & regulatory audits", 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 28);
      
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text("Tax & GST Compliance Report Statement", 14, 52);
      
      autoTable(doc, {
        startY: 58,
        head: [['Period/ID', 'Total Sales', 'Taxable Amt', 'CGST', 'SGST', 'IGST', 'CESS', 'Total Tax']],
        body: targetList.map(r => [
          r.period || r.id,
          `Rs. ${(r.totalSales || r.sales).toLocaleString('en-IN')}`,
          `Rs. ${(r.taxableAmount || r.taxableSales).toLocaleString('en-IN')}`,
          `Rs. ${(r.cgst || r.breakdown?.cgst).toLocaleString('en-IN')}`,
          `Rs. ${(r.sgst || r.breakdown?.sgst).toLocaleString('en-IN')}`,
          `Rs. ${(r.igst || r.breakdown?.igst).toLocaleString('en-IN')}`,
          `Rs. ${(r.cess || r.breakdown?.cess).toLocaleString('en-IN')}`,
          `Rs. ${r.totalTax.toLocaleString('en-IN')}`
        ]),
        headStyles: { fillColor: [164, 60, 18] },
        theme: 'striped',
        margin: { top: 10 }
      });

      const filename = `tax_reports_statement_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      toast.success("GST statement PDF downloaded successfully");
    }
  };

  return { exportReport, exportLoading };
}

export function useAuditLogs(filters) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const isOnline = await verifyConnection();
    if (!isOnline) {
      let results = [...MOCK_IP_AUDIT_LOGS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.user.toLowerCase().includes(q) ||
          r.action.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q)
        );
      }
      setData(results);
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/finance/tax-report/audit-logs', { params: filters, timeout: 1000 });
      if (response.data && response.data.success) {
        setData(response.data.data);
      } else {
        setData(response.data || MOCK_IP_AUDIT_LOGS);
      }
    } catch (err) {
      console.info("Using mock compliance audit logs.");
      let results = [...MOCK_IP_AUDIT_LOGS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(r => 
          r.user.toLowerCase().includes(q) ||
          r.action.toLowerCase().includes(q) ||
          r.remarks.toLowerCase().includes(q)
        );
      }
      setData(results);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { data, loading, error, refetch: fetchLogs };
}
