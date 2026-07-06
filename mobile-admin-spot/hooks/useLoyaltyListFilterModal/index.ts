import { useCallback, useState } from "react";

export function useLoyaltyListFilterModal() {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const openFilterModal = useCallback(() => {
    setFilterModalOpen(true);
  }, []);
  const closeFilterModal = useCallback(() => {
    setFilterModalOpen(false);
  }, []);
  return { filterModalOpen, openFilterModal, closeFilterModal };
}
