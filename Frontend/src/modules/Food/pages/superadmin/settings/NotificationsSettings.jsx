import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Mail, MessageSquare, Bell, Phone, Send, Eye, Edit, Power, 
  RotateCcw, Sliders, Database, ClipboardList, Cpu, Server, Play, 
  Download, ArrowUpRight, TrendingUp, Info, Check, Copy, ChevronRight, 
  AlertCircle, CheckCircle, RefreshCw, MoreVertical, Key, Lock, EyeOff,
  Plus, ArrowRight, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

// Import Modals
import CreateTemplateModal from './CreateTemplateModal';
import EditTemplateModal from './EditTemplateModal';
import ProviderConfigurationModal from './ProviderConfigurationModal';
import SendTestNotificationModal from './SendTestNotificationModal';
import PreviewTemplateModal from './PreviewTemplateModal';

// Mock Notification Templates Data (GET /api/notification/templates)
const INITIAL_TEMPLATES = [
  {
    _id: "tmp_email_welcome",
    type: "email",
    event: "OTP Verification",
    title: "Customer Signup OTP Verification",
    subject: "Verify your email address - Papa Veg Pizza",
    body: "Hello {{customerName}},\n\nYour OTP code to verify your signup is {{otpCode}}. This code is valid for 5 minutes.\n\nThanks,\nPapa Veg Pizza Team",
    variables: ["{{customerName}}", "{{otpCode}}"],
    active: true,
    updatedAt: "2026-06-19T10:15:32Z"
  },
  {
    _id: "tmp_sms_order_placed",
    type: "sms",
    event: "Order Placed",
    title: "Order Placement Success SMS",
    subject: "",
    body: "Hi {{customerName}}, your order {{orderId}} for {{amount}} is placed successfully! Track live: https://pvp.in/track",
    variables: ["{{customerName}}", "{{orderId}}", "{{amount}}"],
    active: true,
    updatedAt: "2026-06-19T09:45:00Z"
  },
  {
    _id: "tmp_push_order_out",
    type: "push",
    event: "Order Out for Delivery",
    title: "Delivery Dispatch Push Notification",
    subject: "",
    body: "Hey {{customerName}}, your hot pizza is out for delivery! Our rider is arriving in {{eta}}.",
    variables: ["{{customerName}}", "{{eta}}"],
    active: true,
    updatedAt: "2026-06-18T14:30:12Z"
  },
  {
    _id: "tmp_wa_refund",
    type: "whatsapp",
    event: "Refund Processed",
    title: "Refund Confirmation WhatsApp Alert",
    subject: "",
    body: "Hello {{customerName}},\n\nYour refund of {{amount}} for Order {{orderId}} has been processed. The amount will reflect in your account in 3-5 business days.",
    variables: ["{{customerName}}", "{{orderId}}", "{{amount}}"],
    active: false,
    updatedAt: "2026-06-17T08:15:00Z"
  }
];

// Mock Providers Data (GET /api/notification/providers)
const INITIAL_PROVIDERS = [
  { _id: "prov_email_sg", providerType: "email", providerName: "SendGrid", apiKey: "SG.api_key_placeholder", secret: "sg_secret_xxxx", status: "Active", successRate: 99.8 },
  { _id: "prov_sms_twilio", providerType: "sms", providerName: "Twilio", apiKey: "AC_twilio_sid_placeholder", secret: "twilio_token_xxxx", status: "Active", successRate: 98.6 },
  { _id: "prov_push_firebase", providerType: "push", providerName: "Firebase", apiKey: "fcm_server_key_placeholder", secret: "fcm_secret_xxxx", status: "Active", successRate: 99.9 },
  { _id: "prov_wa_meta", providerType: "whatsapp", providerName: "Meta Cloud API", apiKey: "meta_token_placeholder", secret: "meta_secret_xxxx", status: "Inactive", successRate: 94.5 }
];

