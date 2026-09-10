import React, { useState, useEffect, useRef } from "react";
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
  Key, 
  Briefcase, 
  Activity, 
  Coins, 
  Calendar, 
  ShieldAlert
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useCreateStaff } from "../hooks/useStaff";

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
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["Kitchen Supervisor", "Pizza Maker", "Baker", "Packager"], {
    errorMap: () => ({ message: "Please select a valid role" })
  }),
  experience: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().min(0, "Experience cannot be negative")),
  salaryType: z.enum(["Monthly", "Hourly"]),
  salary: z.preprocess((val) => (val === "" ? undefined : Number(val)), z.number().min(1, "Salary must be greater than 0")),
  joiningDate: z.string().min(1, "Joining date is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  
  // New fields
  employeeId: z.string().min(1, "Employee ID is required"),
  status: z.enum(["Active", "Inactive"]),
  shiftType: z.enum(["Morning", "Afternoon", "Evening", "Night"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  address: z.string().min(1, "Residential address is required"),
});

export default function AddStaffModal({ isOpen, onClose }) {
  const createStaffMutation = useCreateStaff();
  const [profileImage, setProfileImage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [weeklyWorkingDays, setWeeklyWorkingDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("store_sidebar_collapsed") === "true";
  });

  useEffect(() => {
    const handleCollapse = (e) => {
      if (e && e.detail !== undefined) {
        setSidebarCollapsed(e.detail);
      } else {
        setSidebarCollapsed(localStorage.getItem("store_sidebar_collapsed") === "true");
      }
    };

    window.addEventListener("sidebarCollapseChanged", handleCollapse);
    window.addEventListener("click", handleCollapse);

    return () => {
      window.removeEventListener("sidebarCollapseChanged", handleCollapse);
      window.removeEventListener("click", handleCollapse);
    };
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      role: "Pizza Maker",
      experience: 0,
      salaryType: "Monthly",
      salary: 15000,
      joiningDate: new Date().toISOString().split("T")[0],
      emergencyContact: "",
      employeeId: `PVK-${Math.floor(100 + Math.random() * 900)}`,
      status: "Active",
      shiftType: "Morning",
      startTime: "08:00 AM",
      endTime: "04:00 PM",
      address: "",
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        role: "Pizza Maker",
        experience: 0,
        salaryType: "Monthly",
        salary: 15000,
        joiningDate: new Date().toISOString().split("T")[0],
        emergencyContact: "",
        employeeId: `PVK-${Math.floor(100 + Math.random() * 900)}`,
        status: "Active",
        shiftType: "Morning",
        startTime: "08:00 AM",
        endTime: "04:00 PM",
        address: "",
      });
      setProfileImage("");
      setSelectedSkills([]);
      setWeeklyWorkingDays(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
      setImageError("");
    }
  }, [isOpen, reset]);

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

  const randomizeWebP = () => {
    const randomId = Math.floor(Math.random() * 70) + 1;
    setProfileImage(`https://i.pravatar.cc/150?img=${randomId}`);
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const toggleDay = (day) => {
    setWeeklyWorkingDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const onSubmit = async (data) => {
    try {
      await createStaffMutation.mutateAsync({
        ...data,
        profileImage,
        skills: selectedSkills,
        weeklyWorkingDays,
      });
      onClose();
    } catch (e) {
      // Handled by react query
    }
  };

  const dialogContentClass = `
    max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 overflow-y-auto max-h-[92vh] scrollbar-thin
    transition-all duration-300 ease-in-out
    ${sidebarCollapsed 
      ? "lg:left-[calc(50%+36px)] lg:-translate-x-1/2" 
      : "lg:left-[calc(50%+140px)] lg:-translate-x-1/2"
    }
  `;

  const dialogOverlayClass = `
    transition-all duration-300 ease-in-out
    ${sidebarCollapsed 
      ? "lg:left-[72px] lg:w-[calc(100vw-72px)]" 
      : "lg:left-[280px] lg:w-[calc(100vw-280px)]"
    }
  `;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent 
        className={dialogContentClass}
        overlayClassName={dialogOverlayClass}
      >
        <DialogHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-3 pr-8 flex flex-row items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
            <User className="text-[#d30f0f] w-4 h-4 stroke-[2.5]" />
          </div>
          <DialogTitle className="text-sm font-black tracking-wider text-slate-900 dark:text-white uppercase">
            ONBOARD NEW KITCHEN STAFF
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="py-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Column 1: Basic Information */}
            <div className="space-y-4">
              <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 mb-4">
                <h3 className="text-[11px] font-black tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
                  SECTION 1: BASIC INFORMATION
                </h3>
              </div>

              {/* Photo Box */}
              <div className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-4 flex items-center gap-4 w-full">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative cursor-pointer group w-20 h-20 rounded-2xl overflow-hidden border border-zinc-250 dark:border-zinc-800 bg-zinc-150 dark:bg-zinc-900 flex items-center justify-center shadow-sm shrink-0"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                      <User size={24} className="stroke-[1.5]" />
                      <span className="text-[8px] font-bold mt-1">NO PHOTO</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold">
                    <Upload size={12} className="mb-0.5" />
                    <span>UPLOAD</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
                    PHOTO FILE
                  </span>
                  <button
                    type="button"
                    onClick={randomizeWebP}
                    className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-xl text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Upload size={11} className="text-zinc-500" />
                    Randomize webP
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>
              {imageError && (
                <p className="text-[10px] text-red-650 font-semibold mt-0.5">{imageError}</p>
              )}

              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                  FULL NAME
                </label>
                <input
                  type="text"
                  placeholder="Enter name (e.g., Rajesh Patel)"
                  {...register("fullName")}
                  className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                />
                {errors.fullName && (
                  <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                    <AlertCircle size={10} /> {errors.fullName.message}
                  </span>
                )}
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  placeholder="name@papaveg.com"
                  {...register("email")}
                  className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                />
                {errors.email && (
                  <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                    <AlertCircle size={10} /> {errors.email.message}
                  </span>
                )}
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                    PHONE
                  </label>
                  <input
                    type="text"
                    placeholder="98260 11111"
                    {...register("phone")}
                    className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.phone && (
                    <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.phone.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.password && (
                    <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.password.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Employee ID & Joining Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                    EMPLOYEE ID
                  </label>
                  <input
                    type="text"
                    placeholder="PVK-790"
                    {...register("employeeId")}
                    className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.employeeId && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.employeeId.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                    JOINING DATE
                  </label>
                  <input
                    type="date"
                    {...register("joiningDate")}
                    className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.joiningDate && (
                    <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.joiningDate.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Role & Experience (Years) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                    ROLE
                  </label>
                  <select
                    {...register("role")}
                    className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="Pizza Maker">Pizza Maker</option>
                    <option value="Baker">Baker</option>
                    <option value="Packager">Packager</option>
                    <option value="Kitchen Supervisor">Kitchen Supervisor</option>
                  </select>
                  {errors.role && (
                    <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.role.message}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                    EXPERIENCE (YEARS)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    {...register("experience")}
                    className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                  />
                  {errors.experience && (
                    <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                      <AlertCircle size={10} /> {errors.experience.message}
                    </span>
                  )}
                </div>
              </div>



              {/* Status */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                  STATUS
                </label>
                <select
                  {...register("status")}
                  className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white focus:outline-none focus:border-primary transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {errors.status && (
                  <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                    <AlertCircle size={10} /> {errors.status.message}
                  </span>
                )}
              </div>

            </div>

            {/* Column 2: Shift Configurations & Personal Details */}
            <div className="space-y-6">
              <div>
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 mb-4">
                  <h3 className="text-[11px] font-black tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
                    SECTION 2: SHIFT CONFIGURATIONS
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase text-[9px]">
                      SHIFT TYPE
                    </label>
                    <select
                      {...register("shiftType")}
                      className="w-full h-11 px-2 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-455 uppercase text-[9px]">
                      START TIME
                    </label>
                    <input
                      type="text"
                      placeholder="08:00 AM"
                      {...register("startTime")}
                      className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase text-[9px]">
                      END TIME
                    </label>
                    <input
                      type="text"
                      placeholder="04:00 PM"
                      {...register("endTime")}
                      className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Weekly Working Days */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                  WEEKLY WORKING DAYS
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                    const isSelected = weeklyWorkingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? "bg-[#d30f0f] border-[#d30f0f] text-white shadow-sm"
                            : "bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="border-b border-zinc-150 dark:border-zinc-800 pb-1 mb-4 pt-2">
                  <h3 className="text-[11px] font-black tracking-wider text-slate-800 dark:text-zinc-200 uppercase">
                    SECTION 3: PERSONAL DETAILS
                  </h3>
                </div>

                {/* Salary Type & Salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                      SALARY TYPE
                    </label>
                    <select
                      {...register("salaryType")}
                      className="w-full h-11 px-3 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white focus:outline-none focus:border-primary transition-all"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Hourly">Hourly</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                      MONTHLY SALARY (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-[13px] text-xs font-bold text-zinc-500">₹</span>
                      <input
                        type="number"
                        placeholder="e.g., 25000"
                        {...register("salary")}
                        className="w-full h-11 pl-8 pr-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                    {errors.salary && (
                      <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                        <AlertCircle size={10} /> {errors.salary.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-455 uppercase">
                  EMERGENCY CONTACT
                </label>
                <input
                  type="text"
                  placeholder="Name (Relation) - Phone"
                  {...register("emergencyContact")}
                  className="w-full h-11 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all"
                />
                {errors.emergencyContact && (
                  <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                    <AlertCircle size={10} /> {errors.emergencyContact.message}
                  </span>
                )}
              </div>

              {/* Residential Address */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
                  RESIDENTIAL ADDRESS
                </label>
                <textarea
                  placeholder="Street, City, Pincode"
                  {...register("address")}
                  className="w-full h-24 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold bg-zinc-50/60 dark:bg-zinc-950 text-slate-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-primary transition-all resize-none"
                />
                {errors.address && (
                  <span className="text-[10px] font-bold text-red-650 flex items-center gap-0.5 mt-0.5">
                    <AlertCircle size={10} /> {errors.address.message}
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* Skills Multi Select */}
          <div className="flex flex-col gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-850">
            <label className="text-[10px] font-black tracking-wider text-zinc-500 dark:text-zinc-450 uppercase">
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
                    className={`px-4 py-2 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                      selected
                        ? "bg-red-50 dark:bg-red-950/20 border-[#d30f0f] text-[#d30f0f]"
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
              className="px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStaffMutation.isPending}
              className="px-6 py-2.5 bg-[#d30f0f] hover:bg-[#b00c0c] text-white font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {createStaffMutation.isPending ? "Registering..." : "Register Kitchen Staff"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
