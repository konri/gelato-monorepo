import { ManagedUpload } from 'aws-sdk/clients/s3'
import { PassThrough } from 'stream'
import { uploadFile as uploadFileS3, uploadFileWithStream as uploadFileWithStreamS3 } from './aws-s3'
import { uploadFile as uploadFileGSC, uploadFileWithStream as uploadFileWithStreamGSC } from './gsc'

export const uploadFile = (file: Express.Multer.File, folder?: string): Promise<ManagedUpload.SendData> => {
  if (process.env.ENVIRONMENT === 'PROD') {
    return uploadFileGSC(file)
  }
  return uploadFileS3(file, folder)
}

export const uploadFileWithStream = (
  stream: PassThrough,
  originalName: string,
  mimetype: string
): Promise<ManagedUpload.SendData> => {
  if (process.env.ENVIRONMENT === 'PROD') {
    return uploadFileWithStreamGSC(stream, originalName, mimetype)
  }
  return uploadFileWithStreamS3(stream, originalName, mimetype)
}
