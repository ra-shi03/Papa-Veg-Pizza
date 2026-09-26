import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Loader2, Plus, Edit, Upload, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient, { adminClient } from '@/services/api/axios';
import { uploadAPI } from '@/services/api';

export default function CategoriesManagement() {
  const [menus, setMenus] = useState([]);
  const [isMenusModalOpen, setIsMenusModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuForm, setMenuForm] = useState({ id: '', label: '', icon: '', type: 'Category', status: 'Active' });
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewCategory, setViewCategory] = useState(null);
  const [isLoadingView, setIsLoadingView] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const menuImageInputRef = useRef(null);
  const [isUploadingMenuImage, setIsUploadingMenuImage] = useState(false);

  useEffect(() => {
    fetchCategoryProducts();
  }, []);

  const fetchCategoryProducts = async () => {
    setIsLoading(true);
    try {
      const response = await adminClient.get('/food/admin/category-products');
      if (response?.data?.data) {
        // Map _id to id for frontend compatibility
        const mapped = response.data.data.map(item => ({ ...item, id: item._id || item.id }));
        setMenus(mapped);
      }
    } catch (err) {
      console.error('Failed to load category products:', err);
      toast.error('Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }
    setIsUploadingMenuImage(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setMenuForm(prev => ({ ...prev, icon: url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingMenuImage(false);
      if (menuImageInputRef.current) menuImageInputRef.current.value = '';
    }
  };

  const handleOpenMenuModal = (menu = null) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm(menu);
    } else {
      setEditingMenu(null);
      setMenuForm({ id: '', label: '', icon: '', type: 'Category', status: 'Active' });
    }
    setIsMenusModalOpen(true);
  };

  const handleViewMenu = async (id) => {
    setIsViewModalOpen(true);
    setIsLoadingView(true);
    try {
      const res = await adminClient.get(`/food/admin/category-products/${id}`);
      if (res?.data?.data) {
        const item = res.data.data;
        setViewCategory({ ...item, id: item._id || item.id });
      }
    } catch (err) {
      toast.error('Failed to load category details');
    } finally {
      setIsLoadingView(false);
    }
  };

  const handleSaveMenu = async () => {
    if (!menuForm.label) {
      toast.error('Please provide a label');
      return;
    }
    
    setIsSaving(true);
    try {
      let res;
      if (editingMenu) {
        res = await adminClient.patch(`/food/admin/category-products/${editingMenu.id}`, menuForm);
      } else {
        res = await adminClient.post('/food/admin/category-products', menuForm);
      }
      
      if (res?.data?.success) {
        toast.success(editingMenu ? 'Category updated!' : 'Category added!');
        setIsMenusModalOpen(false);
        fetchCategoryProducts();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMenu = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await adminClient.delete(`/food/admin/category-products/${id}`);
      toast.success('Category deleted!');
      fetchCategoryProducts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Categories Directory
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage the dynamic menus (categories) shown on the user app home page.
          </p>
        </div>
        <button
          onClick={() => handleOpenMenuModal()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary)]/90 transition-colors text-sm shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> ADD CATEGORY
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
            <p className="text-zinc-500 mt-2">Loading categories...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">No categories added yet.</p>
            <button onClick={() => handleOpenMenuModal()} className="mt-4 text-[var(--primary)] hover:underline text-sm font-semibold">
              Add your first category
            </button>
          </div>
        ) : (
          menus.map((menu) => (
            <div key={menu.id} className="relative group border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm flex flex-col p-5 hover:shadow-md transition-all">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full w-20 h-20 mb-4 overflow-hidden shrink-0 shadow-inner">
                  {menu.icon && (menu.icon.startsWith('http') || menu.icon.startsWith('data:')) ? (
                    <img src={menu.icon} alt={menu.label} className="w-full h-full object-cover p-2" />
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-[var(--primary)]">{menu.icon}</span>
                  )}
                </div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{menu.label}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate w-full px-2" title={menu.icon}>{menu.icon}</p>
              </div>
              
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                <button onClick={() => handleViewMenu(menu.id)} className="p-2.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 shadow-sm transition-transform hover:scale-110">
                  <Eye className="w-5 h-5" />
                </button>
                <button onClick={() => handleOpenMenuModal(menu)} className="p-2.5 bg-white text-zinc-900 rounded-full hover:bg-zinc-200 shadow-sm transition-transform hover:scale-110">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteMenu(menu.id)} className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm transition-transform hover:scale-110">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Menus Modal */}
      {isMenusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-5">
              {editingMenu ? 'Edit Category' : 'Add Category'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Label</label>
                <input
                  type="text"
                  value={menuForm.label}
                  onChange={e => setMenuForm({ ...menuForm, label: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                  placeholder="e.g. Pizza"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Image / Icon URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={menuForm.icon}
                    onChange={e => setMenuForm({ ...menuForm, icon: e.target.value })}
                    className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                    placeholder="https://... or Material Icon Name"
                  />
                  <input
                    type="file"
                    ref={menuImageInputRef}
                    onChange={handleMenuImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => menuImageInputRef.current?.click()}
                    disabled={isUploadingMenuImage}
                    className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-semibold flex items-center gap-2 transition-colors shrink-0"
                  >
                    {isUploadingMenuImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={menuForm.status || 'Active'}
                  onChange={e => setMenuForm({ ...menuForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 dark:bg-zinc-800 dark:border-zinc-700 transition-shadow"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setIsMenusModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMenu}
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-lg flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Category Details
              </h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {isLoadingView ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
                <p className="text-zinc-500 mt-2">Loading details...</p>
              </div>
            ) : viewCategory ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full w-24 h-24 mb-4 overflow-hidden shrink-0 shadow-inner">
                    {viewCategory.icon && (viewCategory.icon.startsWith('http') || viewCategory.icon.startsWith('data:')) ? (
                      <img src={viewCategory.icon} alt={viewCategory.label || viewCategory.name} className="w-full h-full object-cover p-2" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-[var(--primary)]">{viewCategory.icon}</span>
                    )}
                  </div>
                  <h4 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">{viewCategory.label || viewCategory.name}</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 break-all px-4 text-center">{viewCategory.icon}</p>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">ID</span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.id}</span>
                  </div>
                  {viewCategory.description && (
                    <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Description</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.description}</span>
                    </div>
                  )}
                  {viewCategory.type && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Type</span>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{viewCategory.type}</span>
                    </div>
                  )}
                  {viewCategory.status && (
                    <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-700 pb-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
                      <span className={`text-sm font-bold ${viewCategory.status === 'Active' ? 'text-green-500' : 'text-red-500'}`}>{viewCategory.status}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-500">
                Could not load details.
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
