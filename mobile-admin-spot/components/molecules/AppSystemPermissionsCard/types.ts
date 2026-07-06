export type AppSystemPermissionsCardProps = {
  cameraLabel: string | null | undefined;
  locationLabel: string | null | undefined;
  onPressCameraPermission: () => void;
  onPressLocationPermission: () => void;
  onOpenOsSettings: () => void;
};
