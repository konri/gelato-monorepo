// Sharp removed from dependencies (FreeBSD compatibility)
// Use Jimp or client-side processing instead
// import sharp from 'sharp'

export function createPreview(file: Buffer) {
  // Image preview generation disabled - Sharp removed for FreeBSD compatibility
  // TODO: Implement with Jimp or use client-side image processing
  console.log('Image preview generation disabled (Sharp not installed)')
  return Promise.resolve(file)
  // Alternative with Jimp:
  // const Jimp = require('jimp')
  // const image = await Jimp.read(file)
  // return image.resize(200, Jimp.AUTO).quality(80).getBufferAsync(Jimp.MIME_JPEG)
}