// Mock Logs Data (GET /api/notification/logs)
const INITIAL_LOGS = [
  { _id: "log_001", event: "OTP Verification", recipient: "shubham@example.com", channel: "Email", status: "Success", errorMessage: null, sentAt: "2026-06-19T17:45:00Z" },
  { _id: "log_002", event: "Order Placed", recipient: "+919876543210", channel: "SMS", status: "Success", errorMessage: null, sentAt: "2026-06-19T17:40:12Z" },
  { _id: "log_003", event: "Order Out for Delivery", recipient: "user_fcm_token_99", channel: "Push", status: "Success", errorMessage: null, sentAt: "2026-06-19T17:35:00Z" },
  { _id: "log_004", event: "Refund Processed", recipient: "+919988776655", channel: "WhatsApp", status: "Failed", errorMessage: "Meta API Token Expired", sentAt: "2026-06-19T16:54:19Z" },
  { _id: "log_005", event: "OTP Verification", recipient: "+919922110022", channel: "SMS", status: "Pending", errorMessage: null, sentAt: "2026-06-19T17:58:00Z" }
];

// Mock Chart data
const VOLUME_CHART_DATA = [
  { name: 'Jun 13', Email: 1200, SMS: 2400, Push: 4500, WhatsApp: 800 },
  { name: 'Jun 14', Email: 1400, SMS: 2500, Push: 4600, WhatsApp: 850 },
  { name: 'Jun 15', Email: 1300, SMS: 2800, Push: 5200, WhatsApp: 900 },
  { name: 'Jun 16', Email: 1600, SMS: 3000, Push: 4900, WhatsApp: 1100 },
  { name: 'Jun 17', Email: 1800, SMS: 3200, Push: 5800, WhatsApp: 1300 },
  { name: 'Jun 18', Email: 2100, SMS: 3500, Push: 6200, WhatsApp: 1500 },
  { name: 'Jun 19', Email: 2400, SMS: 3800, Push: 7100, WhatsApp: 1900 },
];

const SUCCESS_CHART_DATA = [
  { name: 'Jun 13', rate: 99.4 },
  { name: 'Jun 14', rate: 99.6 },
  { name: 'Jun 15', rate: 99.2 },
  { name: 'Jun 16', rate: 99.7 },
  { name: 'Jun 17', rate: 99.5 },
  { name: 'Jun 18', rate: 99.8 },
  { name: 'Jun 19', rate: 99.85 },
];

const CHANNEL_SHARE_DATA = [
  { name: 'Email', value: 20, color: '#6366F1' },
  { name: 'SMS', value: 30, color: '#3B82F6' },
  { name: 'Push Alerts', value: 40, color: '#F59E0B' },
  { name: 'WhatsApp', value: 10, color: '#10B981' }
];

// Timeline Events Data
const INITIAL_TIMELINE = [
  { id: 1, action: "Template Approved", desc: "Email Refund template configured", user: "Admin (Shubham)", time: "5 mins ago", type: "success" },
  { id: 2, action: "Provider Failure", desc: "WhatsApp Meta Cloud API token expired", user: "System Monitor", time: "1 hour ago", type: "error" },
  { id: 3, action: "SMTP Saved", desc: "AWS SES secure host configurations saved", user: "Admin (Shubham)", time: "3 hours ago", type: "info" },
  { id: 4, action: "API Keys Rolled", desc: "FCM Push server key updated", user: "System", time: "1 day ago", type: "info" }
];

