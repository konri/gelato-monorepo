import express from 'express'
import passport from 'passport'
import { IVerifyOptions } from 'passport-local'
// @ts-ignore
import { TemplateEngine, StandardDialect } from 'thymeleaf'
import fs from 'fs'
import path from 'path'
import { User } from '../User/objectType/User'
import { generateJWT, hashPassword } from './PasswordUtil'
import { sendEmail } from '../shared/service/emailGeneration.service'
import { LoginInfo } from './model/LoginInfo'
import { ErrorWithStatus } from '../shared/interface/ErrorWithStatus'
import prisma from '../shared/prisma'
import type * as Prisma from '@prisma/client'
import { CodeGenerator } from '../shared/util/CodeGenerator'
import { OAuth2Client } from 'google-auth-library'

const authRoute = express.Router()

authRoute.post('/signup', passport.authenticate('signup', { session: false }), async (req, res, next) => {
  res.json({
    message: 'Signup successful',
  })
})

authRoute.post('/login', async (req, res, next) => {
  passport.authenticate('login', async (err: any, user: User, info?: any) => {
    try {
      if (err || !user) {
        let errorRes
        if (!info) {
          errorRes = new ErrorWithStatus(500, `Internal server error: ${err || 'Unknown error'}`)
        } else {
          switch (info.message) {
            case LoginInfo.USER_NOT_FOUND: {
              errorRes = new ErrorWithStatus(400, 'User not found')
              break
            }
            case LoginInfo.WRONG_PASSWORD: {
              errorRes = new ErrorWithStatus(401, 'Wrong password')
              break
            }
            case 'EMAIL_NOT_VERIFIED': {
              errorRes = new ErrorWithStatus(
                403,
                'Email not verified. Please check your email and click the verification link.'
              )
              break
            }
            case 'COMPLETE_COMPANY_REGISTRATION':
            case 'COMPLETE_BUSINESS_REGISTRATION':
            case 'UPGRADE_TO_BUSINESS': {
              return res.status(202).json({
                requiresAction: true,
                action: info.action,
                message: info.message,
                user: {
                  email: info.user.email,
                  roles: info.user.roles,
                  registrationSource: info.user.registrationSource,
                },
              })
            }
            case 'ACCOUNT_EXISTS_LOGIN_REQUIRED': {
              errorRes = new ErrorWithStatus(409, 'Account with this email already exists. Please login instead.')
              break
            }
            case 'LOGIN_CONTEXT_REQUIRED': {
              errorRes = new ErrorWithStatus(
                400,
                'Login context is required (WEB_MERCHANT, WEB_CLIENT, MOBILE_MERCHANT, or MOBILE_CLIENT)'
              )
              break
            }
            default: {
              errorRes = new ErrorWithStatus(
                500,
                `Internal server error error is: ${err} and info: ${info.message || 'No message'}`
              )
            }
          }
        }
        return next(errorRes)
      }

      req.login(user, { session: false }, async (error) => {
        if (error) return next(error)

        const token = generateJWT(user)
        const { email, picture, roles, name, firstName, surname, profileType, registrationSource } = user as any

        const response: any = {
          token: {
            access_token: token,
            type: 'Bearer',
          },
          user: { email, picture, roles, name, firstName, surname, profileType, registrationSource },
        }

        // Add welcome message for first mobile login
        if (info?.firstMobileLogin) {
          response.firstMobileLogin = true
          response.welcomeMessage = info.welcomeMessage
        }

        // Add company registration requirement flag
        if (info?.requiresCompanyRegistration) {
          response.requiresCompanyRegistration = true
        }

        return res.json(response)
      })
    } catch (error) {
      return next(error)
    }
  })(req, res, next)
})

