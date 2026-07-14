import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as FacebookStrategy } from 'passport-facebook'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as CustomStrategy } from 'passport-custom'

import { ExtractJwt, Strategy as JWTstrategy } from 'passport-jwt'
import { Request } from 'express'
// import * as fs from 'fs'
// import * as path from 'path'
import jwt_decode, { JwtPayload } from 'jwt-decode'
import prisma from '../shared/prisma'
import { Role } from '../User/objectType/Role'
import { generateJWT, hashPassword, validatePassword } from './PasswordUtil'
import { findOrCreateExternalProviderUser } from './AuthExternalUtil'
import { SignUpRequest } from './model/request/SignUpRequest'
import { LoginInfo } from './model/LoginInfo'
import { AppleProfile } from './model/AppleProfile'
import { LanguageCode } from '../shared/interface/LanguageCode'
import { generateAvatarForUser } from '../shared/service/avatarGeneration.service'
import { sendEmail } from '../shared/service/emailGeneration.service'
import { CodeGenerator } from '../shared/util/CodeGenerator'
import { ManagedUpload } from 'aws-sdk/clients/s3'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { ErrorWithStatus } from '../shared/interface/ErrorWithStatus'
import { ValidationUtil } from './ValidationUtil'

// Apple OAuth temporarily disabled
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const AppleStrategy = require('@nicokaiser/passport-apple').Strategy

