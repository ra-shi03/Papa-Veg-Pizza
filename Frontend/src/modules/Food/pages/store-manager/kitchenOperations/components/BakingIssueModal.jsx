import React, { useState, useEffect } from "react";
import { Modal, Select, Radio, Checkbox, Input, Upload, Button, message } from "antd";
import { AlertOctagon, UploadCloud, AlertCircle, FileText } from "lucide-react";
import { adminClient } from "@/services/api/axios";

const { TextArea } = Input;

export default function BakingIssueModal({ visible, onClose, item, onSubmit }) {
  const [issueType, setIssueType] = useState("Overcooked");
  const [severity, setSeverity] = useState("Medium");
  const [remarks, setRemarks] = useState("");
  const [notifyManager, setNotifyManager] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [photoUrl, setPhotoUrl] = useState(""); // the uploaded photo's link (the issue keeps only this)
  const [uploading, setUploading] = useState(false);

  // Reset fields when item changes
  useEffect(() => {
    if (item && visible) {
      setIssueType("Overcooked");
      setSeverity("Medium");
      setRemarks("");
      setNotifyManager(false);
      setFileList([]);
      setPhotoUrl("");
    }
  }, [item, visible]);

  if (!item) return null;

  // The photo is uploaded as soon as it is picked; removing it clears the link
  const handlePhoto = async (list) => {
    setFileList(list);
    setPhotoUrl("");
    const picked = list[list.length - 1];
    const file = picked?.originFileObj;
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) { message.error("Choose an image file"); setFileList([]); return; }
    if (file.size > 5 * 1024 * 1024) { message.error("The photo must be under 5 MB"); setFileList([]); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await adminClient.post("/uploads/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res?.data?.data?.url || res?.data?.url || "";
      if (!url) throw new Error("Upload failed");
      setPhotoUrl(url);
      setFileList([{ ...picked, status: "done", url }]);
    } catch (err) {
      message.error(err?.response?.data?.message || err?.response?.data?.error || "Could not upload the photo");
      setFileList([]);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!issueType || !severity) return;
    if (uploading) { message.warning("Wait for the photo to finish uploading"); return; }
    
    // Pass to parent handler
    onSubmit({
      orderItemId: item._id,
      issueType,
      severity,
      remarks,
      image: photoUrl, // the uploaded link, or nothing (never a made-up file name)
      notifyManager,
    });
    
    onClose();
  };

  const typeOptions = [
    { value: "Overcooked", label: "Overcooked" },
    { value: "Undercooked", label: "Undercooked" },
    { value: "Machine Failure", label: "Machine Failure" },
    { value: "Temperature Error", label: "Temperature Error" },
    { value: "Burnt Crust", label: "Burnt Crust" },
    { value: "Cheese Issue", label: "Cheese Issue" },
    { value: "Other", label: "Other" }
  ];

  const severityColors = {
    Low: "text-blue-500",
    Medium: "text-amber-500",
    High: "text-orange-500",
    Critical: "text-rose-500 font-bold animate-pulse"
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <AlertOctagon size={18} className="text-rose-500 animate-bounce" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Report Baking Issue</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Log preparation problems or oven errors to quality dashboard
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={420}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Report Issue
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Pizza Info Panel */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {item.size} • {item.crust} • Qty {item.quantity} (Oven: {item.assigned_oven ? `OVEN-${item.assigned_oven.slice(-2).toUpperCase()}` : "N/A"})
          </p>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Issue Type
            </label>
            <Select
              className="w-full h-9 text-xs"
              value={issueType}
              onChange={(val) => setIssueType(val)}
              popupClassName="dark:bg-zinc-900"
              options={typeOptions}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Severity Level
            </label>
            <Radio.Group 
              value={severity} 
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full grid grid-cols-4 gap-1.5"
            >
              {["Low", "Medium", "High", "Critical"].map((sev) => (
                <Radio.Button 
                  key={sev}
                  value={sev}
                  className="text-center font-bold text-[10px] h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 dark:bg-zinc-950 text-slate-700 dark:text-zinc-300"
                >
                  <span className={severity === sev ? severityColors[sev] : ""}>{sev}</span>
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <FileText size={10} /> Describe Problem
            </label>
            <TextArea
              placeholder="What specifically went wrong? (e.g. cheese burnt due to heating element, uneven bake)..."
              rows={2.5}
              className="text-xs"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Attach Photo Evidence (Optional)
            </label>
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => handlePhoto(fileList)}
              maxCount={1}
              listType="picture"
            >
              <Button 
                icon={<UploadCloud size={14} className="text-slate-450 dark:text-zinc-400" />}
                className="w-full flex items-center justify-center gap-2 h-9 text-xs border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50/50 dark:bg-zinc-950/20 font-bold"
              >
                Upload Photo (.png, .jpg, .webp)
              </Button>
            </Upload>
          </div>

          <div className="pt-2">
            <Checkbox
              checked={notifyManager}
              onChange={(e) => setNotifyManager(e.target.checked)}
              className="text-[11px] font-bold text-rose-500 dark:text-rose-455"
            >
              ⚠️ Instantly Alert Store Manager / Shift Lead
            </Checkbox>
          </div>
        </div>
      </div>
    </Modal>
  );
}
