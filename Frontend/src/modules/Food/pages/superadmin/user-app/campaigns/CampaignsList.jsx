
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, ArrowUp, ArrowDown, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '../../../../../../services/api/axios';
import CampaignFormModal from './CampaignFormModal';

export default function CampaignsList() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const res = await adminClient.get('/dynamic-home/campaigns-admin');
      setCampaigns(res?.data?.data || []);
    } catch (error) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await adminClient.delete(`/dynamic-home/campaigns/${id}`);
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await adminClient.patch(`/dynamic-home/${id}/toggle-active`, {
        modelName: 'Campaign',
        isActive: !currentStatus
      });
      toast.success('Campaign status updated');
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReorder = async (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === campaigns.length - 1)
    ) return;

    const newCampaigns = [...campaigns];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newCampaigns[index];
    newCampaigns[index] = newCampaigns[swapIndex];
    newCampaigns[swapIndex] = temp;
    
    newCampaigns.forEach((c, i) => c.sortOrder = i);
    setCampaigns(newCampaigns);

    try {
      await adminClient.patch('/dynamic-home/reorder', {
        modelName: 'Campaign',
        items: newCampaigns.map(c => ({ id: c._id, sortOrder: c.sortOrder }))
      });
      toast.success('Reordered successfully');
    } catch (error) {
      toast.error('Failed to save order');
      fetchCampaigns(); // Revert
    }
  };

  const getFilteredCampaigns = () => {
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      const now = new Date();
      const isExpired = c.endDate && new Date(c.endDate) < now;
      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = c.isActive && !isExpired;
      if (filterStatus === 'inactive') matchesStatus = !c.isActive && !isExpired;
      if (filterStatus === 'expired') matchesStatus = isExpired;

      return matchesSearch && matchesStatus;
    });
  };

  const filteredCampaigns = getFilteredCampaigns();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Campaigns</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage promotional campaigns & product sections.</p>
        </div>
        <button 
          onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Create Campaign
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search campaigns..."
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
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">Order</th>
                <th className="p-4">Campaign Details</th>
                <th className="p-4">Items</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    No campaigns found.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c, index) => (
                  <tr key={c._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
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
                          disabled={index === filteredCampaigns.length - 1}
                          className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {c.logoImage ? (
                          <img src={c.logoImage} alt="logo" className="w-10 h-10 rounded object-contain bg-zinc-100 dark:bg-zinc-800 border" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-zinc-100 dark:bg-zinc-800 border flex items-center justify-center">
                            <ImageIcon size={16} className="text-zinc-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[200px]">/{c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium">{c.items?.length || 0} products</div>
                    </td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={c.isActive}
                          onChange={() => handleToggleActive(c._id, c.isActive)}
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setEditingCampaign(c); setIsModalOpen(true); }}
                          className="p-2 text-zinc-500 hover:text-primary bg-zinc-100 dark:bg-zinc-800 rounded-md transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c._id)}
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

      {isModalOpen && (
        <CampaignFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={editingCampaign}
          onSave={fetchCampaigns}
        />
      )}
    </div>
  );
}
