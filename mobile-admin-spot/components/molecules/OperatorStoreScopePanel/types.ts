export type OperatorStoreScopePanelProps =
  | {
      mode: "readOnly";
      storeScopeAll: boolean;
      storeNames: string[];
    }
  | {
      mode: "editable";
      storeScopeAll: boolean;
      selectedStoreIds: string[];
      availableStores: { id: string; name: string }[];
      onToggleStoreScopeAll: () => void;
      onToggleStoreId: (storeId: string) => void;
    };