const addPassportAuth = () => {
  passport.use(
    'signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (req: Request<any, any, SignUpRequest, any>, email, password, done) => {
        try {
          const {
            name: nameBody,
            firstName: firstNameBody,
            surname: surnameBody,
            gender,
            language,
            referralCode,
            registrationSource,
          } = req.body

          // Validate email format
          const emailValidation = ValidationUtil.validateEmail(email)
          if (!emailValidation.isValid) {
            return done({
              status: 400,
              message: emailValidation.message,
            })
          }

          // Check if email already exists
          const existingUser = await prisma.user.findFirst({
            where: {
              email: String(email).toLowerCase().trim(),
            },
          })

          if (existingUser) {
            if (existingUser.profileType === 'local' && !existingUser.emailVerified) {
              return done(
                new ErrorWithStatus(
                  409,
                  'An account with this email is pending verification. You can request a new code on the verification screen.',
                  'EMAIL_EXISTS_UNVERIFIED'
                )
              )
            }
            return done(
              new ErrorWithStatus(
                409,
                'Account with this email already exists. Please log in.',
                'EMAIL_EXISTS_VERIFIED'
              )
            )
          }

          // Validate password strength
          const passwordValidation = ValidationUtil.validatePassword(password)
          if (!passwordValidation.isValid) {
            return done({
              status: 400,
              message: passwordValidation.message,
            })
          }

          // Build name from firstName and surname if not provided
          const firstName = firstNameBody || nameBody?.split(' ')?.[0] || ''
          const surname = surnameBody || nameBody?.split(' ')?.[1] || ''
          const name = nameBody?.trim() || `${firstName} ${surname}`.trim() || email.split('@')[0]
          const user = await prisma.user.create({
            data: {
              email: String(email).toLowerCase().trim(),
              password: await hashPassword(password),
              roles: [Role.NEW_USER],
              registrationSource,
              name,
              firstName,
              surname,
              gender,
              language: language || LanguageCode.PL,
              profileType: 'local',
              emailVerified: process.env.ENVIRONMENT === 'LOCAL' ? true : false, // Skip email verification in local
            },
          })
          // Avatar generation temporarily disabled
          // if (process.env.ENVIRONMENT !== 'LOCAL') {
          //   try {
          //     const avatar: void | ManagedUpload.SendData | null = await generateAvatarForUser(user)
          //     if (avatar && 'Location' in avatar) {
          //       await prisma.user.update({
          //         where: {
          //           id: user.id,
          //         },
          //         data: {
          //           picture: avatar.Location,
          //         },
          //       })
          //     }
          //   } catch (error) {
          //     console.log('Avatar generation skipped in local development')
          //   }
          // }

          // Handle email verification based on environment
          if (process.env.ENVIRONMENT !== 'LOCAL') {
            // Create email verification code
            const verificationCode = CodeGenerator.generateVerificationCode()
            const verificationToken = await prisma.emailVerification.create({
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

            try {
              await sendEmail(
                'email-verification',
                templateVars,
                user.email,
                'emailVerification',
                (user.language || 'PL').toLowerCase()
              )
            } catch (emailError) {
              // If email fails, cleanup user and verification token
              await prisma.emailVerification.delete({ where: { id: verificationToken.id } })
              await prisma.user.delete({ where: { id: user.id } })
              throw new Error('Failed to send verification email')
            }
          } else {
            console.log(`\n✅ LOCAL DEV - Email auto-verified for ${user.email}\n`)
            // Note: Referral points will be awarded later based on user's final role
          }

          // Handle referral code if provided (points awarded later after verification)
          if (referralCode) {
            const referralCodeRecord = await prisma.userReferralCode.findUnique({
              where: { code: referralCode },
            })

            if (referralCodeRecord && referralCodeRecord.userId !== user.id) {
              // Check if this email was already referred before
              const baseEmail = String(email).toLowerCase().trim()
              const existingReferral = await prisma.referral.findFirst({
                where: {
                  referrerId: referralCodeRecord.userId,
                  referredUser: {
                    OR: [{ email: baseEmail }, { email: `${baseEmail}-google` }, { email: `${baseEmail}-facebook` }],
                  },
                },
              })

              if (!existingReferral) {
                await prisma.referral.create({
                  data: {
                    referrerId: referralCodeRecord.userId,
                    referredUserId: user.id,
                    referralCode: referralCode,
                    pointsAwarded: 0,
                    isCompleted: false,
                  },
                })
              }
            }
          }

          return done(null, user)
        } catch (error: any) {
          if (error?.code === 'P2002') {
            return done(new ErrorWithStatus(409, 'ACCOUNT_EXISTS_LOGIN_REQUIRED', 'EMAIL_EXISTS_VERIFIED'))
          }
          console.error(error.message)
          return done(error)
        }
      }
    )
  )

  passport.use(
    'login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const user = await prisma.user.findFirst({
            where: {
              email,
            },
          })

          if (!user) {
            return done(null, false, { message: LoginInfo.USER_NOT_FOUND })
          }

          const validate = await validatePassword(user, password)

          if (!validate) {
            return done(null, false, { message: LoginInfo.WRONG_PASSWORD })
          }

          // Get login context from request
          const { loginContext } = req.body // 'WEB_MERCHANT' | 'MOBILE_CLIENT'

          if (!loginContext) {
            return done(null, false, { message: 'LOGIN_CONTEXT_REQUIRED' })
          }

          // Validate loginContext value
          if (!['WEB_MERCHANT', 'WEB_CLIENT', 'MOBILE_MERCHANT', 'MOBILE_CLIENT'].includes(loginContext)) {
            return done(null, false, { message: 'LOGIN_CONTEXT_REQUIRED' })
          }

          // Handle role-based login logic
          const loginResult = await handleRoleBasedLogin(user, loginContext)

          if (loginResult.requiresAction) {
            return done(null, false, {
              message: loginResult.message,
              action: loginResult.action,
              user: loginResult.user,
            } as any)
          }

          // Auto-assign roles if needed
          if (loginResult.updatedUser) {
            const successInfo: any = { message: LoginInfo.LOGIN_SUCCESS }
            if (loginResult.firstMobileLogin) {
              successInfo.firstMobileLogin = true
              successInfo.welcomeMessage = loginResult.welcomeMessage
            }
            if (loginResult.requiresCompanyRegistration) {
              successInfo.requiresCompanyRegistration = true
            }
            return done(null, loginResult.updatedUser, successInfo)
          }

          return done(null, user, { message: LoginInfo.LOGIN_SUCCESS })
        } catch (error) {
          return done(error)
        }
      }
    )
  )

  // Apple OAuth temporarily disabled due to missing @panva/asn1.js dependency
  // passport.use(
  //   'strategy-apple',
  //   new CustomStrategy(function (req, done) {
  //     const {
  //       body: { profile, identityToken },
  //     } = req
  //     const { provider } = profile as AppleProfile
  //     const decoded: JwtPayload = jwt_decode(identityToken) as JwtPayload
  //     if (provider === process.env.APPLE_PROFILE && decoded.aud === process.env.APPLE_CLIENT_ID) {
  //       findOrCreateExternalProviderUser(profile as AppleProfile, done).catch((error) => {
  //         console.error('Apple error: ', error)
  //         done(error)
  //       })
  //     } else {
  //       done('Unauthorized user ')
  //       console.error('Unauthorized user by apple Api', profile, identityToken)
  //     }
  //   })
  // )

  passport.use(
    new JWTstrategy(
      {
        secretOrKey: process.env.BE_JWT,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      },
      async (token: any, done: any) => {
        try {
          return done(null, token.user)
        } catch (error) {
          return done(error)
        }
      }
    )
  )

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID as string,
        clientSecret: process.env.FACEBOOK_APP_SECRET as string,
        callbackURL: process.env.FACEBOOK_CALLBACK as string,
        enableProof: true,
        passReqToCallback: true,
        profileFields: ['id', 'emails', 'name', 'displayName', 'gender', 'picture.type(large)'],
      },
      async (req, accessToken, refreshToken, profile, done) => {
        // console.log('facebook', accessToken)
        console.log('facebook', profile)
        findOrCreateExternalProviderUser(profile, done, req).catch((error) => {
          console.error('Facebook login error: ', error)
          done(error)
        })
      }
    )
  )

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_APP_ID as string,
        clientSecret: process.env.GOOGLE_APP_SECRET as string,
        callbackURL: process.env.GOOGLE_CALLBACK as string,
        passReqToCallback: true,
        scope: ['profile', 'email', 'openid'], // Dodaj wymagane scope'y
      },
      (request, accessToken, refreshToken, profile, done) => {
        console.log('Google Strategy - profile:', JSON.stringify(profile, null, 2))
        console.log('Google Strategy - accessToken:', accessToken ? 'Present' : 'Missing')

        findOrCreateExternalProviderUser(profile, done, request).catch((error) => {
          console.error('Google login error: ', error)
          done(error)
        })
      }
    )
  )

  // passport.use(
  //   new AppleStrategy(
  //     {
  //       clientID: process.env.APPLE_CLIENT_ID, // Services ID
  //       teamID: process.env.APPLE_TEAM_ID, // Team ID of your Apple Developer Account
  //       keyID: process.env.APPLE_KEY_ID, // Key ID, received from https://developer.apple.com/account/resources/authkeys/list
  //       key: fs.readFileSync(path.resolve(__dirname, `../public/certificate/${process.env.APPLE_CERTIFICATE!}.p8`)), // Private key, downloaded from https://developer.apple.com/account/resources/authkeys/list
  //       scope: ['name', 'email'],
  //       callbackURL: process.env.APPLE_CALLBACK,
  //     },
  //     // @ts-ignore
  //     (accessToken, refreshToken, profile, done) => {
  //       console.log('apple accessToken', accessToken)
  //       console.log('apple refreshToken', refreshToken)
  //       console.log('apple profile', profile)
  //       console.log('apple done', done)
  //
  //       findOrCreateExternalProviderUser(profile, done).catch((error) => {
  //         console.error('Apple login error: ', error)
  //         done(error)
  //       })
  //     }
  //   )
  // )

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
      },
      async (username, password, done) => {
        const findUser = async () => {
          // Look up user by email

          console.log(`local user: ${username}, hasPassword: ${!!password}`)
          const user = await prisma.user.findFirst({
            where: { email: username },
          })

          if (!user) return done(new Error('Authentication failed. User not found.'))

          if (await validatePassword(user, user.password)) {
            return done(null, generateJWT(user))
          }
          return done(new Error(`passwords do not match for user ${username}.`))
        }

        findUser().catch(done)
      }
    )
  )

  passport.serializeUser(function (user, cb) {
    cb(null, user)
  })

  passport.deserializeUser(function (obj: any, cb: any) {
    cb(null, obj)
  })
}

