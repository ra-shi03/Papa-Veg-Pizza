import React from "react";
import CreateBannerModal from "./CreateBannerModal";
import EditBannerModal from "./EditBannerModal";
import PreviewBannerDrawer from "./PreviewBannerDrawer";
import ActivateBannerModal from "./ActivateBannerModal";
import DeactivateBannerModal from "./DeactivateBannerModal";
import DeleteBannerModal from "./DeleteBannerModal";

export default function BannerModals({
  showCreateModal,
  setShowCreateModal,
  showEditModal,
  setShowEditModal,
  showPreviewDrawer,
  setShowPreviewDrawer,
  showActivateModal,
  setShowActivateModal,
  showDeactivateModal,
  setShowDeactivateModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedBanner,
  setSelectedBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  stores,
  products,
  categories,
  coupons,
  campaigns
}) {
  return (
    <>
      {/* Create Banner Modal */}
      <CreateBannerModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createBanner}
        stores={stores}
        products={products}
        categories={categories}
        coupons={coupons}
        campaigns={campaigns}
      />

      {/* Edit Banner Modal */}
      <EditBannerModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedBanner(null);
        }}
        onSubmit={updateBanner}
        banner={selectedBanner}
        stores={stores}
        products={products}
        categories={categories}
        coupons={coupons}
        campaigns={campaigns}
      />

      {/* Preview Banner Drawer */}
      <PreviewBannerDrawer
        visible={showPreviewDrawer}
        onClose={() => {
          setShowPreviewDrawer(false);
          setSelectedBanner(null);
        }}
        banner={selectedBanner}
        stores={stores}
        products={products}
        categories={categories}
        coupons={coupons}
        campaigns={campaigns}
      />

      {/* Activate Banner Modal */}
      <ActivateBannerModal
        open={showActivateModal}
        onCancel={() => {
          setShowActivateModal(false);
          setSelectedBanner(null);
        }}
        onConfirm={async () => {
          if (selectedBanner) {
            await updateBannerStatus(selectedBanner._id, "active");
            setShowActivateModal(false);
            setSelectedBanner(null);
          }
        }}
        banner={selectedBanner}
      />

      {/* Deactivate Banner Modal */}
      <DeactivateBannerModal
        open={showDeactivateModal}
        onCancel={() => {
          setShowDeactivateModal(false);
          setSelectedBanner(null);
        }}
        onConfirm={async () => {
          if (selectedBanner) {
            await updateBannerStatus(selectedBanner._id, "inactive");
            setShowDeactivateModal(false);
            setSelectedBanner(null);
          }
        }}
        banner={selectedBanner}
      />

      {/* Delete Banner Modal */}
      <DeleteBannerModal
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedBanner(null);
        }}
        onConfirm={async () => {
          if (selectedBanner) {
            await deleteBanner(selectedBanner._id);
            setShowDeleteModal(false);
            setSelectedBanner(null);
          }
        }}
        banner={selectedBanner}
      />
    </>
  );
}
