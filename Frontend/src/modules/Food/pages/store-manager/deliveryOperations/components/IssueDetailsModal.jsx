import React, { useState } from "react";
import { Modal, message } from "antd";
import { Loader2, ShieldAlert, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

import IssueOrderCard from "./IssueOrderCard";
import IssueRiderCard from "./IssueRiderCard";
import IssueInfoCard from "./IssueInfoCard";
import TimelineCard from "./TimelineCard";
import ResolveIssueModal from "./ResolveIssueModal";

import useIssueDetails from "../hooks/useIssueDetails";
import useResolveIssue from "../hooks/useResolveIssue";

export default function IssueDetailsModal({ visible, onClose, issueId }) {
  const { data: details, isLoading: isLoadingDetails, refetch: refetchDetails } = useIssueDetails(issueId);
  const resolveMutation = useResolveIssue();

  const [showResolveModal, setShowResolveModal] = useState(false);

  const handleEscalate = () => {
    if (!issueId) return;
    resolveMutation.mutate(
      { issueId, data: { status: "escalated", severity: "critical" } },
      {
        onSuccess: () => {
          message.warning("Ticket status changed to ESCALATED.");
          refetchDetails();
        },
        onError: () => {
          message.error("Failed to escalate ticket.");
        }
      }
    );
  };

  const handleCloseTicket = () => {
    if (!issueId) return;
    resolveMutation.mutate(
      { issueId, data: { status: "closed" } },
      {
        onSuccess: () => {
          message.success("Ticket closed successfully.");
          refetchDetails();
        },
        onError: () => {
          message.error("Failed to close ticket.");
        }
      }
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 select-none">
          <ShieldAlert size={16} className="text-orange-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Exception Operations Hub</span>
              {details?.issue?._id && (
                <span className="text-[10px] text-slate-400 font-bold border border-slate-200 dark:border-zinc-800 px-1.5 py-0.5 rounded-md">
                  {details.issue._id}
                </span>
              )}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Detailed exception trace, tracking telemetry, and resolution panel.
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1100}
      centered
      footer={null}
      destroyOnClose={true}
    >
      <div className="py-3">
        {isLoadingDetails ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-bold text-slate-400 dark:text-zinc-550">
              Retrieving live exception details...
            </span>
          </div>
        ) : !details || !details.issue ? (
          <div className="text-center py-12 text-slate-400 font-bold text-xs">
            Exception ticket details not found.
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* 3-Column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              
              {/* Column 1: Order Details */}
              <div className="w-full">
                <IssueOrderCard
                  order={details.tracking?.order}
                  customer={details.tracking?.customer}
                />
              </div>

              {/* Column 2: Rider details */}
              <div className="w-full">
                <IssueRiderCard rider={details.tracking?.rider} />
              </div>

              {/* Column 3: Issue info */}
              <div className="w-full">
                <IssueInfoCard issue={details.issue} />
              </div>

            </div>

            {/* Timeline log and bottom actions */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 items-start pt-2 border-t border-slate-100 dark:border-zinc-800">
              
              {/* Left timeline (40%) */}
              <div className="lg:col-span-4 w-full">
                <TimelineCard timeline={details.timeline} />
              </div>

              {/* Right Action buttons (60%) */}
              <div className="lg:col-span-6 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-855 rounded-2xl p-4 flex flex-col justify-between space-y-4 h-full min-h-[120px]">
                <div className="text-left select-none">
                  <h4 className="text-xs font-black uppercase text-slate-400 dark:text-zinc-555 tracking-wider">Supervisor Action Center</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-bold">
                    Select a resolution track below to update this issue. Resolving will allow you to disburse refunds or reassign backup riders.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center justify-end select-none">
                  {details.issue.status !== "resolved" && details.issue.status !== "closed" && (
                    <>
                      <button
                        onClick={() => setShowResolveModal(true)}
                        style={{ backgroundColor: "var(--primary)" }}
                        className="px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                      >
                        <CheckCircle2 size={12} />
                        <span>Resolve Ticket</span>
                      </button>
                      
                      <button
                        onClick={handleEscalate}
                        disabled={details.issue.status === "escalated"}
                        className={`px-4 py-2 border font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                          details.issue.status === "escalated"
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                            : "border-orange-255 dark:border-orange-950 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/15"
                        }`}
                      >
                        <ArrowRight size={12} className={details.issue.status === "escalated" ? "" : "animate-pulse"} />
                        <span>Escalate Ticket</span>
                      </button>
                    </>
                  )}

                  {details.issue.status !== "closed" && (
                    <button
                      onClick={handleCloseTicket}
                      className="px-4 py-2 border border-slate-250 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle size={12} />
                      <span>Close Ticket</span>
                    </button>
                  )}
                  
                  {(details.issue.status === "resolved" || details.issue.status === "closed") && (
                    <div className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 px-4 py-2 rounded-xl">
                      TICKET ARCHIVED: NO PENDING ACTIONS
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </div>

      {/* Resolve Modal Overlay */}
      {details?.issue && (
        <ResolveIssueModal
          visible={showResolveModal}
          onClose={() => setShowResolveModal(false)}
          issueId={details.issue._id}
          onResolveSuccess={() => {
            refetchDetails();
          }}
        />
      )}
    </Modal>
  );
}
