/// <reference path="../ambient/formdata-rn.d.ts" />
import { apiPostFormData } from "./client";
import type { ApiResponse } from "./types";

export type UploadedFileRecord = {
  id: string;
  fileName: string;
  filePath: string;
  fileMimeType: string;
  size: number;
};

export type LocalFileForUpload = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

function uploadPathWithFolder(base: string, folder?: string): string {
  if (!folder) {
    return base;
  }
  const q = new URLSearchParams({ folder });
  return `${base}?${q.toString()}`;
}

function resolveFileName(uri: string, provided?: string | null): string {
  if (provided) return provided;
  const segment = uri.split("/").pop();
  return segment && segment.length > 0 ? segment : "upload";
}

function resolveMimeType(uri: string, provided?: string | null): string {
  if (provided) return provided;
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function uploadSingleFile(
  file: LocalFileForUpload,
  options?: { folder?: string }
): Promise<ApiResponse<UploadedFileRecord>> {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: resolveFileName(file.uri, file.fileName),
    type: resolveMimeType(file.uri, file.mimeType),
  });
  const path = uploadPathWithFolder("/upload/file", options?.folder);
  return apiPostFormData<UploadedFileRecord>(path, formData);
}

export async function uploadMultipleFiles(
  files: LocalFileForUpload[],
  options?: { folder?: string }
): Promise<ApiResponse<UploadedFileRecord[]>> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", {
      uri: file.uri,
      name: resolveFileName(file.uri, file.fileName),
      type: resolveMimeType(file.uri, file.mimeType),
    });
  }
  const path = uploadPathWithFolder("/upload/files", options?.folder);
  return apiPostFormData<UploadedFileRecord[]>(path, formData);
}

export function uploadedFileIds(records: UploadedFileRecord[]): string[] {
  return records.map((r) => r.id);
}