// Google OAuth Mobile - Native SDK endpoint
authRoute.post('/login/google/mobile', async (req, res) => {
  try {
    const { serverAuthCode, referralCode } = req.body

    if (!serverAuthCode) {
      return res.status(400).json({
        success: false,
        error: 'serverAuthCode is required',
      })
    }

    // Initialize Google OAuth2 client
    const client = new OAuth2Client(process.env.GOOGLE_APP_ID, process.env.GOOGLE_APP_SECRET)

    // Exchange serverAuthCode for tokens
    const { tokens } = await client.getToken(serverAuthCode)
    client.setCredentials(tokens)

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_APP_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google token',
      })
    }

    // Create Google profile object
    const googleProfile = {
      id: payload.sub,
      provider: 'google',
      displayName: payload.name || '',
      emails: [{ value: payload.email || '' }],
      photos: [{ value: payload.picture || '' }],
      name: {
        givenName: payload.given_name || '',
        familyName: payload.family_name || '',
      },
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        AND: {
          profileType: 'google',
          profileId: googleProfile.id,
        },
      },
    })

    let isFirstTime = false

    if (!user) {
      // Create new user with CLIENT role for mobile
      const email = googleProfile.emails[0].value
      const newEmail = email ? `${email}-google` : `google-${Date.now()}`

      user = await prisma.user.create({
        data: {
          name: googleProfile.displayName,
          email: newEmail,
          password: '',
          profileId: googleProfile.id,
          profileType: 'google',
          roles: ['CLIENT'], // Direct CLIENT role for mobile
          registrationSource: 'MOBILE_CLIENT',
          firstName: googleProfile.name.givenName,
          surname: googleProfile.name.familyName,
          picture: googleProfile.photos[0].value,
          emailVerified: true,
          isFirstTimeGoogleLogin: true,
        },
      })

      isFirstTime = true

      // Handle referral code
      if (referralCode) {
        const referralCodeRecord = await prisma.userReferralCode.findUnique({
          where: { code: referralCode },
        })

        if (referralCodeRecord && referralCodeRecord.userId !== user.id) {
          await prisma.referral.create({
            data: {
              referrerId: referralCodeRecord.userId,
              referredUserId: user.id,
              referralCode: referralCode,
              pointsAwarded: 0,
              isCompleted: false,
            },
          })

          // Award referral points immediately for mobile clients
          const { ReferralService } = await import('../Referral/service/ReferralService')
          await ReferralService.awardReferralPoints(user.id, 'CLIENT_ACTIVE')
        }
      }
    } else {
      // Existing user - second login onwards should be false
      isFirstTime = false

      if (user.isFirstTimeGoogleLogin) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isFirstTimeGoogleLogin: false },
        })
      }
    }

    // Generate JWT token
    const jwtToken = generateJWT(user)

    // Return mobile-friendly response
    return res.json({
      success: true,
      isFirstTimeGoogleLogin: isFirstTime,
      token: {
        access_token: jwtToken,
        type: 'Bearer',
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        surname: user.surname,
        picture: user.picture,
        phone: user.phone,
        roles: user.roles,
        profileType: user.profileType,
        registrationSource: user.registrationSource,
        language: user.language,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Google mobile login error:', error)
    return res.status(500).json({
      success: false,
      error: 'Google authentication failed',
    })
  }
})

// Mobile endpoint to get current user info
authRoute.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const user = req.user as any
    const response = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        surname: user.surname,
        picture: user.picture,
        phone: user.phone,
        roles: user.roles,
        profileType: user.profileType,
        registrationSource: user.registrationSource,
        language: user.language,
        createdAt: user.createdAt,
      },
    }
    res.json(response)
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get user info' })
  }
})

authRoute.post('/change-password', async (req, res, next) => {
  passport.authenticate('login', async (err: any, user: User, info: IVerifyOptions) => {
    try {
      if (err || !user) {
        let errorRes
        switch (info.message) {
          case LoginInfo.USER_NOT_FOUND: {
            errorRes = new ErrorWithStatus(400, 'User not found')
            break
          }
          case LoginInfo.WRONG_PASSWORD: {
            errorRes = new ErrorWithStatus(401, 'Wrong password')
            break
          }
          default: {
            errorRes = new ErrorWithStatus(500, `Internal server error error is: ${err} and info: ${info.message}`)
          }
        }
        return next(errorRes)
      }

      req.login(user, { session: false }, async (error) => {
        if (error) return next(error)
        const { newPassword } = req.body
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password: await hashPassword(newPassword),
          },
        })
        const response = {
          success: true,
          message: 'Password changed successfully',
        }
        return res.status(200).json(response)
      })
    } catch (error) {
      return next(error)
    }
    // return next('SERVER INTERNAL ERROR')
  })(req, res, next)
})

