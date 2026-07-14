import { registerEnumType } from 'type-graphql'

export enum FileType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

registerEnumType(FileType, {
  name: 'FileType',
  description: 'FileType for file type',
})