export default function NotificationSettings() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [providers, setProviders] = useState(INITIAL_PROVIDERS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE);
  const [activeTab, setActiveTab] = useState('email'); // 'email' | 'sms' | 'push' | 'whatsapp' | 'templates' | 'logs' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  // SMTP Settings controlled states
  const [smtpConfig, setSmtpConfig] = useState({
    senderEmail: 'notifications@papavegpizza.in',
    replyEmail: 'care@papavegpizza.in',
    host: 'smtp.ses.us-east-1.amazonaws.com',
    port: '465',
    username: 'AKIAIOSFODNN7EXAMPLE',
    password: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    sslEnabled: true
  });
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  // Meta WhatsApp Config states
  const [waConfig, setWaConfig] = useState({
    businessAccountId: 'act_wa_88201948',
    phoneNumberId: 'phone_990192837',
    accessToken: 'EAAGb829o0ap8x7y6t5r4e3w2q...',
    webhookToken: 'pvp_whatsapp_verify_token_8820',
    enabled: false
  });
  const [showWaToken, setShowWaToken] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Selected Entities
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reload action simulation
  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Notification configurations refreshed!");
    }, 1000);
  };

  // Create Template submit (POST)
  const handleCreateTemplate = (newTemplate) => {
    const fresh = {
      ...newTemplate,
      _id: `tmp_${newTemplate.type}_${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString()
    };
    setTemplates(prev => [...prev, fresh]);
    
    setTimeline(prev => [
      {
        id: Date.now(),
        action: "Template Created",
        desc: `New ${fresh.type.toUpperCase()} template '${fresh.title}' registered`,
        user: "Admin",
        time: "Just now",
        type: "success"
      },
      ...prev
    ]);
    toast.success("Notification template created successfully!");
  };

  // Update Template submit (PUT)
  const handleUpdateTemplate = (updated) => {
    setTemplates(prev => prev.map(t => t._id === updated._id ? updated : t));
    
    setTimeline(prev => [
      {
        id: Date.now(),
        action: "Template Modified",
        desc: `${updated.title} updated successfully`,
        user: "Admin",
        time: "Just now",
        type: "info"
      },
      ...prev
    ]);
    toast.success("Notification template updated successfully!");
  };

  // Provider configuration submit (POST/PUT)
  const handleSaveProvider = (configData) => {
    if (configData._id) {
      setProviders(prev => prev.map(p => p._id === configData._id ? { ...p, ...configData } : p));
      toast.success(`Provider ${configData.providerName} credentials updated!`);
    } else {
      const freshProv = {
        ...configData,
        _id: `prov_${configData.providerType}_${Date.now().toString().slice(-4)}`,
        successRate: 100.0
      };
      setProviders(prev => [...prev, freshProv]);
      toast.success(`Provider ${configData.providerName} added!`);
    }
  };

  // Toggle template status
  const handleToggleTemplateActive = (id) => {
    setTemplates(prev => prev.map(t => {
      if (t._id === id) {
        const nextState = !t.active;
        toast.info(`Template ${t.title} ${nextState ? 'enabled' : 'disabled'}`);
        return { ...t, active: nextState };
      }
      return t;
    }));
  };

  // Filters computed lists
  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchSearch = 
        t.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        t.event.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (t.subject && t.subject.toLowerCase().includes(debouncedSearch.toLowerCase()));
      return matchSearch;
    });
  }, [templates, debouncedSearch]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchSearch = 
        l.recipient.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        l.event.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (l.errorMessage && l.errorMessage.toLowerCase().includes(debouncedSearch.toLowerCase()));
      return matchSearch;
    });
  }, [logs, debouncedSearch]);

  return (
    <div className="p-4 space-y-5 bg-white dark:bg-zinc-950 min-h-screen text-black dark:text-zinc-100">
      
      {/* 1. Sticky Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="text-[var(--primary)]" size={22} />
            Notification Settings
          </h2>
          <p className="text-[11px] text-zinc-750 dark:text-zinc-300 font-medium leading-relaxed max-w-2xl">
            Configure notification providers, templates, channels, and delivery settings for all customer transactional events.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={handleReload}
            disabled={isLoading}
            className="p-2 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Reload
          </button>

          <button 
            onClick={() => { setSelectedProvider(null); setIsProviderOpen(true); }}
            className="px-3 py-2 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Sliders size={13} className="text-blue-500" />
            Config Provider
          </button>

          <button 
            onClick={() => setIsTestOpen(true)}
            className="px-3 py-2 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Send size={13} className="text-purple-500" />
            Send Test Alert
          </button>

          <button 
            onClick={() => setIsCreateOpen(true)}
            className="px-3 py-2 bg-[var(--primary)] text-white hover:opacity-95 active:scale-95 transition-all rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Plus size={14} /> Add Template
          </button>
        </div>
      </header>



      {/* 3. KPI Cards Grid (Soft Charcoal design) */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        
        {/* Card 1: Email */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Email</span>
            <Mail className="text-indigo-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">12</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded">Uptime 99.8%</span>
        </div>

        {/* Card 2: SMS */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>SMS Alerts</span>
            <MessageSquare className="text-blue-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">8</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded">Uptime 98.6%</span>
        </div>

        {/* Card 3: Push */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Push Apps</span>
            <Bell className="text-amber-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">6</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded">Uptime 99.9%</span>
        </div>

        {/* Card 4: WhatsApp */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>WhatsApp</span>
            <Phone className="text-emerald-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">4</p>
          <span className="text-[8.5px] px-1 bg-red-500/10 text-red-500 rounded">Meta Token error</span>
        </div>

        {/* Card 5: Failed */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Failures Today</span>
            <AlertCircle className="text-red-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">2</p>
          <span className="text-[8.5px] px-1 bg-red-500/10 text-red-650 rounded">Action Required</span>
        </div>

        {/* Card 6: Volume */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Sent Today</span>
            <TrendingUp className="text-emerald-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">14,290</p>
          <span className="text-[8.5px] text-emerald-600 font-extrabold flex items-center gap-0.5"><ArrowUpRight size={9} /> +8%</span>
        </div>

        {/* Card 7: Success Rate */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Overall Success</span>
            <CheckCircle className="text-emerald-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">99.85%</p>
          <span className="text-[8.5px] text-emerald-600 font-bold">Optimal state</span>
        </div>

        {/* Card 8: Active Providers */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Providers</span>
            <Database className="text-[var(--primary)]" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">3 / 4</p>
          <span className="text-[8.5px] px-1 bg-amber-500/10 text-amber-600 rounded">1 Inactive</span>
        </div>
      </section>

      {/* 4. Main Split Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Side: Tabs Panel (Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tab Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-850 pb-1">
            <div className="flex gap-1.5">
              {['email', 'sms', 'push', 'whatsapp', 'templates', 'logs', 'analytics'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => { setActiveTab(tab); setExpandedRow(null); }}
                  className={`px-3 py-2 text-xs font-extrabold capitalize transition-all relative ${
                    activeTab === tab 
                      ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' 
                      : 'text-zinc-750 dark:text-zinc-300 hover:opacity-85'
                  }`}
                >
                  {tab === 'push' ? 'Push Alerts' : tab}
                </button>
              ))}
            </div>

            {/* Debounced Search (Only relevant tabs) */}
            {(activeTab === 'templates' || activeTab === 'logs') && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                <input 
                  type="text" 
                  placeholder={activeTab === 'templates' ? 'Search templates...' : 'Search logs recipient...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 pr-3 w-48 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100 font-medium"
                />
              </div>
            )}
          </div>

          {/* TAB 1: Email Configuration */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              
              {/* SMTP Settings Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm text-black dark:text-zinc-100">
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="text-[var(--primary)]" size={14} />
                      SMTP Mail Server Configuration
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Define your secure transactional mail server parameters.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 rounded text-[8.5px] font-black uppercase">
                    SMTP Route: Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Sender Email Address</label>
                    <input 
                      type="email" 
                      value={smtpConfig.senderEmail}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Default Reply-To Address</label>
                    <input 
                      type="email" 
                      value={smtpConfig.replyEmail}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, replyEmail: e.target.value }))}
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 tracking-wider">SMTP Server Host</label>
                      <input 
                        type="text" 
                        value={smtpConfig.host}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, host: e.target.value }))}
                        className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Port</label>
                      <input 
                        type="text" 
                        value={smtpConfig.port}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, port: e.target.value }))}
                        className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">SMTP Username</label>
                    <input 
                      type="text" 
                      value={smtpConfig.username}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">SMTP Password</label>
                    <div className="relative">
                      <input 
                        type={showSmtpPass ? 'text' : 'password'}
                        value={smtpConfig.password}
                        onChange={(e) => setSmtpConfig(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full h-8 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute inset-y-0 right-2.5 flex items-center text-zinc-500"
                      >
                        {showSmtpPass ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold">
                    <input 
                      type="checkbox"
                      checked={smtpConfig.sslEnabled}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, sslEnabled: e.target.checked }))}
                      className="text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                    <span>Force Secure Connection (SSL/TLS)</span>
                  </label>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        toast.info("SMTP configuration test triggered...");
                        setTimeout(() => toast.success("SMTP connection successful! Ping response received in 84ms."), 800);
                      }}
                      className="px-3.5 py-1.5 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-extrabold rounded-lg text-black dark:text-zinc-100 transition-colors"
                    >
                      Verify Host
                    </button>
                    <button 
                      onClick={() => {
                        toast.success("SMTP Settings saved successfully!");
                      }}
                      className="px-3.5 py-1.5 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white text-xs font-extrabold rounded-lg transition-all shadow-sm"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>

              </div>

              {/* Email templates summary */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Trigger Event</th>
                      <th className="p-3">Email Subject line</th>
                      <th className="p-3">Active Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {templates.filter(t => t.type === 'email').map((t) => (
                      <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="p-3 font-extrabold">{t.event}</td>
                        <td className="p-3 font-medium max-w-xs truncate">{t.subject}</td>
                        <td className="p-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={t.active}
                              onChange={() => handleToggleTemplateActive(t._id)}
                              className="sr-only peer" 
                            />
                            <div className="w-8 h-4.5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
                          </label>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsPreviewOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-black dark:text-zinc-100 flex items-center gap-1 font-bold"
                            >
                              <Eye size={10} /> Preview
                            </button>
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsEditOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-blue-500 flex items-center gap-1 font-bold"
                            >
                              <Edit size={10} /> Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: SMS Configuration */}
          {activeTab === 'sms' && (
            <div className="space-y-5">
              
              {/* Providers grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {providers.filter(p => p.providerType === 'sms').map((p) => (
                  <div key={p._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between h-40 shadow-xs relative">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="font-extrabold text-[12.5px] text-zinc-900 dark:text-zinc-50">{p.providerName}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[8.5px] font-black uppercase tracking-wider border ${
                          p.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-bold">SMS Uptime Delivery Success Rate: <strong className="text-black dark:text-zinc-50">{p.successRate}%</strong></p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <button 
                        onClick={() => { setSelectedProvider(p); setIsProviderOpen(true); }}
                        className="px-2.5 py-1.5 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded text-[9.5px] text-black dark:text-zinc-100 font-bold transition-all"
                      >
                        Configure
                      </button>
                      <button 
                        onClick={() => {
                          toast.info(`Triggering SMS endpoint ping connection for ${p.providerName}...`);
                          setTimeout(() => toast.success(`${p.providerName} API online (latency 118ms)`), 700);
                        }}
                        className="px-2.5 py-1.5 bg-[var(--primary)] text-white hover:opacity-90 active:scale-95 rounded text-[9.5px] font-bold transition-all shadow-xs"
                      >
                        Ping Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* SMS templates table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Trigger Event</th>
                      <th className="p-3">SMS Text Message Body</th>
                      <th className="p-3">Variables Used</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {templates.filter(t => t.type === 'sms').map((t) => (
                      <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="p-3 font-extrabold">{t.event}</td>
                        <td className="p-3 font-medium max-w-xs truncate">{t.body}</td>
                        <td className="p-3 font-mono text-[9px] text-zinc-500">{t.variables.join(', ')}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsPreviewOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-black dark:text-zinc-100 flex items-center gap-1 font-bold"
                            >
                              <Eye size={10} />
                            </button>
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsEditOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-blue-500 flex items-center gap-1 font-bold"
                            >
                              <Edit size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: Push Notifications */}
          {activeTab === 'push' && (
            <div className="space-y-5">
              
              {/* Push Settings Details Card */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm text-black dark:text-zinc-100">
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="text-[var(--primary)]" size={14} />
                      Firebase Cloud Messaging Credentials
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Access parameters to push alerts to customer application devices.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 rounded text-[8.5px] font-black uppercase">
                    Firebase SDK: Integrated
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Project ID</label>
                    <input 
                      type="text" 
                      value="papavegpizza-prod-1092"
                      readOnly
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-100 dark:bg-zinc-800/40 text-zinc-550 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Sender ID</label>
                    <input 
                      type="text" 
                      value="88201948301"
                      readOnly
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-100 dark:bg-zinc-800/40 text-zinc-550 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Firebase Private API Server Key</label>
                    <input 
                      type="password" 
                      value="AAAA-fcm-server-key-private-token-oauth2"
                      readOnly
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-100 dark:bg-zinc-800/40 text-zinc-550 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <button 
                    onClick={() => {
                      toast.info("Connecting to Firebase Cloud Messaging server...");
                      setTimeout(() => toast.success("FCM SDK verified. Registered client target count: 18,290 devices."), 800);
                    }}
                    className="px-3.5 py-1.5 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-extrabold rounded-lg text-black dark:text-zinc-100 transition-colors"
                  >
                    SDK Handshake Test
                  </button>
                  <button 
                    onClick={() => {
                      toast.success("Firebase Credentials saved successfully!");
                    }}
                    className="px-3.5 py-1.5 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white text-xs font-extrabold rounded-lg transition-all shadow-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Push Templates summary table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Trigger Event</th>
                      <th className="p-3">App Notification Title</th>
                      <th className="p-3">Push Message Body</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {templates.filter(t => t.type === 'push').map((t) => (
                      <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="p-3 font-extrabold">{t.event}</td>
                        <td className="p-3 font-black text-black dark:text-zinc-50">{t.title}</td>
                        <td className="p-3 font-medium max-w-xs truncate">{t.body}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsPreviewOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-black dark:text-zinc-100 flex items-center gap-1 font-bold"
                            >
                              <Eye size={10} />
                            </button>
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsEditOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-blue-500 flex items-center gap-1 font-bold"
                            >
                              <Edit size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: WhatsApp Integration */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              
              {/* WhatsApp Config details */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-4 shadow-sm text-black dark:text-zinc-100">
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="text-emerald-500 animate-pulse" size={14} />
                      Meta Cloud WhatsApp Business API Configuration
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Route conversational messages using Meta Cloud APIs.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/25 rounded text-[8.5px] font-black uppercase">
                    Meta API: Inactive (Auth Expired)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Business Account ID</label>
                    <input 
                      type="text" 
                      value={waConfig.businessAccountId}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, businessAccountId: e.target.value }))}
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Phone Number ID</label>
                    <input 
                      type="text" 
                      value={waConfig.phoneNumberId}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Access Token Key</label>
                    <div className="relative">
                      <input 
                        type={showWaToken ? 'text' : 'password'}
                        value={waConfig.accessToken}
                        onChange={(e) => setWaConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                        className="w-full h-8 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowWaToken(!showWaToken)}
                        className="absolute inset-y-0 right-2.5 flex items-center text-zinc-500"
                      >
                        {showWaToken ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-500 tracking-wider">Webhook Verification Token</label>
                    <input 
                      type="text" 
                      value={waConfig.webhookToken}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, webhookToken: e.target.value }))}
                      className="w-full h-8 px-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold">
                    <input 
                      type="checkbox"
                      checked={waConfig.enabled}
                      onChange={(e) => setWaConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                    <span>Route Transactional Updates to WhatsApp</span>
                  </label>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        toast.error("Meta verification check failed: Invalid Authorization Token signature. Please roll Meta keys.");
                      }}
                      className="px-3.5 py-1.5 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-extrabold rounded-lg text-black dark:text-zinc-100 transition-colors"
                    >
                      Verify Token
                    </button>
                    <button 
                      onClick={() => {
                        toast.success("WhatsApp Business Settings updated!");
                      }}
                      className="px-3.5 py-1.5 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white text-xs font-extrabold rounded-lg transition-all shadow-sm"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp templates summary table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Trigger Event</th>
                      <th className="p-3">WhatsApp Text message body</th>
                      <th className="p-3">Variables</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {templates.filter(t => t.type === 'whatsapp').map((t) => (
                      <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="p-3 font-extrabold">{t.event}</td>
                        <td className="p-3 font-medium max-w-xs truncate">{t.body}</td>
                        <td className="p-3 font-mono text-[9px] text-zinc-500">{t.variables.join(', ')}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsPreviewOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-black dark:text-zinc-100 flex items-center gap-1 font-bold"
                            >
                              <Eye size={10} />
                            </button>
                            <button 
                              onClick={() => { setSelectedTemplate(t); setIsEditOpen(true); }}
                              className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] hover:bg-zinc-100 text-blue-500 flex items-center gap-1 font-bold"
                            >
                              <Edit size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: Templates list (All templates central panel) */}
          {activeTab === 'templates' && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm text-black dark:text-zinc-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3 w-8"></th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Trigger Event</th>
                    <th className="p-3">Template Name / Title</th>
                    <th className="p-3">Active Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold">
                  {filteredTemplates.map((t) => {
                    const isExpanded = expandedRow === t._id;
                    return (
                      <React.Fragment key={t._id}>
                        <tr 
                          onClick={() => setExpandedRow(isExpanded ? null : t._id)}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 cursor-pointer"
                        >
                          <td className="p-3 text-center">
                            <ChevronRight size={14} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border inline-block ${
                              t.type === 'email' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                              t.type === 'sms' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                              t.type === 'push' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                              'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold">{t.event}</td>
                          <td className="p-3 font-black text-black dark:text-zinc-50">{t.title}</td>
                          <td className="p-3">
                            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={t.active}
                                onChange={() => handleToggleTemplateActive(t._id)}
                                className="sr-only peer" 
                              />
                              <div className="w-8 h-4.5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => { setSelectedTemplate(t); setIsPreviewOpen(true); }}
                                className="p-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 text-black dark:text-zinc-100"
                                title="Preview"
                              >
                                <Eye size={11} />
                              </button>
                              <button 
                                onClick={() => { setSelectedTemplate(t); setIsEditOpen(true); }}
                                className="p-1 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-100 text-blue-500"
                                title="Edit"
                              >
                                <Edit size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-zinc-50/50 dark:bg-zinc-900/30">
                            <td colSpan={6} className="p-4">
                              <div className="space-y-3 text-xs">
                                <div>
                                  <span className="text-[10px] font-black uppercase text-zinc-500 block mb-0.5">Event Key Mapping</span>
                                  <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{t.event}</span>
                                </div>
                                {t.subject && (
                                  <div>
                                    <span className="text-[10px] font-black uppercase text-zinc-500 block mb-0.5">Email Subject</span>
                                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">{t.subject}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[10px] font-black uppercase text-zinc-500 block mb-0.5">Template Content Payload</span>
                                  <div className="p-3 bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-750 rounded-lg font-mono text-[10.5px] whitespace-pre-wrap leading-relaxed">
                                    {t.body}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase text-zinc-500 block mb-0.5">Variable Interpolation chips</span>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {t.variables.map(v => (
                                      <span key={v} className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-[9px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 6: Notification Logs */}
          {activeTab === 'logs' && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm text-black dark:text-zinc-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3 w-8"></th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Recipient Address</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Event Action</th>
                    <th className="p-3">Delivery Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold">
                  {filteredLogs.map((l) => {
                    const isExpanded = expandedLog === l._id;
                    return (
                      <React.Fragment key={l._id}>
                        <tr 
                          onClick={() => setExpandedLog(isExpanded ? null : l._id)}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 cursor-pointer"
                        >
                          <td className="p-3 text-center">
                            <ChevronRight size={14} className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </td>
                          <td className="p-3 whitespace-nowrap text-[10px]">
                            {new Date(l.sentAt).toLocaleString()}
                          </td>
                          <td className="p-3 font-mono truncate max-w-[150px]">{l.recipient}</td>
                          <td className="p-3 font-extrabold">{l.channel}</td>
                          <td className="p-3 font-medium">{l.event}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                              l.status === 'Success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                              l.status === 'Failed' ? 'bg-red-500/10 text-red-650 border-red-500/20' :
                              'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${
                                l.status === 'Success' ? 'bg-emerald-500' :
                                l.status === 'Failed' ? 'bg-red-500' : 'bg-amber-500'
                              }`}></span>
                              {l.status}
                            </span>
                          </td>
                          <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => {
                                toast.info(`Triggering retry sync for event ${l.event}...`);
                                setTimeout(() => toast.success("Retry request completed successfully!"), 700);
                              }}
                              className="px-2 py-1 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 rounded text-[9px] text-zinc-800 dark:text-zinc-200"
                            >
                              Retry
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-zinc-50/50 dark:bg-zinc-900/30">
                            <td colSpan={7} className="p-4">
                              <div className="space-y-3 text-xs text-black dark:text-zinc-100">
                                <h5 className="text-[10px] font-black uppercase text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                                  Delivery Metadata Diagnostic logs
                                </h5>
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10.5px]">
                                  <div><span className="opacity-75 font-semibold">Recipient Contact:</span> <span className="font-mono font-bold">{l.recipient}</span></div>
                                  <div><span className="opacity-75 font-semibold">Channel Route:</span> <span className="font-bold">{l.channel}</span></div>
                                  <div><span className="opacity-75 font-semibold">Associated event:</span> <span className="font-bold">{l.event}</span></div>
                                  <div><span className="opacity-75 font-semibold">Status Code:</span> <span className="font-mono font-bold">{l.status === 'Success' ? '250 (Success)' : '401 (Unauthorized)'}</span></div>
                                </div>
                                {l.errorMessage && (
                                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-md text-[10px] text-red-650 dark:text-red-400 font-bold">
                                    <span className="block text-[8px] uppercase tracking-wider mb-0.5">Failure Reason</span>
                                    {l.errorMessage}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: Analytics charts */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Daily volume AreaChart */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 space-y-3 shadow-xs">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Sent Notifications Trend (7 Days)</h4>
                    <p className="text-[9.5px] text-zinc-500 font-bold mt-0.5">Daily transactional dispatch volume across channels</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={VOLUME_CHART_DATA}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                        <Area type="monotone" dataKey="Email" stroke="#6366F1" fillOpacity={0.05} fill="#6366F1" />
                        <Area type="monotone" dataKey="SMS" stroke="#3B82F6" fillOpacity={0.05} fill="#3B82F6" />
                        <Area type="monotone" dataKey="Push" stroke="#F59E0B" fillOpacity={0.05} fill="#F59E0B" />
                        <Area type="monotone" dataKey="WhatsApp" stroke="#10B981" fillOpacity={0.05} fill="#10B981" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Success Rate LineChart */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 space-y-3 shadow-xs">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">API Delivery Success Rate Trend</h4>
                    <p className="text-[9.5px] text-zinc-500 font-bold mt-0.5">Percentage rate of completed delivery verification handshakes</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={SUCCESS_CHART_DATA}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} domain={[98, 100]} />
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Share PieChart */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 flex flex-col justify-between shadow-xs md:col-span-1">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider mb-1.5">Channel Usage Share</h4>
                    <p className="text-[9.5px] text-zinc-500 font-bold">Relative workload share across channels</p>
                  </div>
                  <div className="h-32 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CHANNEL_SHARE_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {CHANNEL_SHARE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 justify-center text-[8.5px] font-extrabold">
                    {CHANNEL_SHARE_DATA.map(entry => (
                      <span key={entry.name} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        {entry.name} ({entry.value}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 shadow-xs md:col-span-2 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider">Gateway Route Latency Statistics</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/40 font-bold text-black dark:text-zinc-100 uppercase tracking-wider text-[8px] border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-2">Provider Route</th>
                          <th className="p-2">Latency (Avg)</th>
                          <th className="p-2">Sent (Today)</th>
                          <th className="p-2">Failed (Today)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                        <tr>
                          <td className="p-2 font-extrabold">SendGrid SMTP</td>
                          <td className="p-2">78 ms</td>
                          <td className="p-2">2,400</td>
                          <td className="p-2 text-emerald-650">0</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-extrabold">Twilio Gate SMS</td>
                          <td className="p-2">142 ms</td>
                          <td className="p-2">3,800</td>
                          <td className="p-2 text-emerald-650">0</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-extrabold">Firebase Push API</td>
                          <td className="p-2">42 ms</td>
                          <td className="p-2">7,100</td>
                          <td className="p-2 text-emerald-650">0</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-extrabold">Meta Cloud WA</td>
                          <td className="p-2">190 ms</td>
                          <td className="p-2">1,900</td>
                          <td className="p-2 text-red-500">2</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Side: Control Sidebar (Span 1) */}
        <aside className="lg:col-span-1 space-y-4 text-black dark:text-zinc-100">
          
          {/* Activity timeline logs */}
          <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <MessageSquare className="text-purple-500 shrink-0" size={13} />
              Recent Configuration Audits
            </h4>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-850">
              {timeline.map((event) => (
                <div key={event.id} className="flex gap-2.5 items-start text-[10px] leading-normal font-bold">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    event.type === 'success' ? 'bg-emerald-500' :
                    event.type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                  }`}></span>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-extrabold text-black dark:text-zinc-50">{event.action}</span>
                      <span className="text-[8px] text-zinc-500 shrink-0">{event.time}</span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 font-semibold">{event.desc}</p>
                    <span className="text-[8.5px] text-zinc-500 font-extrabold">By {event.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* Mount Modals */}
      <CreateTemplateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateTemplate}
      />

      <EditTemplateModal 
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedTemplate(null); }}
        template={selectedTemplate}
        onSave={handleUpdateTemplate}
      />

      <ProviderConfigurationModal 
        isOpen={isProviderOpen}
        onClose={() => { setIsProviderOpen(false); setSelectedProvider(null); }}
        provider={selectedProvider}
        onSave={handleSaveProvider}
      />

      <SendTestNotificationModal 
        isOpen={isTestOpen}
        onClose={() => setIsTestOpen(false)}
        templates={templates}
      />

      <PreviewTemplateModal 
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setSelectedTemplate(null); }}
        template={selectedTemplate}
      />

    </div>
  );
}