authRoute.post('/forgot', async (req, res) => {
  const { email, source } = req.body

  const user: Prisma.User | null = await prisma.user.findFirst({
    where: {
      email: String(email).toLowerCase().trim(),
    },
  })
  console.log('reset password starting...')
  if (user) {
    console.log('reset password', user.email)

    try {
      const templateEngine = new TemplateEngine({
        dialects: [new StandardDialect('th')],
      })

      const resetPassword = await prisma.resetPassword.create({
        data: {
          user: { connect: { id: user.id } },
        },
      })

      // Determine frontend URL based on source
      let frontendUrl = process.env.FRONT_END_APP_URL!
      if (source === 'merchant') {
        frontendUrl = process.env.FRONT_END_MERCHANT_URL!
      }

      const templateVars = {
        user_name: user.name,
        host: `${frontendUrl}/reset-password`,
        token: resetPassword.id,
      }
      sendEmail('forget-password', templateVars, email, 'passwordReset', user?.language || 'en')
      res.status(200).json('success')
    } catch (e) {
      console.error('forgot password error', e)
    }
  } else {
    res.status(400).json('No user found')
  }
})

// Mobile-friendly password reset with verification code
authRoute.post('/forgot-password-code', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      message: 'Email address is required',
    })
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: String(email).toLowerCase().trim(),
        profileType: 'local',
      },
    })

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User with this email address was not found',
      })
    }

    // Check rate limiting - max 1 email per minute
    const lastReset = await prisma.resetPassword.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (lastReset && Date.now() - lastReset.createdAt.getTime() < 60000) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please wait 1 minute before requesting another code',
      })
    }

    // Delete old reset tokens
    await prisma.resetPassword.deleteMany({
      where: { userId: user.id },
    })

    // Generate verification code (6 digits)
    const resetCode = CodeGenerator.generateVerificationCode()

    // Save reset code to database
    await prisma.resetPassword.create({
      data: {
        userId: user.id,
        id: resetCode, // Store code as ID for verification
      },
    })

    // Send reset code email
    const templateVars = {
      user_name: user.name,
      verification_code: resetCode,
    }

    try {
      await sendEmail(
        'email-verification',
        templateVars,
        user.email,
        'passwordResetCode',
        (user.language || 'PL').toLowerCase()
      )
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Delete reset record if email fails
      await prisma.resetPassword.deleteMany({ where: { userId: user.id } })
      return res.status(500).json({
        error: 'Failed to send email',
        message: 'Failed to send password reset code. Please try again later.',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Password reset code has been sent to your email',
    })
  } catch (error) {
    console.error('Password reset code error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An internal server error occurred. Please try again later.',
    })
  }
})

authRoute.post('/reset-password-with-code', async (req, res) => {
  const { email, code, newPassword } = req.body

  if (!email || !code || !newPassword) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'Email, code, and new password are required',
    })
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User with this email address was not found',
      })
    }

    const resetRecord = await prisma.resetPassword.findFirst({
      where: {
        userId: user.id,
        id: code.trim(),
      },
    })

    if (!resetRecord) {
      return res.status(400).json({
        error: 'Invalid reset code',
        message: 'Invalid reset code. Please check the code and try again.',
      })
    }

    // Check if code is not older than 15 minutes
    const minutesSinceCreated = (Date.now() - resetRecord.createdAt.getTime()) / (1000 * 60)
    if (minutesSinceCreated > 15) {
      await prisma.resetPassword.delete({ where: { id: resetRecord.id } })
      return res.status(400).json({
        error: 'Reset code expired',
        message: 'Reset code has expired. Please request a new code.',
      })
    }

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword.trim()) },
    })

    // Delete reset record
    await prisma.resetPassword.delete({ where: { id: resetRecord.id } })

    return res.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    console.error('Reset password with code error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An internal server error occurred. Please try again later.',
    })
  }
})

