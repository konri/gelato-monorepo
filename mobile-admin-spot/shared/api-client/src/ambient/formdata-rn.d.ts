export {};

declare global {
  interface FormData {
    append(
      name: string,
      value: string | Blob | { uri: string; name?: string; type?: string },
      fileName?: string,
    ): void;
  }
}
