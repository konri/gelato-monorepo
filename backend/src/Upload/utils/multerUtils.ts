import multer from 'multer'

const storage = multer.memoryStorage()

export const multipleUpload = multer({ storage }).array('file')

export const singleUpload = multer({ storage }).single('file')