authRoute.get('/resetPassword/confirm', async (req, res) => {
  const { token } = req.query
  if (token) {
    const resetPassword: Prisma.ResetPassword | null = await prisma.resetPassword.findFirst({
      where: {
        id: token as string,
      },
    })
    if (resetPassword) {
      const then = new Date(resetPassword.createdAt)
      const now = new Date()

      const msBetweenDates = Math.abs(then.getTime() - now.getTime())

      const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000)

      if (hoursBetweenDates < 24) {
        const formPage = fs
          .readFileSync(path.resolve(__dirname, '../public/Messaging/template/forget-password-form.html'), 'utf8')
          .replace('HOST_REPLACE', process.env.BACKEND_HOST!)
        res.setHeader('Content-type', 'text/html')
        res.end(formPage)
        return
      }
    }
    const expiredPage = fs.readFileSync(
      path.resolve(__dirname, '../public/Messaging/template/forget-password-expired.html'),
      'utf8'
    )
    res.setHeader('Content-type', 'text/html')
    res.end(expiredPage)
  }
  const expiredPage = fs.readFileSync(
    path.resolve(__dirname, '../public/Messaging/template/forget-password-expired.html'),
    'utf8'
  )
  res.setHeader('Content-type', 'text/html')
  res.end(expiredPage)
})

authRoute.post('/resetPassword/confirm', async (req, res) => {
  try {
    const { token } = req.query
    const { password } = req.body

    console.log('Reset password request received')

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ error: 'Password is required' })
    }

    const resetPassword: Prisma.ResetPassword | null = await prisma.resetPassword.findFirst({
      where: {
        id: token as string,
      },
    })

    if (!resetPassword) {
      return res.status(400).json({ error: 'Invalid or expired token' })
    }

    const then = new Date(resetPassword.createdAt)
    const now = new Date()
    const msBetweenDates = Math.abs(then.getTime() - now.getTime())
    const hoursBetweenDates = msBetweenDates / (60 * 60 * 1000)

    if (hoursBetweenDates >= 24) {
      await prisma.resetPassword.delete({
        where: { id: token as string },
      })
      return res.status(400).json({ error: 'Token expired' })
    }

    // Update password
    await prisma.user.update({
      data: {
        password: await hashPassword(password.trim()),
      },
      where: {
        id: resetPassword.userId,
      },
    })

    // Delete reset token
    await prisma.resetPassword.delete({
      where: {
        id: token as string,
      },
    })

    res.status(200).json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

authRoute.post('/resend-verification', async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({
      error: 'Email is required',
      message: 'Email address is required',
    })
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        email: String(email).toLowerCase().trim(),
        profileType: 'local',
      },
    })

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User with this email address was not found',
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email already verified',
        message: 'Email is already verified',
      })
    }

    // Check rate limiting - max 1 email per minute
    const lastVerification = await prisma.emailVerification.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    if (lastVerification && Date.now() - lastVerification.createdAt.getTime() < 60000) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Please wait 1 minute before requesting another email',
      })
    }

    // Delete old verification tokens
    await prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    })

    // Create new verification code
    const verificationCode = CodeGenerator.generateVerificationCode()

    // Save new verification code to database
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        code: verificationCode,
      },
    })

    // Send verification email
    const templateVars = {
      user_name: user.name,
      verification_code: verificationCode,
    }
    sendEmail(
      'email-verification',
      templateVars,
      user.email,
      'emailVerification',
      (user.language || 'PL').toLowerCase()
    )

    return res.status(200).json({
      success: true,
      message: 'Verification email has been sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An internal server error occurred. Please try again later.',
    })
  }
})

