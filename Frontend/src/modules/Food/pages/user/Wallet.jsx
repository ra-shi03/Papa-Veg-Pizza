import React from "react";
import useAppBackNavigation from "@food/hooks/useAppBackNavigation";
import PreviousRewardsView from "./rewards/PreviousRewardsView";

export default function Wallet() {
  const goBack = useAppBackNavigation();
  return <PreviousRewardsView onBack={goBack} initialTab="rewards" />;
}
