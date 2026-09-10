import React from "react";
import CreateCouponModal from "./CreateCouponModal";
import EditCouponModal from "./EditCouponModal";
import CloneCouponModal from "./CloneCouponModal";
import CouponDetailsDrawer from "./CouponDetailsDrawer";
import ActivateDeactivateModal from "./ActivateDeactivateModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export default function LocalCouponModals({
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showCloneModal,
  setShowCloneModal,
  showDetailsDrawer,
  setShowDetailsDrawer,
  showStatusModal,
  setShowStatusModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedCoupon,
  setSelectedCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponUsageDetails
}) {
  return (
    <>
      {/* Create Coupon Modal */}
      <CreateCouponModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (payload) => {
          try {
            await createCoupon(payload);
            setShowCreateModal(false);
          } catch (err) {
            // error handled in hook toast
          }
        }}
      />

      {/* Edit Coupon Modal */}
      <EditCouponModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCoupon(null);
        }}
        coupon={selectedCoupon}
        onSubmit={async (id, payload) => {
          try {
            await updateCoupon(id, payload);
            setShowEditModal(false);
            setSelectedCoupon(null);
          } catch (err) {
            // error handled in hook toast
          }
        }}
      />

      {/* Clone Coupon Modal */}
      <CloneCouponModal
        visible={showCloneModal}
        onClose={() => {
          setShowCloneModal(false);
          setSelectedCoupon(null);
        }}
        coupon={selectedCoupon}
        onSubmit={async (payload) => {
          try {
            await createCoupon(payload);
            setShowCloneModal(false);
            setSelectedCoupon(null);
          } catch (err) {
            // error handled in hook toast
          }
        }}
      />

      {/* Coupon Details Drawer */}
      <CouponDetailsDrawer
        visible={showDetailsDrawer}
        onClose={() => {
          setShowDetailsDrawer(false);
          setSelectedCoupon(null);
        }}
        coupon={selectedCoupon}
        getCouponUsageDetails={getCouponUsageDetails}
      />

      {/* Activate / Deactivate Toggle Modal */}
      <ActivateDeactivateModal
        visible={showStatusModal}
        onCancel={() => {
          setShowStatusModal(false);
          setSelectedCoupon(null);
        }}
        onConfirm={async () => {
          if (selectedCoupon) {
            await toggleCouponStatus(selectedCoupon._id);
            setShowStatusModal(false);
            setSelectedCoupon(null);
          }
        }}
        coupon={selectedCoupon}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedCoupon(null);
        }}
        onConfirm={async () => {
          if (selectedCoupon) {
            await deleteCoupon(selectedCoupon._id);
            setShowDeleteModal(false);
            setSelectedCoupon(null);
          }
        }}
        coupon={selectedCoupon}
        usageCount={selectedCoupon ? (getCouponUsageDetails(selectedCoupon._id)?.analytics?.totalUsage || 0) : 0}
      />
    </>
  );
}
