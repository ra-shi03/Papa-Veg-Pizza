import React from "react";
import ComboFormModal from "./ComboFormModal";

export default function CreateComboModal(props) {
  return <ComboFormModal {...props} mode="create" combo={null} />;
}
