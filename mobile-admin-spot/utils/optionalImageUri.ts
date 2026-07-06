export function trimImageUri(
  value: string | undefined | null,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function remoteImageSource(
  value: string | undefined | null,
): { uri: string } | undefined {
  const uri = trimImageUri(value);
  return uri ? { uri } : undefined;
}
