import React from "react";
import CreateCampaignModal from "./CreateCampaignModal";
import EditCampaignModal from "./EditCampaignModal";
import PauseCampaignModal from "./PauseCampaignModal";
import ResumeCampaignModal from "./ResumeCampaignModal";
import DeleteCampaignModal from "./DeleteCampaignModal";
import CampaignDetailsDrawer from "./CampaignDetailsDrawer";

export default function CampaignModals({
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showPauseModal,
  setShowPauseModal,
  showResumeModal,
  setShowResumeModal,
  showDeleteModal,
  setShowDeleteModal,
  showDetailsDrawer,
  setShowDetailsDrawer,
  selectedCampaign,
  setSelectedCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  getCampaignPerformanceDetails,
  stores
}) {
  return (
    <>
      {/* Create Campaign Modal */}
      <CreateCampaignModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        stores={stores}
        onSubmit={async (payload) => {
          try {
            await createCampaign(payload);
            return true;
          } catch (_) {
            return false;
          }
        }}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        stores={stores}
        onSubmit={async (id, payload) => {
          try {
            await updateCampaign(id, payload);
            return true;
          } catch (_) {
            return false;
          }
        }}
      />

      {/* Pause Campaign Warning Modal */}
      <PauseCampaignModal
        visible={showPauseModal}
        onCancel={() => {
          setShowPauseModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onConfirm={async () => {
          if (selectedCampaign) {
            await updateCampaignStatus(selectedCampaign._id, "paused");
            setShowPauseModal(false);
            setSelectedCampaign(null);
          }
        }}
      />

      {/* Resume Campaign Modal */}
      <ResumeCampaignModal
        visible={showResumeModal}
        onCancel={() => {
          setShowResumeModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        onConfirm={async () => {
          if (selectedCampaign) {
            await updateCampaignStatus(selectedCampaign._id, "active");
            setShowResumeModal(false);
            setSelectedCampaign(null);
          }
        }}
      />

      {/* Delete Campaign Confirmation Modal */}
      <DeleteCampaignModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
        performance={{
          ordersGenerated: selectedCampaign ? {
            "camp-2": 950,
            "camp-3": 410,
            "camp-4": 1680,
            "camp-5": 3250,
            "camp-6": 220,
            "camp-7": 520,
            "camp-8": 290
          }[selectedCampaign._id] || 0 : 0,
          revenueGenerated: selectedCampaign ? {
            "camp-2": 345000,
            "camp-3": 128600,
            "camp-4": 420000,
            "camp-5": 980000,
            "camp-6": 108000,
            "camp-7": 156000,
            "camp-8": 115000
          }[selectedCampaign._id] || 0 : 0
        }}
        onConfirm={async () => {
          if (selectedCampaign) {
            await deleteCampaign(selectedCampaign._id);
            setShowDeleteModal(false);
            setSelectedCampaign(null);
          }
        }}
      />

      {/* Campaign Performance Analytics Drawer */}
      <CampaignDetailsDrawer
        visible={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedCampaign(null);
        }}
        campaignId={selectedCampaign?._id}
        getCampaignPerformanceDetails={getCampaignPerformanceDetails}
        stores={stores}
      />
    </>
  );
}
