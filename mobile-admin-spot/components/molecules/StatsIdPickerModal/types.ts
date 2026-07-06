export type StatsIdPickerModalItem = {
  id: string;
  title: string;
};

export type StatsIdPickerModalProps = {
  visible: boolean;
  title: string;
  clearLabel: string;
  items: StatsIdPickerModalItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
};
