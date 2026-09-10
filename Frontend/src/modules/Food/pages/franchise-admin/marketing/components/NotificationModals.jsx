import React from "react";
import SendNotificationModal from "./SendNotificationModal";
import EditNotificationModal from "./EditNotificationModal";
import ViewNotificationDrawer from "./ViewNotificationDrawer";
import NotificationAnalyticsDrawer from "./NotificationAnalyticsDrawer";
import CancelNotificationModal from "./CancelNotificationModal";
import ResendNotificationModal from "./ResendNotificationModal";
import DeleteNotificationModal from "./DeleteNotificationModal";

export default function NotificationModals({
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showViewDrawer,
  setShowViewDrawer,
  showAnalyticsDrawer,
  setShowAnalyticsDrawer,
  showCancelModal,
  setShowCancelModal,
  showResendModal,
  setShowResendModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedNotification,
  setSelectedNotification,
  createNotification,
  updateNotification,
  deleteNotification,
  cancelNotification,
  resendNotification,
  loadingAnalytics,
  analyticsData,
  logsList,
  logSearch,
  setLogSearch,
  logPage,
  setLogPage,
  logLimit,
  setLogLimit,
  stores
}) {
  return (
    <>
      {/* Send Notification Modal */}
      <SendNotificationModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createNotification}
        stores={stores}
      />

      {/* Edit Notification Modal */}
      <EditNotificationModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNotification(null);
        }}
        onSubmit={updateNotification}
        notification={selectedNotification}
        stores={stores}
      />

      {/* View Notification Details Drawer */}
      <ViewNotificationDrawer
        visible={showViewDrawer}
        onClose={() => {
          setShowViewDrawer(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        stores={stores}
      />

      {/* Advanced Logs & Charts Analytics Drawer */}
      <NotificationAnalyticsDrawer
        visible={showAnalyticsDrawer}
        onClose={() => {
          setShowAnalyticsDrawer(false);
          setSelectedNotification(null);
        }}
        notification={selectedNotification}
        loadingAnalytics={loadingAnalytics}
        analyticsData={analyticsData}
        logsList={logsList}
        logSearch={logSearch}
        setLogSearch={setLogSearch}
        logPage={logPage}
        setLogPage={setLogPage}
        logLimit={logLimit}
        setLogLimit={setLogLimit}
      />

      {/* Cancel Scheduled Notification warning Modal */}
      <CancelNotificationModal
        open={showCancelModal}
        onCancel={() => {
          setShowCancelModal(false);
          setSelectedNotification(null);
        }}
        onConfirm={async () => {
          if (selectedNotification) {
            await cancelNotification(selectedNotification._id);
            setShowCancelModal(false);
            setSelectedNotification(null);
          }
        }}
        notification={selectedNotification}
      />

      {/* Resend Campaign Modal */}
      <ResendNotificationModal
        open={showResendModal}
        onCancel={() => {
          setShowResendModal(false);
          setSelectedNotification(null);
        }}
        onConfirm={async (option) => {
          if (selectedNotification) {
            await resendNotification(selectedNotification._id, option);
            setShowResendModal(false);
            setSelectedNotification(null);
          }
        }}
        notification={selectedNotification}
      />

      {/* Delete / Archive notification Modal */}
      <DeleteNotificationModal
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedNotification(null);
        }}
        onConfirm={async () => {
          if (selectedNotification) {
            await deleteNotification(selectedNotification._id);
            setShowDeleteModal(false);
            setSelectedNotification(null);
          }
        }}
        notification={selectedNotification}
      />
    </>
  );
}
