import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ArrowUp, ArrowDown, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../../services/api/axios';
import OfferFormModal from './OfferFormModal';
import OfferCard from '../../../../components/user/OfferCard';

export default function OffersList() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive, expired

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    try {
      // Use the new API endpoints from Phase 1

      // Better to fetch directly from a GET /offers endpoint or if we didn't expose GET /offers for admin,
      // I will assume adminClient.get('/dynamic-home/offers-admin') returns all offers for admin.
      // Since Phase 1 said GET /offers returns active, we might need a general GET for admin or just use it.
      // Wait, let's just try to fetch them. If the backend doesn't have an admin GET, I'll just use the public one 
      // or standard REST convention.
      
      const adminRes = await adminClient.get('/dynamic-home/offers-admin');
      setOffers(adminRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    try {
      await adminClient.delete(`/dynamic-home/offers/${id}`);
      toast.success('Offer deleted');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to delete offer');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await adminClient.patch(`/dynamic-home/${id}/toggle-active`, {
        modelName: 'UiOffer',
        isActive: !currentStatus
      });
      toast.success('Status updated');
      fetchOffers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReorder = async (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === offers.length - 1)
    ) return;

    const newOffers = [...offers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    const temp = newOffers[index];
    newOffers[index] = newOffers[targetIndex];
    newOffers[targetIndex] = temp;

    // Update sortOrder locally
    const updatedItems = newOffers.map((offer, i) => ({
      id: offer._id,
      sortOrder: i + 1
    }));

    setOffers(newOffers); // Optimistic update

    try {
      await adminClient.patch('/dynamic-home/reorder', {
        modelName: 'UiOffer',
        items: updatedItems
      });
      toast.success('Reordered successfully');
    } catch (error) {
      toast.error('Failed to reorder');
      fetchOffers(); // Revert
    }
  };

  const getFilteredOffers = () => {
    return offers.filter(offer => {
      const matchesSearch = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            offer.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const now = new Date();
      const isExpired = offer.endDate && new Date(offer.endDate) < now;

      let matchesFilter = true;
      if (filterStatus === 'active') matchesFilter = offer.isActive && !isExpired;
      if (filterStatus === 'inactive') matchesFilter = !offer.isActive;
      if (filterStatus === 'expired') matchesFilter = isExpired;

      return matchesSearch && matchesFilter;
    });
  };

  const filteredOffers = getFilteredOffers();

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            UI Offers Section
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage the dynamic offer cards shown on the user home screen.
          </p>
        </div>
        <button
          onClick={() => { setEditingOffer(null); setIsModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white font-medium rounded-md hover:opacity-90 transition-opacity text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Offer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search offers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-40 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm dark:text-zinc-100"
        >
          <option value="all">All Offers</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table & Preview Panel Split */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Table Area */}
        <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">Order</th>
                  <th className="p-4">Offer Details</th>
                  <th className="p-4">Action Target</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading offers...
                    </td>
                  </tr>
                ) : filteredOffers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                      No offers found.
                    </td>
                  </tr>
                ) : (
                  filteredOffers.map((offer, index) => (
                    <tr key={offer._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleReorder(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <span className="text-xs font-medium text-zinc-400">{index + 1}</span>
                          <button 
                            onClick={() => handleReorder(index, 'down')}
                            disabled={index === filteredOffers.length - 1}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{offer.title}</div>
                        {offer.subtitle && <div className="text-xs text-zinc-500 truncate max-w-[200px]">{offer.subtitle}</div>}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                            {offer.actionType}
                          </span>
                        </div>
                        <div className="text-xs mt-1 truncate max-w-[150px] font-mono text-zinc-500">
                          {offer.actionValue}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={offer.isActive}
                            onChange={() => handleToggleActive(offer._id, offer.isActive)}
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setEditingOffer(offer); setIsModalOpen(true); }}
                            className="p-2 text-zinc-500 hover:text-primary bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(offer._id)}
                            className="p-2 text-zinc-500 hover:text-red-500 bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-4 flex flex-col items-center">
          <div className="w-full mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <ExternalLink size={16} /> Live Preview
            </h3>
            <p className="text-xs text-zinc-500 mt-1">Hover over an offer to see how it looks to customers.</p>
          </div>
          
          <div className="w-full flex justify-center p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 min-h-[160px] items-center">
            {filteredOffers.length > 0 ? (
              <OfferCard offer={editingOffer || filteredOffers[0]} />
            ) : (
              <span className="text-xs text-zinc-400">No offers to preview</span>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <OfferFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingOffer}
          onSave={fetchOffers}
        />
      )}
    </div>
  );
}