authRoute.post('/verify-code', async (req, res) => {
  const { email, code } = req.body

  if (!email || !code) {
    return res.status(400).json({
      error: 'Email and code are required',
      message: 'Email and verification code are required',
    })
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User with this email address was not found',
      })
    }

    const verification = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        code: code.trim(),
      },
      include: { user: true },
    })

    if (!verification) {
      return res.status(400).json({
        error: 'Invalid verification code',
        message: 'Invalid verification code. Please check the code and try again.',
      })
    }

    // Check if code is not older than 5 minutes
    const minutesSinceCreated = (Date.now() - verification.createdAt.getTime()) / (1000 * 60)
    if (minutesSinceCreated > 5) {
      await prisma.emailVerification.delete({ where: { id: verification.id } })
      return res.status(400).json({
        error: 'Verification code expired',
        message: 'Verification code has expired. Please request a new code.',
      })
    }

    // Verify email and upgrade role for mobile users
    let updatedRoles = user.roles
    if (
      user.roles.includes('NEW_USER') &&
      (user.registrationSource === 'MOBILE_CLIENT' || user.registrationSource === 'WEB_CLIENT')
    ) {
      updatedRoles = ['CLIENT']
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        roles: updatedRoles,
      },
    })

    // Delete verification code
    await prisma.emailVerification.delete({ where: { id: verification.id } })

    // Award referral points for CLIENT users
    if (updatedRoles.includes('CLIENT')) {
      const { ReferralService } = await import('../Referral/service/ReferralService')
      await ReferralService.awardReferralPoints(user.id, 'CLIENT_ACTIVE')
    }

    // Generate JWT token
    const token = generateJWT(updatedUser)

    // Return user info with token
    const { password, ...userInfo } = updatedUser
    return res.json({
      success: true,
      message: 'Email verified successfully',
      token: {
        access_token: token,
        type: 'Bearer',
      },
      user: userInfo,
    })
  } catch (error) {
    console.error('Code verification error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An internal server error occurred. Please try again later.',
    })
  }
})

authRoute.get('/verification-status/:email', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.params.email },
      select: { emailVerified: true },
    })
    res.json({ verified: user?.emailVerified || false })
  } catch (error) {
    res.status(500).json('Internal server error')
  }
})

authRoute.get('/check-user/:email', async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: req.params.email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        roles: true,
        registrationSource: true,
        emailVerified: true,
      },
    })

    if (user) {
      res.json({
        exists: true,
        user: {
          roles: user.roles,
          registrationSource: user.registrationSource,
          emailVerified: user.emailVerified,
        },
      })
    } else {
      res.json({ exists: false })
    }
  } catch (error) {
    res.status(500).json('Internal server error')
  }
})

authRoute.get('/login/facebook', (req, res, next) => {
  const redirectUrl = req.query.redirect as string
  const registrationSource = req.query.registrationSource as string
  const stateData = JSON.stringify({ redirect: redirectUrl, registrationSource })
  const state = encodeURIComponent(stateData)
  passport.authenticate('facebook', { state: state })(req, res, next)
})

authRoute.get(
  '/login/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    console.log('facebook callback')
    if (req.user) {
      const token = req.user as string
      res.cookie('facebook_provider', token)

      let redirectParam = ''
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state as string))
          redirectParam = stateData.redirect || ''
        } catch {
          redirectParam = decodeURIComponent(req.query.state as string)
        }
      }

      // Determine which frontend app to redirect to based on registrationSource
      let frontendUrl = process.env.FRONT_END_APP_URL!
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state as string))
          if (stateData.registrationSource === 'WEB_MERCHANT' || stateData.registrationSource === 'MOBILE_MERCHANT') {
            frontendUrl = process.env.FRONT_END_MERCHANT_URL!
          }
        } catch {
          // Use default client URL
        }
      }

      const redirectUrl = redirectParam
        ? `${frontendUrl}/${redirectParam}?type=SUCCESS&token=${token}`
        : `${frontendUrl}?type=SUCCESS&token=${token}`

      console.log('facebook_login, redirect: ', redirectUrl)
      return res.redirect(303, redirectUrl)
    }
    return res.status(400).json({ message: 'User not found' })
  }
)

