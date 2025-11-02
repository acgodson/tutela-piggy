import { useState, useCallback } from "react";

export const useModals = () => {
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showAlertsPanel, setShowAlertsPanel] = useState(false);

  const openEmbedModal = useCallback(() => setShowEmbedModal(true), []);
  const closeEmbedModal = useCallback(() => setShowEmbedModal(false), []);
  const toggleEmbedModal = useCallback(
    () => setShowEmbedModal((prev) => !prev),
    []
  );

  const openAlertsPanel = useCallback(() => setShowAlertsPanel(true), []);
  const closeAlertsPanel = useCallback(() => setShowAlertsPanel(false), []);
  const toggleAlertsPanel = useCallback(
    () => setShowAlertsPanel((prev) => !prev),
    []
  );

  return {
    showEmbedModal,
    openEmbedModal,
    closeEmbedModal,
    toggleEmbedModal,
    showAlertsPanel,
    openAlertsPanel,
    closeAlertsPanel,
    toggleAlertsPanel,
  };
};
