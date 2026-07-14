import { ManagedUpload } from 'aws-sdk/clients/s3'
import { PassThrough } from 'stream'
import prisma from '../../shared/prisma'
import { uploadFileWithStream } from '../connectors'

function saveDetailsToDb(
  fileName: string,
  fileMimeType: string,
  size: number,
  awsFile: ManagedUpload.SendData,
  userId?: string,
  projectId?: string
) {
  return prisma.uploadedFile.create({
    data: {
      fileName,
      filePath: awsFile.Location.replace(/^http:\/\//i, 'https://'),
      fileMimeType,
      size,
      bucket: awsFile.Bucket || 'gcs',
      eTag: awsFile.ETag || 'gcs',
      key: awsFile.Key || `${new Date().getTime()}`,
      user: { connect: { id: userId } },
    },
  })
}

async function getStreamSize(stream: PassThrough): Promise<number> {
  let size = 0
  for await (const chunk of stream) {
    size += chunk.length
  }
  return size
}

export function uploadFile(
  stream: PassThrough,
  originalName: string,
  mimetype: string,
  userId: string,
  projectId?: string
) {
  return uploadFileWithStream(stream, originalName, mimetype)
    .then(async (sendFileMetadata) => {
      const size = await getStreamSize(stream)
      await saveDetailsToDb(originalName, mimetype, size, sendFileMetadata, userId, projectId)
      return { ...sendFileMetadata, Location: sendFileMetadata.Location.replace(/^http:\/\//i, 'https://') }
    })
    .catch((err) => {
      console.log(err)
    })
}