authRoute.get('/login/google', (req, res, next) => {
  const redirectUrl = req.query.redirect as string
  const registrationSource = req.query.registrationSource as string
  const mobile = req.query.mobile as string

  // For mobile, use MOBILE_CLIENT as registrationSource
  const finalRegistrationSource = mobile === 'true' ? 'MOBILE_CLIENT' : registrationSource

  const stateData = JSON.stringify({ redirect: redirectUrl, registrationSource: finalRegistrationSource })
  const state = encodeURIComponent(stateData)
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state,
  })(req, res, next)
})

authRoute.get(
  '/login/google/return',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    if (req.user) {
      const token = req.user as string

      // Check if this is a mobile request
      let isMobileRequest = false
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state as string))
          isMobileRequest = stateData.registrationSource === 'MOBILE_CLIENT'
        } catch {
          // Ignore parsing errors
        }
      }

      // For mobile requests, return JSON with user data
      if (isMobileRequest) {
        try {
          // Decode JWT to get user data
          const jwt = require('jsonwebtoken')
          const decoded = jwt.decode(token) as any
          const userData = decoded?.user

          if (userData) {
            return res.json({
              success: true,
              token: {
                access_token: token,
                type: 'Bearer',
              },
              user: {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                firstName: userData.firstName,
                surname: userData.surname,
                picture: userData.picture,
                roles: userData.roles,
                profileType: userData.profileType,
                registrationSource: userData.registrationSource,
              },
            })
          }
        } catch (error) {
          console.error('Error decoding JWT for mobile response:', error)
        }

        // Fallback mobile response
        return res.json({
          success: true,
          token: {
            access_token: token,
            type: 'Bearer',
          },
          user: {},
        })
      }

      res.cookie('google_provider', token)

      let redirectParam = ''
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state as string))
          redirectParam = stateData.redirect || ''
        } catch {
          redirectParam = decodeURIComponent(req.query.state as string)
        }
      }

      // Determine which frontend app to redirect to based on registrationSource
      let frontendUrl = process.env.FRONT_END_APP_URL!
      if (req.query.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state as string))
          if (stateData.registrationSource === 'WEB_MERCHANT' || stateData.registrationSource === 'MOBILE_MERCHANT') {
            frontendUrl = process.env.FRONT_END_MERCHANT_URL!
          }
        } catch {
          // Use default client URL
        }
      }

      const redirectUrl = redirectParam
        ? `${frontendUrl}/${redirectParam}?type=SUCCESS&token=${token}`
        : `${frontendUrl}?type=SUCCESS&token=${token}`

      return res.redirect(303, redirectUrl)
    }
    return res.status(400).json({ message: 'User not found' })
  }
)

authRoute.post('/login/apple', passport.authenticate('strategy-apple', { failureRedirect: '/login' }), function (
  req: any,
  res
) {
  if (req.user) {
    return res.status(200).json({ token: req.user })
  }
  return res.status(400).json({ message: 'User not found' })
})
//
// authRoute.post('/login/apple', async (req, res, next) => {
//   passport.authenticate('strategy-apple', async (err, token) => {
//     console.log('apple request', req)
//     if (token) {
//       return res.status(200).json({ token })
//     }
//     return res.status(400).json({ message: 'User not found' })
//   })
// })

// authRoute.post('/login/apple', passport.authenticate('apple'), (req, res) => {
//   console.log('apple request', req)
//   if (req.user) {
//     res.cookie('google_provider', req.user)
//     return res.status(200).json({ token: req.user })
//   }
//   return res.status(400).json({ message: 'User not found' })
// })

//
// authRoute.get('/auth/apple', passport.authenticate('apple'))
//
// authRoute.post('/auth/apple', passport.authenticate('apple'))
//
// authRoute.post(
//   '/auth/apple/callback',
//   express.urlencoded(),
//   passport.authenticate('apple', { failureRedirect: '/login' }),
//   (req, res) => {
//     if (req.user) {
//       console.log('apple_provider1,', req, req.user)
//       res.cookie('apple_provider', req.user)
//       return res.redirect(303, `${process.env.FRONT_END_APP_URL!}?type=SUCCESS&token=${req.user}=endtoken`)
//     }
//     console.log('apple_provider1,', req)
//     return res.status(400).json({ message: 'User not found' })
//   }
// )
// ── Phone Auth (Firebase) ─────────────────────────────────────────────────────

