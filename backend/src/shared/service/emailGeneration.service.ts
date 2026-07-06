import fs from 'fs'
import path from 'path'
import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { StandardDialect, TemplateEngine } from 'thymeleaf'
// import puppeteer from 'puppeteer' // Commented out for FreeBSD compatibility
import i18next from 'i18next'

export interface AttachmentEmail {
  content: string
  filename: string
  type: 'application/pdf'
  disposition: 'attachment'
}

export async function generatePdf(templateFile: string, templateVars: any): Promise<string> {
  // PDF generation disabled on FreeBSD - Puppeteer not supported
  console.warn('PDF generation not available on this platform (FreeBSD)')
  return ''

  /* Original Puppeteer code - commented out for FreeBSD compatibility
  const template: string = fs.readFileSync(
    path.resolve(__dirname, `../../public/Messaging/template/${templateFile}.html`),
    'utf8'
  )
  const templateEngine = new TemplateEngine({
    dialects: [new StandardDialect('th')],
  })

  const voucherHtml = await templateEngine.process(template, templateVars)
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()

  // Set the HTML content of the page
  await page.setContent(voucherHtml, { waitUntil: 'domcontentloaded' })

  // Generate PDF as buffer
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })

  await browser.close()

  // Convert the PDF buffer to base64
  const base64PDF = pdfBuffer.toString('base64')

  return base64PDF
  */
}

export async function sendEmail(
  templateFile: string,
  templateVars: any,
  emailTo: string,
  translationKey: string,
  language: string,
  attachments: Array<AttachmentEmail> = []
) {
  const emailTemplate: string = fs.readFileSync(
    path.resolve(__dirname, `../../public/Messaging/template/${templateFile}.html`),
    'utf8'
  )
  const templateEngine = new TemplateEngine({
    dialects: [new StandardDialect('th')],
  })

  // Load translations
  const translations = i18next.getResourceBundle(language.toLowerCase(), 'translation')

  // Add translations to templateVars
  templateVars.translations = translations || {}

  templateEngine
    .process(emailTemplate, templateVars)
    .then(async (email: string) => {
      const subject = translations.emails?.[translationKey]?.subject || 'EasyBons'

      // Use SMTP if configured, otherwise fallback to SendGrid
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          requireTLS: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: emailTo,
          subject,
          html: email,
          attachments: attachments.map((att) => ({
            filename: att.filename,
            content: att.content,
            contentType: att.type,
          })),
        })
      } else {
        // Fallback to SendGrid
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
        const msg = {
          to: emailTo,
          from: process.env.SENDGRID_FROM,
          subject,
          html: email,
          attachments,
        }
        await sgMail.send(msg as any)
      }
    })
    .catch((e: any) => {
      console.error('Email sending error:', e)
    })
}
