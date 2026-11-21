import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Send, IndianRupee, Package, UserRound, Smartphone, HelpCircle, Check, AlertCircle,
} from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';

// What the server accepts (POST /food/delivery/support-tickets): subject 3+, description 10+, these categories / priorities
const SUBJECT_MAX = 100;
const DESCRIPTION_MAX = 1000;

const CATEGORIES = [
  { id: 'payment', label: 'Payment', icon: IndianRupee, topics: ['Payout not received', 'Wrong earning amount', 'Wallet recharge not added', 'Withdrawal pending too long'] },
  { id: 'order', label: 'Order', icon: Package, topics: ['Customer not reachable', 'Wrong or incomplete address', 'Order not ready at store', 'Problem at handover'] },
  { id: 'account', label: 'Account', icon: UserRound, topics: ['Cannot go online', 'Update bank details', 'Account blocked', 'Document verification'] },
  { id: 'technical', label: 'App issue', icon: Smartphone, topics: ['App crashing or slow', 'Location not updating', 'Not getting order alerts', 'Photo upload failing'] },
  { id: 'other', label: 'Other', icon: HelpCircle, topics: [] },
];

const PRIORITIES = [
  { id: 'low', label: 'Low', hint: 'A question, no rush' },
  { id: 'medium', label: 'Medium', hint: 'Needs a fix soon' },
  { id: 'high', label: 'High', hint: 'Stopping my work today' },
  { id: 'urgent', label: 'Urgent', hint: 'On a delivery right now' },
];

const PRIORITY_TONE = {
  low: 'border-gray-200 bg-white text-gray-700',
  medium: 'border-amber-300 bg-amber-50 text-amber-800',
  high: 'border-orange-400 bg-orange-50 text-orange-800',
  urgent: 'border-red-500 bg-red-50 text-red-700',
};

const errorsOf = (form) => ({
  subject: form.subject.trim().length < 3 ? 'Write at least 3 characters' : '',
  description: form.description.trim().length < 10 ? `Add a little more detail (${Math.max(0, 10 - form.description.trim().length)} more characters)` : '',
});

/**
 * Raise a support ticket: pick what it is about, tap a common topic or write one, describe it, set how urgent it is.
 */
