import { uploadSingleFile } from "@/shared/api-client/src/api/upload";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseProfileAvatarPickerOptions = {
  remoteUri?: string | null;
};

export const useProfileAvatarPicker = ({
  remoteUri = null,
}: UseProfileAvatarPickerOptions = {}) => {
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    setPickedUri(null);
    setRemoved(false);
  }, [remoteUri]);

  const displayUri = useMemo(() => {
    if (removed) {
      return null;
    }
    return pickedUri ?? remoteUri ?? null;
  }, [pickedUri, remoteUri, removed]);

  const handleImageChange = useCallback((uri: string) => {
    setRemoved(false);
    setPickedUri(uri);
  }, []);

  const handleImageRemove = useCallback(() => {
    setPickedUri(null);
    setRemoved(true);
  }, []);

  const resolveUrlForSubmit = useCallback(async () => {
    if (removed) {
      return "";
    }
    if (pickedUri) {
      const r = await uploadSingleFile({ uri: pickedUri });
      return r.data?.filePath ?? remoteUri ?? undefined;
    }
    return remoteUri ?? undefined;
  }, [pickedUri, remoteUri, removed]);

  return {
    displayUri,
    handleImageChange,
    handleImageRemove,
    resolveUrlForSubmit,
  };
};
