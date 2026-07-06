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
