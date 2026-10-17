import React from "react";
import useAppBackNavigation from "@food/hooks/useAppBackNavigation";
import RewardsWalletView from "./rewards/RewardsWalletView";

export default function Rewards() {
  const goBack = useAppBackNavigation();
  return <RewardsWalletView onBack={goBack} initialTab="cheesy" />;
}

