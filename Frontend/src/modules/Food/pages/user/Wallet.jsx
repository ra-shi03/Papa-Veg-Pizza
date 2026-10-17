import React from "react";
import useAppBackNavigation from "@food/hooks/useAppBackNavigation";
import RewardsWalletView from "./rewards/RewardsWalletView";

export default function Wallet() {
  const goBack = useAppBackNavigation();
  return <RewardsWalletView onBack={goBack} initialTab="wallet" />;
}