export const CreateSupportTicketV2 = () => {
  const goBack = useDeliveryBackNavigation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ subject: false, description: false });
  const [form, setForm] = useState({ subject: '', description: '', category: 'payment', priority: 'medium' });

  const errors = useMemo(() => errorsOf(form), [form]);
  const isValid = !errors.subject && !errors.description;
  const category = CATEGORIES.find((c) => c.id === form.category) || CATEGORIES[0];
  const priority = PRIORITIES.find((p) => p.id === form.priority) || PRIORITIES[1];
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setTouched({ subject: true, description: true });
    if (!isValid) return toast.error('Please fill in the topic and the details');
    setLoading(true);
    try {
      const response = await deliveryAPI.createSupportTicket({
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
      });
      if (response?.data?.success) {
        const ticket = response.data.data || {};
        toast.success(ticket.ticketId ? `Ticket #${ticket.ticketId} raised. We will reply here.` : 'Ticket raised. We will reply here.');
        // straight to the new ticket, so the rider sees its status and the replies
        if (ticket._id) navigate(`/food/delivery/help/tickets/${ticket._id}`, { replace: true });
        else goBack();
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || e?.response?.data?.message || 'Could not raise the ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (bad) =>
    `w-full bg-white border rounded-2xl px-4 py-3.5 text-sm font-semibold text-gray-950 placeholder:text-gray-400 placeholder:font-medium outline-none transition-all focus:ring-4 ${
      bad ? 'border-red-400 focus:ring-red-500/10' : 'border-gray-200 focus:border-[var(--dv-primary,#E53935)] focus:ring-[var(--dv-primary-soft,#fdecea)]'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 fixed top-0 w-full z-50 border-b border-gray-100">
        <button onClick={goBack} className="p-2 -ml-1 hover:bg-gray-100 rounded-full" aria-label="Back">
          <ArrowLeft className="w-6 h-6 text-gray-950" />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-950 leading-tight">Raise a ticket</h1>
          <p className="text-[11px] text-gray-500 font-medium">Tell us what went wrong. Replies appear in Support tickets.</p>
        </div>
      </div>

      <div className="pt-24 px-4 pb-36 space-y-5">
        {/* 1. What is it about */}
        <section className="bg-white rounded-3xl p-4 border border-gray-100 space-y-3">
          <p className="text-xs font-black text-gray-900">What is it about?</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = form.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set('category', c.id)}
                  className={`relative flex flex-col items-center justify-center gap-1.5 rounded-2xl border py-3 text-[11px] font-bold transition-all active:scale-95 ${
                    active ? 'border-[var(--dv-primary,#E53935)] bg-[var(--dv-primary-soft,#fdecea)] text-[var(--dv-primary,#E53935)]' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {active && <Check className="w-3 h-3 absolute top-1.5 right-1.5" />}
                  <Icon className="w-5 h-5" />
                  {c.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Topic */}
        <section className="bg-white rounded-3xl p-4 border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="ticket-subject" className="text-xs font-black text-gray-900">Topic</label>
            <span className={`text-[10px] font-bold ${form.subject.length > SUBJECT_MAX - 10 ? 'text-orange-600' : 'text-gray-400'}`}>{form.subject.length}/{SUBJECT_MAX}</span>
          </div>
          {category.topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {category.topics.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { set('subject', t); setTouched((x) => ({ ...x, subject: true })); }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${
                    form.subject === t ? 'border-[var(--dv-primary,#E53935)] bg-[var(--dv-primary-soft,#fdecea)] text-[var(--dv-primary,#E53935)]' : 'border-gray-200 text-gray-600 bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          <input
            id="ticket-subject"
            type="text"
            maxLength={SUBJECT_MAX}
            placeholder={category.topics.length ? 'Or write your own topic' : 'Main subject of your concern'}
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            onBlur={() => setTouched((x) => ({ ...x, subject: true }))}
            className={fieldClass(touched.subject && errors.subject)}
          />
          {touched.subject && errors.subject && (
            <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertCircle className="w-3.5 h-3.5" />{errors.subject}</p>
          )}
        </section>

        {/* 3. Details */}
        <section className="bg-white rounded-3xl p-4 border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="ticket-description" className="text-xs font-black text-gray-900">Details</label>
            <span className={`text-[10px] font-bold ${form.description.length > DESCRIPTION_MAX - 50 ? 'text-orange-600' : 'text-gray-400'}`}>{form.description.length}/{DESCRIPTION_MAX}</span>
          </div>
          <textarea
            id="ticket-description"
            rows={5}
            maxLength={DESCRIPTION_MAX}
            placeholder={form.category === 'order' ? 'Order ID, what happened and when...' : form.category === 'payment' ? 'Amount, date and what you expected...' : 'Explain your issue here...'}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            onBlur={() => setTouched((x) => ({ ...x, description: true }))}
            className={`${fieldClass(touched.description && errors.description)} resize-none leading-relaxed`}
          />
          {touched.description && errors.description ? (
            <p className="flex items-center gap-1 text-[11px] font-semibold text-red-600"><AlertCircle className="w-3.5 h-3.5" />{errors.description}</p>
          ) : (
            <p className="text-[11px] text-gray-400 font-medium">Include the order ID or amount if it is about an order or a payment.</p>
          )}
        </section>

        {/* 4. Priority */}
        <section className="bg-white rounded-3xl p-4 border border-gray-100 space-y-3">
          <p className="text-xs font-black text-gray-900">How urgent is it?</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Priority">
            {PRIORITIES.map((p) => {
              const active = form.priority === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => set('priority', p.id)}
                  className={`rounded-xl border py-2.5 text-[11px] font-bold transition-all active:scale-95 ${active ? PRIORITY_TONE[p.id] : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 font-medium">{priority.hint}</p>
        </section>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-gray-100 px-4 pt-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 ${
            isValid ? 'bg-black text-white shadow-xl' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {loading ? 'Sending...' : 'Submit ticket'}
        </button>
      </div>
    </div>
  );
};
