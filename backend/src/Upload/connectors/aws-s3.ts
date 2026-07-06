import AWS from 'aws-sdk'
import { CredentialsOptions } from 'aws-sdk/lib/credentials'
import { ManagedUpload } from 'aws-sdk/clients/s3'
import { PassThrough } from 'stream'
if (process.env.ENVIRONMENT !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
  const dotenv = require('dotenv')
  dotenv.config()
  console.log('Not production build')
} else {
  console.log('Production build!')
}

const credentials: CredentialsOptions = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_KEY!,
}

const s3ServerEndpoint = process.env.AWS_S3_SERVER_ENDPOINT!
const bucketName = process.env.AWS_BUCKET_NAME!
const fileCodeAws = process.env.AWS_S3_FILE_CODE!

const s3client = new AWS.S3({
  credentials,
  endpoint: s3ServerEndpoint,
  s3ForcePathStyle: true,
})

export const uploadFile = (file: Express.Multer.File, folder?: string): Promise<ManagedUpload.SendData> => {
  return new Promise((resolve, reject) => {
    const { buffer, mimetype, originalname } = file
    const key = folder ? `${folder}/${encodeURI(originalname)}` : encodeURI(originalname)
    s3client.upload(
      {
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      },
      (err: Error, data: ManagedUpload.SendData) => {
        if (err) return reject(err)
        return resolve(data)
      }
    )
  })
}

export const uploadFileWithStream = (
  stream: PassThrough,
  originalName: string,
  mimetype: string
): Promise<ManagedUpload.SendData> => {
  return new Promise((resolve, reject) => {
    s3client.upload(
      {
        Bucket: bucketName,
        Key: encodeURI(originalName),
        Body: stream,
        ContentType: mimetype,
      },
      (err: Error, data: ManagedUpload.SendData) => {
        if (err) return reject(err)
        return resolve(data)
      }
    )
  })
}
