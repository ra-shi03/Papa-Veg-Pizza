import React from "react";
import DeliveryMapModal from "@food/components/user/DeliveryMapModal";
import DeliveryOrCollectionModal from "@food/components/user/DeliveryOrCollectionModal";
import TakeawayMapModal from "@food/components/user/TakeawayMapModal";
import DeliverOnTrainModal from "@food/components/user/DeliverOnTrainModal";
import { InCarModal } from "./InCarModal";

export function HomeModals({
  showMapModal,
  setShowMapModal,
  deliveryAddress,
  setDeliveryAddress,
  setActiveService,
  triggerToast,
  isDarkMode,
  showServiceSelector,
  setShowServiceSelector,
  isModalOpen,
  closeLocationModal,
  setShowStoreModal,
  showStoreModal,
  setShowCarModal,
  showCarModal,
  setShowTrainModal,
  showTrainModal,
  takeawayHut,
  setTakeawayHut,
  carNumber,
  setCarNumber,
  confirmLocation
}) {
  return (
    <>
      {/* Delivery Map Modal Selector */}
      <DeliveryMapModal
        show={showMapModal}
        onClose={() => setShowMapModal(false)}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={setDeliveryAddress}
        setActiveService={setActiveService}
        triggerToast={triggerToast}
        isDarkMode={isDarkMode}
      />

      {/* Delivery or Collection Selection Modal */}
      <DeliveryOrCollectionModal
        show={showServiceSelector}
        onClose={() => {
          setShowServiceSelector(false);
          if (isModalOpen) closeLocationModal();
        }}
        onSelect={(id) => {
          if (id === "delivery") {
            if (!deliveryAddress) {
              setDeliveryAddress("Joshi Colony, Bk Sindhi Colony, Indore, Indore");
            }
            setShowMapModal(true);
          } else if (id === "takeaway") {
            setShowStoreModal(true);
          } else if (id === "incar") {
            setShowCarModal(true);
          } else if (id === "train") {
            setShowTrainModal(true);
          }
        }}
        isDarkMode={isDarkMode}
      />

      {/* Takeaway Map Modal Selector */}
      <TakeawayMapModal
        show={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        takeawayHut={takeawayHut}
        setTakeawayHut={setTakeawayHut}
        setActiveService={setActiveService}
        triggerToast={triggerToast}
        isDarkMode={isDarkMode}
        confirmedAddress={deliveryAddress}
      />

      {/* In-Car Details Modal */}
      <InCarModal
        showCarModal={showCarModal}
        setShowCarModal={setShowCarModal}
        carNumber={carNumber}
        setCarNumber={setCarNumber}
        confirmLocation={confirmLocation}
        triggerToast={triggerToast}
      />

      {/* Deliver on Train Modal */}
      <DeliverOnTrainModal
        show={showTrainModal}
        onClose={() => setShowTrainModal(false)}
      />
    </>
  );
}
