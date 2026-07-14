import { Resolver, Mutation, Arg, Ctx, Query, Authorized, ObjectType, Field } from 'type-graphql';
import { User, Language } from '@prisma/client';
import { hashPassword, validatePassword, generateAccessToken, generateRefreshToken } from '../auth/PasswordUtil';
import { TwilioService } from '../services/TwilioService';
import { CodeGenerator } from '../shared/utils/CodeGenerator';
import { Context } from '../types/Context';
import { UserType } from '../types/UserType';
import { OAuth2Client } from 'google-auth-library';

/**
 * Authentication Response
 */
@ObjectType()
class AuthResponse {
  @Field()
  accessToken!: string;

  @Field()
  refreshToken!: string;

  @Field(() => UserType)
  user!: UserType;
}

/**
 * Authentication Resolver
 *
 * Handles:
 * - Email/Password registration and login
 * - OTP/Phone authentication via Twilio
 * - Token refresh
 * - Password reset
 */
@Resolver()
export class AuthResolver {
  /**
   * Register new user with email and password
   */
  @Mutation(() => AuthResponse)
  async register(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Arg('name', { nullable: true }) name?: string,
    @Arg('phone', { nullable: true }) phone?: string,
    @Arg('language', () => Language, { defaultValue: Language.PL }) language: Language = Language.PL,
    @Ctx() { prisma }: Context
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Web registration lives in the CLIENT namespace.
    const existingUser = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType: 'CLIENT' } },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Check if phone already exists in the CLIENT namespace (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone_accountType: { phone, accountType: 'CLIENT' } },
      });

      if (existingPhone) {
        throw new Error('Phone number already registered');
      }
    }

    // Hash password with bcrypt (12 rounds)
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone,
        language,
        roles: ['CLIENT'],
        emailVerified: false,
        phoneVerified: false,
        registrationSource: 'WEB_CLIENT',
        // Generate referral code
        referralCode: {
          create: {
            code: CodeGenerator.generateReferralCode(name || email),
          },
        },
        // Initialize point balance
        pointBalance: {
          create: {
            totalPoints: 0,
            availablePoints: 0,
            lockedPoints: 0,
          },
        },
      },
      include: {
        referralCode: true,
        pointBalance: true,
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log(`✅ New user registered: ${user.email}`);

    return { accessToken, refreshToken, user };
  }

  /**
   * Login with email and password
   */
  @Mutation(() => AuthResponse)
  async login(
    @Arg('email') email: string,
    @Arg('password') password: string,
    @Ctx() { prisma }: Context
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // Find user (web login → CLIENT namespace)
    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType: 'CLIENT' } },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Validate password
    const isValid = await validatePassword(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    console.log(`✅ User logged in: ${user.email}`);

    return { accessToken, refreshToken, user };
  }

  /**
   * Login/register with Google on the WEB.
   *
   * The browser uses Google Identity Services (GIS) which yields an ID token
   * directly (no serverAuthCode exchange, so no client secret is needed here).
   * We verify the ID token against GOOGLE_CLIENT_ID and upsert a CLIENT user.
   */
  @Mutation(() => AuthResponse)
  async loginWithGoogle(
    @Arg('idToken') idToken: string,
    @Ctx() { prisma }: Context
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error('Google login is not configured');
    }

    // Verify the ID token issued to our web client.
    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch {
      throw new Error('Invalid Google token');
    }
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token');
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const name = payload.name || email.split('@')[0];
    const firstName = payload.given_name || undefined;
    const surname = payload.family_name || undefined;
    const profilePicture = payload.picture || undefined;

    // Web accounts live in the CLIENT namespace; match by email or googleId.
    let user = await prisma.user.findFirst({
      where: {
        accountType: 'CLIENT',
        OR: [{ email }, { googleId }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: await hashPassword(CodeGenerator.generateRandomString(32)),
          googleId,
          name,
          firstName,
          surname,
          profilePicture,
          roles: ['CLIENT'],
          emailVerified: true,
          phoneVerified: false,
          registrationSource: 'WEB_CLIENT',
          language: Language.PL,
          referralCode: {
            create: { code: CodeGenerator.generateReferralCode(name || email) },
          },
          pointBalance: {
            create: { totalPoints: 0, availablePoints: 0, lockedPoints: 0 },
          },
        },
      });
      console.log(`✅ New user created via Google (web): ${user.email}`);
    } else if (!user.googleId) {
      // Link the Google identity to an existing email account.
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, emailVerified: true },
      });
      console.log(`✅ Linked Google to existing user (web): ${user.email}`);
    } else {
      console.log(`✅ User logged in via Google (web): ${user.email}`);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { accessToken, refreshToken, user };
  }

  /**
   * Send OTP to phone number
   */
  @Mutation(() => Boolean)
  async sendOTP(
    @Arg('phone') phone: string,
    @Arg('language', { defaultValue: 'pl' }) language: 'pl' | 'en' | 'ua'
  ): Promise<boolean> {
    const result = await TwilioService.sendOTP(phone, language);

    if (!result.success) {
      throw new Error(result.message);
    }

    return true;
  }

  /**
   * Verify OTP and login/register user
   */
  @Mutation(() => AuthResponse)
  async verifyOTP(
    @Arg('phone') phone: string,
    @Arg('code') code: string,
    @Ctx() { prisma }: Context
  ): Promise<{ accessToken: string; refreshToken: string; user: User; isNewUser: boolean }> {
    // Verify OTP code
    const verification = await TwilioService.verifyOTP(phone, code);

    if (!verification.success) {
      throw new Error(verification.message);
    }

    // Check if user exists (web phone auth → CLIENT namespace)
    let user = await prisma.user.findUnique({
      where: { phone_accountType: { phone, accountType: 'CLIENT' } },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user with phone
      user = await prisma.user.create({
        data: {
          email: `${phone.replace('+', '')}@phone.gelato.app`,
          password: await hashPassword(CodeGenerator.generateRandomString(32)), // Random password
          phone,
          name: phone,
          roles: ['CLIENT'],
          phoneVerified: true,
          emailVerified: false,
          language: Language.PL,
          registrationSource: 'MOBILE_CLIENT',
          referralCode: {
            create: {
              code: CodeGenerator.generateReferralCode(phone),
            },
          },
          pointBalance: {
            create: {
              totalPoints: 0,
              availablePoints: 0,
              lockedPoints: 0,
            },
          },
        },
      });
      isNewUser = true;

      console.log(`✅ New user created via OTP: ${phone}`);
    } else {
      // Mark phone as verified
      if (!user.phoneVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }

      console.log(`✅ User logged in via OTP: ${phone}`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return { accessToken, refreshToken, user, isNewUser };
  }

  /**
   * Get current authenticated user
   */
  @Authorized()
  @Query(() => UserType)
  async me(@Ctx() { req }: Context): Promise<UserType> {
    if (!req.user) {
      throw new Error('Not authenticated');
    }

    return req.user as UserType;
  }

  /**
   * Refresh access token
   */
  @Mutation(() => String)
  async refreshToken(
    @Arg('refreshToken') refreshToken: string,
    @Ctx() { prisma }: Context
  ): Promise<string> {
    try {
      const { verifyRefreshToken } = require('../auth/PasswordUtil');
      const payload = verifyRefreshToken(refreshToken);

      // Find user and check tokenVersion
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      return generateAccessToken(user);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Logout (invalidate all tokens for user)
   */
  @Authorized()
  @Mutation(() => Boolean)
  async logout(@Ctx() { req, prisma }: Context): Promise<boolean> {
    if (!req.user) {
      throw new Error('Not authenticated');
    }

    // Increment tokenVersion to invalidate all tokens
    await prisma.user.update({
      where: { id: req.user.id },
      data: { tokenVersion: { increment: 1 } },
    });

    console.log(`✅ User logged out: ${req.user.email}`);

    return true;
  }
}
