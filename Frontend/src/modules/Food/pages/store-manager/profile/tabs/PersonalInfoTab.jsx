import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Calendar, MapPin, Heart, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { profileApi } from "@food/api";

export default function PersonalInfoTab({ user = {}, onSaveSuccess = () => {}, isEditingDirect = false, clearDirectEdit = () => {} }) {
  const [isEditing, setIsEditing] = useState(isEditingDirect);
  const [loading, setLoading] = useState(false);
  
  // Controlled fields
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelation: "",
  });

  const [errors, setErrors] = useState({});

  // Sync with user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        address: user.address || "",
        emergencyName: user.emergencyContact?.name || "",
        emergencyPhone: user.emergencyContact?.phone || "",
        emergencyRelation: user.emergencyContact?.relation || "",
      });
    }
  }, [user]);

  // Handle direct edit trigger from header
  useEffect(() => {
    if (isEditingDirect) {
      setIsEditing(true);
      clearDirectEdit();
    }
  }, [isEditingDirect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when editing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email address is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.gender) newErrors.gender = "Gender selection is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.address.trim()) newErrors.address = "Address details are required";
    
    // Email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone format: +91 XXXXX XXXXX or 10-digit number
    const phoneRegex = /^(\+91[\s-]?)?[0-9]{10}$/;
    if (formData.phone.trim() && !phoneRegex.test(formData.phone.trim().replace(/\s+/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    // Emergency details validations if one is filled
    if (formData.emergencyName.trim() || formData.emergencyPhone.trim() || formData.emergencyRelation.trim()) {
      if (!formData.emergencyName.trim()) newErrors.emergencyName = "Emergency contact name is required";
      if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = "Emergency contact phone is required";
      if (!formData.emergencyRelation.trim()) newErrors.emergencyRelation = "Relation is required";
      if (formData.emergencyPhone.trim() && !phoneRegex.test(formData.emergencyPhone.trim().replace(/\s+/g, ""))) {
        newErrors.emergencyPhone = "Enter a valid 10-digit emergency number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please resolve validation errors before saving.");
      return;
    }

    try {
      setLoading(true);
      const updateData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: formData.emergencyRelation,
        },
      };

      const response = await profileApi.updatePersonalInfo(updateData);
      if (response.success) {
        toast.success("Personal information updated successfully.");
        setIsEditing(false);
        onSaveSuccess(response.data);
      } else {
        toast.error(response.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.error("An error occurred while updating profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        address: user.address || "",
        emergencyName: user.emergencyContact?.name || "",
        emergencyPhone: user.emergencyContact?.phone || "",
        emergencyRelation: user.emergencyContact?.relation || "",
      });
    }
  };

  const inputClass = (fieldName) => `
    w-full text-xs font-semibold px-3 py-2 border rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all
    ${errors[fieldName] ? "border-red-500 focus:ring-red-500 bg-red-50/20" : "border-zinc-200 dark:border-zinc-800"}
  `;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Personal Information
          </h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5"
          >
            Edit Information
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Full Name</span>
              <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Siddharth Verma"
                  className={inputClass("fullName")}
                />
                {errors.fullName && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.fullName}</p>}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{formData.fullName || "Not Specified"}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Email Address</span>
              <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. siddharth.verma@papavegpizza.in"
                  className={inputClass("email")}
                />
                {errors.email && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.email}</p>}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Mail size={12} className="text-slate-400" />
                <span>{formData.email || "Not Specified"}</span>
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Phone Number</span>
              <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 98765 43210"
                  className={inputClass("phone")}
                />
                {errors.phone && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.phone}</p>}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Phone size={12} className="text-slate-400" />
                <span>{formData.phone || "Not Specified"}</span>
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Gender</span>
              <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass("gender")}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.gender}</p>}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{formData.gender || "Not Specified"}</p>
            )}
          </div>

          {/* Date Of Birth */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Date Of Birth</span>
              <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={inputClass("dateOfBirth")}
                />
                {errors.dateOfBirth && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.dateOfBirth}</p>}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Calendar size={12} className="text-slate-400" />
                <span>{formData.dateOfBirth || "Not Specified"}</span>
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span>Address Details</span>
              <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <div>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street details, Colony, City, State and Pincode"
                  className={inputClass("address")}
                />
                {errors.address && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.address}</p>}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-start gap-1.5 leading-relaxed">
                <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                <span>{formData.address || "Not Specified"}</span>
              </p>
            )}
          </div>
        </div>

        {/* EMERGENCY CONTACT SECTION */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 mb-3 text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wide">
            <Heart size={12} className="text-rose-500" />
            <span>Emergency Contact Information</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Contact Name */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Contact Name
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleChange}
                    placeholder="e.g. Anjali Verma"
                    className={inputClass("emergencyName")}
                  />
                  {errors.emergencyName && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.emergencyName}</p>}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{formData.emergencyName || "Not Specified"}</p>
              )}
            </div>

            {/* Relation */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Relationship
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="emergencyRelation"
                    value={formData.emergencyRelation}
                    onChange={handleChange}
                    placeholder="e.g. Spouse / Father"
                    className={inputClass("emergencyRelation")}
                  />
                  {errors.emergencyRelation && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.emergencyRelation}</p>}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">{formData.emergencyRelation || "Not Specified"}</p>
              )}
            </div>

            {/* Contact Phone */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                Emergency Phone Number
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="e.g. +91 91234 56789"
                    className={inputClass("emergencyPhone")}
                  />
                  {errors.emergencyPhone && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.emergencyPhone}</p>}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Phone size={11} className="text-slate-400" />
                  <span>{formData.emergencyPhone || "Not Specified"}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Buttons (Save/Cancel) in edit mode */}
        {isEditing && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-50 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
