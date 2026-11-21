import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit2, Loader2, Save } from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';
import { validatePayout } from '../auth/SignupBank';

/**
 * ProfileBankV2 - Restored Old UI for Bank Details.
 */
export const ProfileBankV2 = () => {
  const goBack = useDeliveryBackNavigation();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
    panNumber: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await deliveryAPI.getProfile();
        if (response?.data?.success) {
           const profile = response.data.data.profile;
           setForm({
              accountHolderName: profile?.documents?.bankDetails?.accountHolderName || "",
              accountNumber: profile?.documents?.bankDetails?.accountNumber || "",
              ifscCode: profile?.documents?.bankDetails?.ifscCode || "",
              bankName: profile?.documents?.bankDetails?.bankName || "",
              upiId: profile?.documents?.bankDetails?.upiId || "",
              panNumber: profile?.documents?.pan?.number || ""
           });
        }
      } catch (e) { toast.error("Failed to load details"); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
     // the same checks as signup: these details are needed to go online and to be paid
     const error = validatePayout({ bankAccountHolderName: form.accountHolderName, bankAccountNumber: form.accountNumber, bankIfscCode: form.ifscCode, upiId: form.upiId });
     if (error) return toast.error(error);
     setIsSaving(true);
     try {
        const payload = {
           documents: {
              bankDetails: {
                 accountHolderName: form.accountHolderName,
                 accountNumber: form.accountNumber,
                 ifscCode: form.ifscCode.trim().toUpperCase(),
                 bankName: form.bankName,
                 upiId: form.upiId.trim()
              },
              pan: { number: form.panNumber }
           }
        };
        const response = await deliveryAPI.updateProfile(payload);
        if (response?.data?.success) {
           toast.success("Bank details updated");
           setIsEditing(false);
        }
     } catch (e) { toast.error(e?.response?.data?.error || e?.response?.data?.message || "Update failed"); }
     finally { setIsSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
       <div className="bg-white px-4 py-5 flex items-center gap-4 fixed top-0 w-full z-50 shadow-sm">
          <button onClick={goBack}><ArrowLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-black">Bank Details</h1>
          {!isEditing && (
             <button onClick={() => setIsEditing(true)} className="ml-auto p-2 bg-primary/10 text-primary rounded-xl"><Edit2 className="w-4 h-4" /></button>
          )}
       </div>

       <div className="pt-24 px-4 pb-10 space-y-6">
          <div className="space-y-4">
             {Object.entries({
                "Account Holder": "accountHolderName",
                "Account Number": "accountNumber",
                "IFSC Code": "ifscCode",
                "Bank Name": "bankName",
                "UPI ID": "upiId",
                "PAN Number": "panNumber"
             }).map(([label, key]) => (
                <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">{label}</label>
                   {isEditing ? (
                      <input 
                         type="text" 
                         value={form[key]}
                         onChange={(e) => setForm({...form, [key]: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-950 focus:ring-2 focus:ring-primary/20"
                      />
                   ) : (
                      <p className="text-sm font-bold text-gray-950">{form[key] || "Not provided"}</p>
                   )}
                </div>
             ))}
          </div>

          {isEditing && (
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className="w-full bg-primary text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
             >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
             </button>
          )}
       </div>
    </div>
  );
};
