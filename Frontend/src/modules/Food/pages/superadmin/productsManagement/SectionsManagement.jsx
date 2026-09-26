import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, Plus, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '@/services/api/axios';

export default function SectionsManagement() {
  const [sections, setSections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', categoryId: '', status: 'Active', sortOrder: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchSections();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await adminClient.get('/food/admin/category-products');
      if (response?.data?.data) {
        setCategories(response.data.data.filter(c => c.type === 'Category'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await adminClient.get('/food/admin/sections');
      if (response?.data?.data) {
        setSections(response.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch sections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (section = null) => {
    if (section) {
      setEditingSection(section);
      setFormData({ 
        id: section._id, 
        name: section.name, 
        categoryId: section.categoryId?._id || section.categoryId, 
        status: section.status, 
        sortOrder: section.sortOrder 
      });
    } else {
      setEditingSection(null);
      setFormData({ id: '', name: '', categoryId: '', status: 'Active', sortOrder: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.categoryId) {
      toast.error('Please provide a name and select a category');
      return;
    }

    try {
      if (editingSection) {
        await adminClient.patch(`/food/admin/sections/${formData.id}`, formData);
        toast.success('Section updated successfully');
      } else {
        await adminClient.post('/food/admin/sections', formData);
        toast.success('Section added successfully');
      }
      setIsModalOpen(false);
      fetchSections();
    } catch (err) {
      toast.error('Failed to save section');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      await adminClient.delete(`/food/admin/sections/${id}`);
      toast.success('Section deleted successfully');
      fetchSections();
    } catch (err) {
      toast.error('Failed to delete section');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Sections Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage product sections/collections (e.g., Veg Supreme) inside categories.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> ADD SECTION
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
            <p className="text-zinc-500 mt-2">Loading sections...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            No sections found. Add one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-semibold">Section Name</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Sort Order</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sections.map(section => (
                  <tr key={section._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{section.name}</td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{section.categoryId?.name || section.categoryId?.label || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${section.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {section.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{section.sortOrder}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(section)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(section._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingSection ? 'Edit Section' : 'Add Section'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <option value="">Select a category</option>
                  {categories.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Section Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                  placeholder="e.g. Veg Supreme"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Sort Order</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={e => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--primary)]/90 transition shadow-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
