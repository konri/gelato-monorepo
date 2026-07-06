import { FileType } from '../objectType/FileType'
import { UploadedFile } from '@prisma/client'

export function useFileTypes(uploadedFiles: Array<UploadedFile>): Array<FileType> {
  const fileTypesSet = new Set<FileType>()
  uploadedFiles.forEach((uploadedFile) => {
    const { fileMimeType } = uploadedFile
    if (fileMimeType.includes('image')) {
      fileTypesSet.add(FileType.IMAGE)
    } else if (fileMimeType.includes('pdf')) {
      fileTypesSet.add(FileType.PDF)
    } else if (fileMimeType.includes('video')) {
      fileTypesSet.add(FileType.VIDEO)
    } else {
      fileTypesSet.add(FileType.OTHER)
    }
  })
  return Array.from(fileTypesSet)
}