// Role-based login logic
const handleRoleBasedLogin = async (user: any, loginContext: string) => {
  const { roles, registrationSource, emailVerified, profileType } = user

  console.log(
    `🔐 Login attempt: email=${user.email}, roles=[${roles.join(
      ','
    )}], registrationSource=${registrationSource}, loginContext=${loginContext}, emailVerified=${emailVerified}`
  )

  // ADMIN has full access - bypass all checks
  if (roles.includes('ADMIN')) {
    return { updatedUser: null }
  }

  // Check email verification for local users
  if (!emailVerified && profileType === 'local') {
    return {
      requiresAction: true,
      message: 'EMAIL_NOT_VERIFIED',
      action: 'VERIFY_EMAIL',
      user,
    }
  }

  // Handle NEW_USER role
  if (roles.includes('NEW_USER')) {
    console.log(
      `🔍 NEW_USER detected: registrationSource=${registrationSource}, loginContext=${loginContext}, emailVerified=${emailVerified}`
    )
    // Check what needs to be completed based on registrationSource
    if (registrationSource === 'WEB_MERCHANT' || registrationSource === 'MOBILE_MERCHANT') {
      if (loginContext === 'WEB_MERCHANT' || loginContext === 'MOBILE_MERCHANT') {
        // Check if user already has a company
        const existingCompany = await prisma.company.findUnique({
          where: { userId: user.id },
        })

        if (existingCompany) {
          console.log(`✅ User has company - allowing login`)
          // User has company, upgrade role and allow login
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { roles: ['OWNER'] },
          })
          return { updatedUser }
        }

        // Merchant registered user logging into merchant - allow login but indicate company registration needed
        if (emailVerified) {
          console.log(`✅ Allowing first login - COMPLETE_COMPANY_REGISTRATION needed but not blocking`)
          return {
            updatedUser: user, // Allow login with current user
            requiresCompanyRegistration: true, // Indicate company registration is needed
          }
        } else {
          console.log(`❌ Blocking login - EMAIL_NOT_VERIFIED`)
        }
      } else {
        // Client login for MERCHANT source - grant CLIENT role
        if (emailVerified) {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { roles: ['CLIENT'] },
          })

          // Award referral points for becoming a client
          const { ReferralService } = await import('../Referral/service/ReferralService')
          await ReferralService.awardReferralPoints(user.id, 'CLIENT_ACTIVE')

          return { updatedUser }
        }
      }
    } else if (registrationSource === 'WEB_CLIENT' || registrationSource === 'MOBILE_CLIENT') {
      if (loginContext === 'WEB_MERCHANT' || loginContext === 'MOBILE_MERCHANT') {
        // Client user wants to access merchant - upgrade to business
        if (emailVerified) {
          return {
            requiresAction: true,
            message: 'COMPLETE_BUSINESS_REGISTRATION',
            action: 'COMPLETE_COMPANY_DATA',
            user,
          }
        }
      } else {
        // Client login for CLIENT source - grant CLIENT role
        if (emailVerified) {
          const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { roles: ['CLIENT'] },
          })

          // Award referral points for becoming a client
          const { ReferralService } = await import('../Referral/service/ReferralService')
          await ReferralService.awardReferralPoints(user.id, 'CLIENT_ACTIVE')

          return { updatedUser }
        }
      }
    }
  }

  // Handle login context requirements
  if (loginContext === 'WEB_MERCHANT' || loginContext === 'MOBILE_MERCHANT') {
    // Merchant login - allow CLIENT to login but with limited access
    if (!roles.includes('OWNER') && !roles.includes('COOPERATOR')) {
      if (roles.includes('CLIENT')) {
        // CLIENT can login to merchant but needs to complete company registration
        return {
          updatedUser: user, // Return user with token
          requiresCompanyRegistration: true,
        }
      }
      return {
        requiresAction: true,
        message: 'COMPLETE_BUSINESS_REGISTRATION',
        action: 'COMPLETE_COMPANY_DATA',
        user,
      }
    }
    // Has OWNER or COOPERATOR - direct access
    return { updatedUser: null }
  }

  if (loginContext === 'WEB_CLIENT' || loginContext === 'MOBILE_CLIENT') {
    // Client login requires CLIENT role
    if (!roles.includes('CLIENT')) {
      // Auto-add CLIENT role for OWNER/COOPERATOR
      if (roles.includes('OWNER') || roles.includes('COOPERATOR')) {
        const newRoles = [...roles, 'CLIENT']
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { roles: newRoles },
        })

        return {
          updatedUser,
          firstMobileLogin: loginContext === 'MOBILE_CLIENT',
          welcomeMessage:
            loginContext === 'MOBILE_CLIENT'
              ? `Witamy w aplikacji klienckiej, ${user.firstName || user.name}! 🎉`
              : undefined,
        }
      }
    }
    // Has CLIENT - direct access
    return { updatedUser: null }
  }

  return { updatedUser: null }
}

export default addPassportAuth
