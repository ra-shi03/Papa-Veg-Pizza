import React, { useState, useEffect } from 'react';
import { X, Save, Upload, Loader2, Link2, Tag, ShoppingBag, Grid, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../../services/api/axios';

export default function OfferFormModal({ isOpen, onClose, initialData, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    iconImage: '',
    
    buttonText: 'View',
    actionType: 'open_product',
    actionValue: '',
    showDetailsModal: false,
    offerDetails: [],
    minOrderValue: 0,
    maxDiscount: 0,
    couponCode: '',
    startDate: '',
    endDate: '',
    isActive: true,
    sortOrder: 0
  });

  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          showDetailsModal: initialData.showDetailsModal || false,
          offerDetails: initialData.offerDetails || [],
          startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().substring(0, 16) : '',
          endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().substring(0, 16) : ''
        });
      } else {
        setFormData({
          title: '', subtitle: '', iconImage: '', 
          buttonText: 'View', actionType: 'open_product', actionValue: '', showDetailsModal: false, offerDetails: [],
          minOrderValue: 0, maxDiscount: 0, couponCode: '', startDate: '', endDate: '',
          isActive: true, sortOrder: 0
        });
      }
      fetchDropdownData();
    }
  }, [isOpen, initialData]);

  const fetchDropdownData = async () => {
    try {
      // Best effort fetching - ignore if endpoints are slightly different
      adminClient.get('/food/admin/products').then(res => {
        if (res.data?.data) setProducts(res.data.data.products || res.data.data);
      }).catch(() => {});
      adminClient.get('/food/admin/categories').then(res => {
        if (res.data?.data) setCategories(res.data.data.categories || res.data.data);
      }).catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Automatically convert '$' or 'Rs' to the Indian Rupee symbol '₹'
    let processedValue = value;
    if (type === 'text') {
      processedValue = processedValue
        .replace(/\$/g, '₹')
        .replace(/\b[rR][sS]\b\.?\s?/g, '₹')
        .replace(/\b[rR]upees?\b\s?/gi, '₹');
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const handleActionTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      actionType: e.target.value,
      actionValue: '' // reset value when type changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required.');
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
      };

      if (initialData?._id) {
        await adminClient.put(`/dynamic-home/offers/${initialData._id}`, payload);
        toast.success('Offer updated successfully');
      } else {
        await adminClient.post('/dynamic-home/offers', payload);
        toast.success('Offer created successfully');
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {initialData ? 'Edit Offer' : 'Create New Offer'}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="offer-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Offer Title *</label>
                <input 
                  type="text" name="title" required
                  value={formData.title} onChange={handleChange}
                  placeholder="e.g. Get up to ₹80 Off"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Subtitle</label>
                <input 
                  type="text" name="subtitle" 
                  value={formData.subtitle} onChange={handleChange}
                  placeholder="e.g. On orders worth ₹199 or more"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Styling */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Button Text</label>
                <input 
                  type="text" name="buttonText" 
                  value={formData.buttonText} onChange={handleChange}
                  placeholder="View"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sort Order</label>
                <input 
                  type="number" name="sortOrder" 
                  value={formData.sortOrder} onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Action */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Click Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Action Type</label>
                  <select 
                    name="actionType" value={formData.actionType} onChange={handleActionTypeChange}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                  >
                    <option value="apply_coupon">Apply Coupon</option>
                    <option value="open_product">Open Product Details</option>
                    <option value="open_category">Open Category</option>
                    <option value="open_url">Open External URL</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {formData.actionType === 'apply_coupon' && 'Coupon Code'}
                    {formData.actionType === 'open_product' && 'Select Product'}
                    {formData.actionType === 'open_category' && 'Select Category'}
                    {formData.actionType === 'open_url' && 'Web URL'}
                  </label>
                  
                  {formData.actionType === 'apply_coupon' && (
                    <input 
                      type="text" name="actionValue" 
                      value={formData.actionValue} onChange={handleChange}
                      placeholder="e.g. TRYNEW50"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                    />
                  )}
                  {formData.actionType === 'open_url' && (
                    <input 
                      type="url" name="actionValue" 
                      value={formData.actionValue} onChange={handleChange}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                    />
                  )}
                  {formData.actionType === 'open_product' && (
                    <select 
                      name="actionValue" 
                      value={formData.actionValue} onChange={handleChange}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                    >
                      <option value="" disabled>Select a product...</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  )}
                  {formData.actionType === 'open_category' && (
                    <select 
                      name="actionValue" 
                      value={formData.actionValue} onChange={handleChange}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                    >
                      <option value="" disabled>Select a category...</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.label || c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Details Modal Toggle */}
            <div className="flex items-center space-x-2 pt-2 pb-2">
              <input
                type="checkbox"
                id="showDetailsModal"
                name="showDetailsModal"
                checked={formData.showDetailsModal}
                onChange={handleChange}
                className="w-4 h-4 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
              />
              <label htmlFor="showDetailsModal" className="text-sm font-medium text-zinc-900 dark:text-zinc-300">
                Show Coupon/Offer Details Modal before executing action
              </label>
            </div>

            {/* Coupon/Offer Details Section */}
            {formData.showDetailsModal && (
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Offer Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Coupon Code</label>
                    <input 
                      type="text" name="couponCode"
                      value={formData.couponCode} onChange={handleChange}
                      placeholder="e.g. SAVE50"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100 uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Min Order Value (₹)</label>
                    <input 
                      type="number" name="minOrderValue" min="0"
                      value={formData.minOrderValue} onChange={handleChange}
                      placeholder="e.g. 199"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Max Discount (₹)</label>
                    <input 
                      type="number" name="maxDiscount" min="0"
                      value={formData.maxDiscount} onChange={handleChange}
                      placeholder="e.g. 80"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Terms & Conditions (One per line)</label>
                  <textarea 
                    name="offerDetails" 
                    value={formData.offerDetails?.join('\n') || ''} 
                    onChange={(e) => setFormData(prev => ({ ...prev, offerDetails: e.target.value.split('\n') }))}
                    placeholder="Enter terms and conditions here. Each line will be a bullet point."
                    rows="4"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Start Date (Optional)</label>
                <input 
                  type="datetime-local" name="startDate" 
                  value={formData.startDate} onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">End Date (Optional)</label>
                <input 
                  type="datetime-local" name="endDate" 
                  value={formData.endDate} onChange={handleChange}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-4 h-4 text-primary bg-zinc-100 border-zinc-300 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-zinc-900 dark:text-zinc-300">
                Active (Show in app)
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="offer-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Saving...' : 'Save Offer'}
          </button>
        </div>

      </div>
    </div>
  );
}

