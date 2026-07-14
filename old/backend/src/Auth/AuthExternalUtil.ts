import { Prisma } from '@prisma/client'
import { Profile as GoogleProfil } from 'passport-google-oauth20'
import { Profile as FacebookProfile } from 'passport-facebook'
import prisma from '../shared/prisma'
import { Role } from '../User/objectType/Role'
import { generateJWT } from './PasswordUtil'
import { AppleProfile } from './model/AppleProfile'
import { ManagedUpload } from 'aws-sdk/clients/s3'
import { generateAvatarForUser } from '../shared/service/avatarGeneration.service'

export const findOrCreateExternalProviderUser = async (
  profile: GoogleProfil | FacebookProfile | AppleProfile,
  done: any,
  req?: any
) => {
  console.log('findOrCreateExternalProviderUser called with profile:', JSON.stringify(profile, null, 2))

  if (profile) {
    // Look up user by profile id
    console.log('profile', profile)
    let user = await prisma.user.findFirst({
      where: {
        AND: {
          profileType: profile.provider,
          profileId: profile.id,
        },
      },
    })

    console.log('find user', user)
    // Create a new user in the user table if not found
    if (!user) {
      const email: string = profile.emails && profile.emails!.length > 0 ? profile.emails![0].value : ''
      const picture = profile.photos ? profile.photos[0].value : undefined
      console.log(`no user, create new one with email: ${email} and picture: ${picture}`)
      const newEmail = email && email.length > 0 ? `${email}-${profile.provider}` : `${profile.provider}-${Date.now()}`

      // Extract registrationSource and referralCode from state if available
      let registrationSource = null
      let referralCode = null
      if (req?.query?.state) {
        try {
          const stateData = JSON.parse(decodeURIComponent(req.query.state))
          registrationSource = stateData.registrationSource
          referralCode = stateData.referralCode
        } catch {
          // Ignore parsing errors
        }
      }

      // Determine role based on registrationSource
      let roles: Role[]
      if (registrationSource === 'MOBILE_CLIENT' || registrationSource === 'WEB_CLIENT') {
        roles = [Role.CLIENT]
      } else if (registrationSource === 'MOBILE_MERCHANT' || registrationSource === 'WEB_MERCHANT') {
        roles = [Role.NEW_USER] // Will upgrade to OWNER after company registration
      } else {
        // Default to CLIENT for OAuth users without explicit source
        roles = [Role.CLIENT]
      }

      const newUser: Prisma.UserCreateInput = {
        name: profile.displayName,
        email: newEmail,
        password: '',
        profileId: profile.id,
        profileType: profile.provider,
        gender: 'gender' in profile ? profile.gender : '',
        roles,
        registrationSource,
        firstName: profile.name?.givenName || '',
        surname: profile.name?.familyName || '',
        picture,
        emailVerified: true, // OAuth users are pre-verified
      }
      user = await prisma.user.create({
        data: newUser,
      })

      // Handle referral code if provided (points awarded later after verification)
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
        }
      }

      // Award referral points for CLIENT users immediately
      if (
        (registrationSource === 'MOBILE_CLIENT' || registrationSource === 'WEB_CLIENT' || !registrationSource) &&
        referralCode
      ) {
        const { ReferralService } = await import('../Referral/service/ReferralService')
        await ReferralService.awardReferralPoints(user.id, 'CLIENT_ACTIVE')
      }

      // Note: For other registration sources, referral points will be awarded later based on user's final role
      // - CLIENT points after role assignment
      // - MERCHANT points after company creation

      // Avatar generation temporarily disabled
      // if (!picture) {
      //   const avatar: void | ManagedUpload.SendData | null = await generateAvatarForUser(user)
      //   if (avatar && 'Location' in avatar) {
      //     await prisma.user.update({
      //       where: {
      //         id: user.id,
      //       },
      //       data: {
      //         picture: avatar.Location,
      //       },
      //     })
      //   }
      // }

      console.log('created user', user)
    }

    // Return the JWT token
    const userWithToken = generateJWT(user)
    done(null, userWithToken)
  }
}
