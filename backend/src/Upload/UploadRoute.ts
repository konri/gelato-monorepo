import express from 'express'
import { ManagedUpload } from 'aws-sdk/clients/s3'
import { uploadFile } from './connectors'
import { singleUpload, multipleUpload } from './utils/multerUtils'
import prisma from '../shared/prisma'
import { RequestWithUser } from '../shared/interface/Context'

const uploadRoute = express.Router()

interface UploadedResponse {
  id: string
  fileName: string
  filePath: string
  fileMimeType: string
  size: number
}

async function saveDetailsToDb(
  requestFile: Express.Multer.File,
  awsFile: ManagedUpload.SendData,
  userId: string
): Promise<UploadedResponse> {
  const uploaded = await prisma.uploadedFile.create({
    data: {
      fileName: requestFile.originalname,
      filePath: awsFile.Location,
      filePreview: '',
      fileMimeType: requestFile.mimetype,
      size: requestFile.size,
      bucket: awsFile.Bucket,
      eTag: awsFile.ETag || '',
      key: awsFile.Key || '',
      user: { connect: { id: userId } },
    },
  })

  return {
    id: uploaded.id,
    fileName: uploaded.fileName,
    filePath: uploaded.filePath,
    fileMimeType: uploaded.fileMimeType,
    size: uploaded.size,
  }
}

// Single file upload
uploadRoute.post('/file', singleUpload, async (req: RequestWithUser, res: any) => {
  const { file, query } = req
  const folder = query.folder as string | undefined
  try {
    const sendFileMetadata = await uploadFile(file!, folder)
    const response = await saveDetailsToDb(file!, sendFileMetadata, req!.user!.id)
    res.status(200).send(response)
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
})

// Multiple files upload
uploadRoute.post('/files', multipleUpload, async (req: RequestWithUser, res: any) => {
  const files = req.files as Express.Multer.File[]
  const folder = req.query.folder as string | undefined
  try {
    const results = await Promise.all(
      files.map(async (file) => {
        const sendFileMetadata = await uploadFile(file, folder)
        return saveDetailsToDb(file, sendFileMetadata, req!.user!.id)
      })
    )
    res.status(200).send(results)
  } catch (err) {
    console.error(err)
    res.status(500).send(err)
  }
})

export default uploadRoute
