import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  X, 
  Upload, 
  AlertCircle, 
  User, 
  Mail, 
  Phone as PhoneIcon, 
  Briefcase, 
  Activity, 
  Coins, 
  Calendar, 
  ShieldAlert,
  Hash
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffDetails, useUpdateStaff } from "../hooks/useStaff";
import { Skeleton } from "@food/components/ui/skeleton";

const skillsOptions = [
  "Pizza",
  "Baking",
  "Packaging",
  "Dough Preparation",
  "Inventory",
  "Cleaning",
  "Kitchen Management",
];

const staffSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^(?:\+91)?(?:[6-9]\d{9})$/, "Invalid Indian phone number. Enter 10 digits."),
  role: z.enum(["Kitchen Supervisor", "Pizza Maker", "Baker", "Packager"], {
    errorMap: () => ({ message: "Please select a valid role" })
  }),
  experience: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().min(0, "Experience cannot be negative")),
  salaryType: z.enum(["Monthly", "Hourly"]),
  salary: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().min(1, "Salary must be greater than 0")),
  joiningDate: z.string().min(1, "Joining date is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
});

export default function EditStaffModal({ isOpen, onClose, staffId }) {
  const { data: staff, isLoading } = useStaffDetails(staffId);
  const updateStaffMutation = useUpdateStaff();
  
  const [profileImage, setProfileImage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [imageError, setImageError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffSchema),
  });

  // Populate data when loaded
  useEffect(() => {
    if (staff && isOpen) {
      setValue("fullName", staff.fullName);
      setValue("email", staff.email);
      setValue("phone", staff.phone);
      setValue("role", staff.role);
      setValue("experience", staff.experience);
      setValue("salaryType", staff.salaryType);
      setValue("salary", staff.salary);
      setValue("joiningDate", staff.joiningDate);
      setValue("emergencyContact", staff.emergencyContact);
      
      setProfileImage(staff.profileImage || "");
      setSelectedSkills(staff.skills || []);
      setImageError("");
    }
  }, [staff, isOpen, setValue]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError("Image size should be less than 2MB");
        return;
      }
      setImageError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const onSubmit = async (data) => {
    try {
      await updateStaffMutation.mutateAsync({
        id: staffId,
        payload: {
          ...data,
          profileImage,
          skills: selectedSkills,
        },
      });
      onClose();
    } catch (e) {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 overflow-y-auto max-h-[90vh] scrollbar-thin animate-fade-in">
        <DialogHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-3 pr-8">
          <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Edit Kitchen Staff
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
            Modify kitchen staff details, roles, skills, and operations stats.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center space-y-3">
                <Skeleton className="w-32 h-32 rounded-3xl" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-12" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="py-4 space-y-6">
            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Upload Column */}
              <div className="md:col-span-1 flex flex-col items-center justify-start space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 self-start">
                  Profile Image
                </label>
                
                <div className="relative group w-32 h-32 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center shadow-inner">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                      <User size={36} className="stroke-[1.5]" />
                      <span className="text-[10px] font-bold mt-1">NO PHOTO</span>
                    </div>
                  )}
                  
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold">
                    <Upload size={16} className="mb-1" />
                    <span>UPLOAD WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {imageError && (
                  <p className="text-[10px] text-red-650 font-semibold text-center">{imageError}</p>
                )}
                
                {/* Employee Code Read-Only Badge */}
                <div className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                  <Hash size={12} className="text-zinc-400 shrink-0" />
                  <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase select-all">
                    {staff?.employeeCode || "PENDING"}
                  </span>
                </div>
              </div>

              {/* Form Inputs Grid */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <User size={12} className="text-slate-400" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("fullName")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.fullName && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.fullName.message}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.email && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.email.message}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <PhoneIcon size={12} className="text-slate-400" />
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="9876543210"
                    {...register("phone")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.phone && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.phone.message}
                    </span>
                  )}
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Briefcase size={12} className="text-slate-400" />
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("role")}
                    className="w-full h-10 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Pizza Maker">Pizza Maker</option>
                    <option value="Baker">Baker</option>
                    <option value="Packager">Packager</option>
                    <option value="Kitchen Supervisor">Kitchen Supervisor</option>
                  </select>
                  {errors.role && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.role.message}
                    </span>
                  )}
                </div>

                {/* Experience */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Activity size={12} className="text-slate-400" />
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    {...register("experience")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.experience && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.experience.message}
                    </span>
                  )}
                </div>

                {/* Salary Type */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Coins size={12} className="text-slate-400" />
                    Salary Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("salaryType")}
                    className="w-full h-10 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Hourly">Hourly</option>
                  </select>
                </div>

                {/* Salary */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <span className="text-slate-400 font-bold">₹</span>
                    Salary (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("salary")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.salary && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.salary.message}
                    </span>
                  )}
                </div>

                {/* Joining Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" />
                    Joining Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("joiningDate")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.joiningDate && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.joiningDate.message}
                    </span>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <ShieldAlert size={12} className="text-slate-400" />
                    Emergency Contact <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("emergencyContact")}
                    className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.emergencyContact && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.emergencyContact.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Skills Multi Select */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Skills (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {skillsOptions.map((skill) => {
                  const selected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer ${
                        selected
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-850">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateStaffMutation.isPending}
                className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {updateStaffMutation.isPending ? "Saving..." : "Save Staff"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