// Register with phone number
authRoute.post('/register/phone', async (req, res) => {
  try {
    const { idToken, name, firstName, surname, loginContext, referralCode, registrationSource } = req.body

    if (!idToken) return res.status(400).json({ message: 'idToken is required' })
    if (!loginContext) return res.status(400).json({ message: 'loginContext is required' })

    // Verify Firebase token
    const firebaseAdmin = require('firebase-admin')
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
    const phoneNumber = decodedToken.phone_number

    if (!phoneNumber) return res.status(400).json({ message: 'Token does not contain phone number' })

    // Check if phone already exists
    const existing = await prisma.user.findFirst({ where: { phone: phoneNumber } })
    if (existing) return res.status(409).json({ message: 'Phone number already registered' })

    const user = await prisma.user.create({
      data: {
        email: `${phoneNumber}@phone.bonapka`,
        password: '',
        phone: phoneNumber,
        name: name || firstName || phoneNumber,
        firstName: firstName || '',
        surname: surname || '',
        roles: ['NEW_USER'],
        registrationSource: registrationSource || 'MOBILE',
        profileType: 'phone',
        emailVerified: true,
      },
    })

    const token = generateJWT(user as any)
    return res.json({
      message: 'Registration successful',
      token,
      user: { id: user.id, phone: user.phone, roles: user.roles },
    })
  } catch (err: any) {
    console.error('Phone register error:', err)
    return res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

// Login with phone number
authRoute.post('/login/phone', async (req, res) => {
  try {
    const { idToken, loginContext } = req.body

    if (!idToken) return res.status(400).json({ message: 'idToken is required' })
    if (!loginContext) return res.status(400).json({ message: 'loginContext is required' })

    // Verify Firebase token
    const firebaseAdmin = require('firebase-admin')
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
    const phoneNumber = decodedToken.phone_number

    if (!phoneNumber) return res.status(400).json({ message: 'Token does not contain phone number' })

    const user = await prisma.user.findFirst({ where: { phone: phoneNumber } })
    if (!user) return res.status(404).json({ message: 'User not found. Please register first.' })

    const token = generateJWT(user as any)
    return res.json({ message: 'Login successful', token, user: { id: user.id, phone: user.phone, roles: user.roles } })
  } catch (err: any) {
    console.error('Phone login error:', err)
    return res.status(500).json({ message: err.message || 'Login failed' })
  }
})

// ── Phone Auth (Backend SMS) ──────────────────────────────────────────────────

import { PhoneSmsService } from './PhoneSmsService'

// Send SMS verification code
authRoute.post('/phone/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        message: 'Phone number is required',
      })
    }

    const result = await PhoneSmsService.sendVerificationCode(phoneNumber)

    if (!result.success) {
      return res.status(400).json(result)
    }

    return res.json(result)
  } catch (error) {
    console.error('Send SMS code error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to send verification code',
    })
  }
})

// Verify SMS code and login/register
authRoute.post('/phone/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and code are required',
        message: 'Phone number and verification code are required',
      })
    }

    const result = await PhoneSmsService.verifyCode(phoneNumber, code)

    if (!result.success || !result.user) {
      return res.status(400).json({
        success: false,
        error: result.message || 'Verification failed',
        message: result.message || 'Invalid verification code',
      })
    }

    // Generate JWT token
    const token = generateJWT(result.user as any)

    return res.json({
      success: true,
      isNewUser: result.isNewUser,
      token: {
        access_token: token,
        type: 'Bearer',
      },
      user: {
        id: result.user.id,
        phone: result.user.phone,
        name: result.user.name,
        firstName: result.user.firstName,
        surname: result.user.surname,
        roles: result.user.roles,
        profileType: result.user.profileType,
        registrationSource: result.user.registrationSource,
      },
    })
  } catch (error) {
    console.error('Verify SMS code error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify code',
    })
  }
})

export default authRoute
