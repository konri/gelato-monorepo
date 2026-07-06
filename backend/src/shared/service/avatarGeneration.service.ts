// Canvas and avatar generation temporarily disabled
// import { registerFont, createCanvas, Canvas } from 'canvas'
// import { PassThrough } from 'stream'
import { User } from '@prisma/client'
// import { uploadFile } from '../../Upload/service/uploadFile'
// import { avatarColorPalette } from '../consts/avatarColorPalette'

// if (process.env.ENVIRONMENT === 'PROD') {
//   registerFont('/usr/share/fonts/truetype/msttcorefonts/Arial.ttf', { family: 'Arial' })
// }

// function generateColorPallet() {
//   const arr = avatarColorPalette
//   const randomIndex = Math.floor(Math.random() * arr.length)

//   return arr[randomIndex]
// }

// // Function to generate the avatar
// async function generateAvatar(firstName: string, lastName: string): Promise<Canvas> {
//   const canvasSize = 200
//   const canvas = createCanvas(canvasSize, canvasSize)
//   const ctx = canvas.getContext('2d')

//   const { bg, font } = generateColorPallet()
//   // Draw circle
//   ctx.beginPath()
//   ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2)
//   ctx.closePath()
//   ctx.fillStyle = bg
//   ctx.fill()

//   // Draw initials
//   ctx.font = `${canvasSize / 2}px Arial`
//   ctx.fillStyle = font
//   ctx.textAlign = 'center'
//   ctx.textBaseline = 'middle'
//   ctx.fillText(firstName[0].toUpperCase() + lastName[0].toUpperCase(), canvasSize / 2, canvasSize / 2)

//   return canvas
// }

// // Function to convert canvas to a binary stream
// function canvasToBinaryStream(canvas: Canvas): PassThrough {
//   const stream = new PassThrough()
//   canvas.createPNGStream().pipe(stream)
//   return stream
// }

export async function generateAvatarForUser(user: User) {
  // Avatar generation temporarily disabled - return null
  console.log('Avatar generation disabled for user:', user.email)
  return null

  // let firstName = 'Default'
  // let lastName = 'User'
  // if (user.firstName && user.surname) {
  //   firstName = user.firstName
  //   lastName = user.surname
  // } else if (user.name) {
  //   const [first, second] = user.name.split(' ')
  //   firstName = first || 'Default'
  //   lastName = second || 'User'
  // }
  // const canvas = await generateAvatar(firstName, lastName)
  // const stream = canvasToBinaryStream(canvas)
  // const fileName = `avatars_${firstName.toLowerCase()}_${lastName.toLowerCase()}.png`
  // return uploadFile(stream, fileName, 'image/png', user.id)
}
