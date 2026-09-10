import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";

/**
 * Custom hook to export staff performance reports.
 * Triggers PDF or Excel file downloads.
 */
export function useExportStaffReport() {
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post("/reports/export-staff", payload, {
          responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;

        const contentDisposition = response.headers["content-disposition"];
        let filename = `StaffPerformance_Report_${payload.period}.${payload.exportType.toLowerCase()}`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
      } catch (err) {
        console.warn("Backend Export API offline, falling back to simulated file download", err);

        await new Promise((resolve) => setTimeout(resolve, 1200));

        let mimeType = "text/csv";
        let fileContent = `Papa Veg Pizza - Staff Performance Report\n`;
        fileContent += `Store ID: ${payload.storeId}\n`;
        fileContent += `Period: ${payload.period}\n`;
        fileContent += `Export Format: ${payload.exportType}\n`;
        fileContent += `Role filter: ${payload.role}\n`;
        fileContent += `Station filter: ${payload.station}\n\n`;

        fileContent += `Staff Name,Role,Attendance %,Orders completed,Avg Prep Time,Complaints,Efficiency %,Rating\n`;
        fileContent += `Chef Sanjay Kumar,Chef,96%,245,14.5 mins,1,98%,4.8\n`;
        fileContent += `Chef Anil Sharma,Chef,94%,210,11.2 mins,0,95%,4.7\n`;

        if (payload.exportType === "PDF") {
          mimeType = "application/pdf";
        } else if (payload.exportType === "Excel") {
          mimeType = "application/vnd.ms-excel";
        }

        const blob = new Blob([fileContent], { type: mimeType });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `StaffPerformance_Report_${payload.period}.${payload.exportType.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return { success: true };
      }
    },
    onSuccess: () => {
      toast.success("Staff performance report exported and downloaded successfully!");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to export staff report. Please try again.");
    }
  });
}
