import { Storage } from '@google-cloud/storage'
import { removeNonEnglishChars } from '../utils/obscuteChars'

const fileCode = process.env.AWS_S3_FILE_CODE!
const bucketName = process.env.GSC_BUCKET_NAME!
const projectId = process.env.GSC_PROJECT_ID!

const storage = new Storage({ projectId })

export const uploadFile = async (file: Express.Multer.File): Promise<any> => {
  const fileEncoded = removeNonEnglishChars(file.originalname)
  const filename = `${Date.now()}${fileCode}${fileEncoded}`
  console.log(`GSC uploadFile fileEncoded: ${fileEncoded}, filename: ${filename}`)
  const bucket = storage.bucket(bucketName)
  const blob = bucket.file(filename)
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    public: true,
  })

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err)
    })

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      resolve({
        Location: publicUrl,
        Bucket: bucket.name,
      })
    })

    blobStream.end(file.buffer)
  })
}

export const uploadFileWithStream = async (
  stream: NodeJS.ReadableStream,
  originalName: string,
  mimetype: string
): Promise<any> => {
  const fileEncoded = removeNonEnglishChars(originalName)
  const filename = `${Date.now()}${fileCode}${fileEncoded}`
  console.log(`GSC uploadFileWithStream fileEncoded: ${fileEncoded}, filename: ${filename}`)
  const bucket = storage.bucket(bucketName)
  const blob = bucket.file(filename)
  const blobStream = blob.createWriteStream({
    metadata: {
      contentType: mimetype,
    },
    public: true,
  })

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => {
      reject(err)
    })

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      resolve({
        Location: publicUrl,
        Bucket: bucket.name,
      })
    })

    stream.pipe(blobStream)
  })
}
