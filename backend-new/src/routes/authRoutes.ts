import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient, Language } from '@prisma/client';
import { generateAccessToken, generateRefreshToken, hashPassword, validatePassword } from '../auth/PasswordUtil';
import { CodeGenerator } from '../shared/utils/CodeGenerator';
import { TwilioService } from '../services/TwilioService';
import { EmailService } from '../services/EmailService';

const router = express.Router();
const prisma = new PrismaClient();

// 15-minute email verification window.
const EMAIL_CODE_TTL_MS = 15 * 60 * 1000;

const sendEmailVerificationCode = async (email: string, code: string) => {
  await EmailService.sendEmail({
    to: email,
    subject: 'Your Gelato verification code',
    html: `<div style="font-family:sans-serif;text-align:center;padding:24px">
      <h2 style="color:#EC2828">Welcome to Gelato! 🍦</h2>
      <p>Your verification code is:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>
      <p style="color:#888">This code expires in 15 minutes.</p>
    </div>`,
    text: `Your Gelato verification code is ${code}. It expires in 15 minutes.`,
  });
};

/**
 * Email/Password Login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, loginContext } = req.body;
    // Each app logs in against its own account namespace.
    const accountType =
      loginContext === 'MOBILE_COURIER'
        ? 'COURIER'
        : loginContext === 'ADMIN_WEB'
        ? 'ADMIN'
        : 'CLIENT';

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Find user within this app's account namespace
    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType } },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid email or password',
      });
    }

    // Admin web is restricted to staff roles only.
    if (accountType === 'ADMIN') {
      const staffRoles = ['SUPER_ADMIN', 'SPOTS_ADMIN', 'SPOT_ADMIN', 'EMPLOYEE'];
      if (!user.roles.some((r) => staffRoles.includes(r))) {
        return res.status(403).json({ error: 'Not authorized for admin access' });
      }
    }

    // Validate password
    const isValid = await validatePassword(password, user.password);
    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // For admin employees, surface whether they must change their password.
    let firstLogin = false;
    let spotId: string | null = null;
    if (accountType === 'ADMIN') {
      const emp = await prisma.employeeProfile.findFirst({ where: { userId: user.id } });
      if (emp) {
        firstLogin = emp.isFirstLogin;
        spotId = emp.spotId;
      } else {
        const sa = await prisma.spotAdminProfile.findFirst({ where: { userId: user.id } });
        if (sa) spotId = sa.spotId;
      }
    }

    console.log(`✅ User logged in: ${user.email}`);

    return res.json({
      token: {
        access_token: accessToken,
        type: 'Bearer',
      },
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        surname: user.surname,
        picture: user.profilePicture,
        phone: user.phone,
        roles: user.roles,
        language: user.language,
        createdAt: user.createdAt,
        firstLogin,
        spotId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
    });
  }
});

/**
 * Email/Password Signup
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, phone, language, registrationSource } = req.body;
    // Courier app registers via the same endpoint → assign COURIER role + profile.
    const isCourier = registrationSource === 'MOBILE_COURIER';
    const accountType = isCourier ? 'COURIER' : 'CLIENT';

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    // Check if email already exists in THIS app's namespace (the same email may
    // exist as a separate account in the other app).
    const existingUser = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType } },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered',
      });
    }

    // Check if phone already exists in this namespace (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone_accountType: { phone, accountType } },
      });

      if (existingPhone) {
        return res.status(400).json({
          error: 'Phone number already registered',
        });
      }
    }

    // Hash password (enforces complexity — surface the reason to the client)
    let hashedPassword: string;
    try {
      hashedPassword = await hashPassword(password);
    } catch (err) {
      return res.status(400).json({
        error: err instanceof Error ? err.message : 'Invalid password',
      });
    }

    // Generate an email verification code (OTP) valid for 15 minutes.
    const verificationCode = CodeGenerator.generateOTP();
    const verificationExpires = new Date(Date.now() + EMAIL_CODE_TTL_MS);

    // Create user (unverified — must confirm the emailed code before login).
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split('@')[0],
        phone,
        accountType,
        language: (language as Language) || Language.PL,
        roles: isCourier ? ['COURIER'] : ['CLIENT'],
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
        phoneVerified: false,
        registrationSource: isCourier ? 'MOBILE_COURIER' : 'MOBILE_CLIENT',
        referralCode: {
          create: {
            code: CodeGenerator.generateReferralCode(name || email),
          },
        },
        // Clients get a loyalty balance; couriers get a courier profile.
        ...(isCourier
          ? { courierProfile: { create: {} } }
          : {
              pointBalance: {
                create: { totalPoints: 0, availablePoints: 0, lockedPoints: 0 },
              },
            }),
      },
    });

    await sendEmailVerificationCode(user.email, verificationCode);
    console.log(`✅ New user registered (pending verification): ${user.email}`);

    // No tokens yet — client must call /verify-code with the emailed OTP.
    return res.json({
      message: 'Verification code sent',
      requiresVerification: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Signup failed',
    });
  }
});

/**
 * Verify email with the OTP code, then log the user in.
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code, registrationSource } = req.body;
    const accountType = registrationSource === 'MOBILE_COURIER' ? 'COURIER' : 'CLIENT';
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType } },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      return res.status(400).json({ error: 'Verification code expired. Please resend.' });
    }
    if (user.emailVerificationCode !== String(code).trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const verified = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
    });

    const accessToken = generateAccessToken(verified);
    const refreshToken = generateRefreshToken(verified);
    console.log(`✅ Email verified: ${verified.email}`);

    return res.json({
      message: 'Email verified',
      token: { access_token: accessToken, type: 'Bearer' },
      refreshToken,
      user: {
        id: verified.id,
        email: verified.email,
        name: verified.name,
        firstName: verified.firstName,
        surname: verified.surname,
        phone: verified.phone,
        roles: verified.roles,
        language: verified.language,
        createdAt: verified.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Resend the email verification code.
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email, registrationSource } = req.body;
    const accountType = registrationSource === 'MOBILE_COURIER' ? 'COURIER' : 'CLIENT';
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType } },
    });
    // Don't reveal whether the account exists; act successful either way.
    if (!user || user.emailVerified) {
      return res.json({ message: 'Verification code sent' });
    }

    const code = CodeGenerator.generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: code,
        emailVerificationExpires: new Date(Date.now() + EMAIL_CODE_TTL_MS),
      },
    });
    await sendEmailVerificationCode(user.email, code);
    return res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ error: 'Failed to resend code' });
  }
});

/**
 * Send OTP to Phone Number
 */
router.post('/phone/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    const result = await TwilioService.sendOTP(phoneNumber, 'en');

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent',
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification code',
    });
  }
});

/**
 * Verify OTP and Login/Register
 */
router.post('/phone/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code, registrationSource } = req.body;
    // Courier app registers via the same endpoint → assign COURIER role + profile.
    const isCourier = registrationSource === 'MOBILE_COURIER';

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and code are required',
      });
    }

    // Verify OTP code
    const verification = await TwilioService.verifyOTP(phoneNumber, code);

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        error: verification.message,
      });
    }

    // Check if user exists within this app's account namespace
    const accountType = isCourier ? 'COURIER' : 'CLIENT';
    let user = await prisma.user.findUnique({
      where: { phone_accountType: { phone: phoneNumber, accountType } },
    });

    let isNewUser = false;

    if (!user) {
      // Create new user with phone
      user = await prisma.user.create({
        data: {
          // Phone-only accounts need a synthetic email; namespace it by type so
          // the client + courier phone accounts don't collide on email either.
          email: `${phoneNumber.replace('+', '')}.${accountType.toLowerCase()}@phone.gelato.app`,
          password: await hashPassword(CodeGenerator.generateRandomString(32)),
          phone: phoneNumber,
          accountType,
          name: phoneNumber,
          roles: isCourier ? ['COURIER'] : ['CLIENT'],
          phoneVerified: true,
          emailVerified: false,
          language: Language.PL,
          registrationSource: isCourier ? 'MOBILE_COURIER' : 'MOBILE_CLIENT',
          referralCode: {
            create: {
              code: CodeGenerator.generateReferralCode(phoneNumber),
            },
          },
          ...(isCourier
            ? { courierProfile: { create: {} } }
            : {
                pointBalance: {
                  create: {
                    totalPoints: 0,
                    availablePoints: 0,
                    lockedPoints: 0,
                  },
                },
              }),
        },
      });
      isNewUser = true;

      console.log(`✅ New user created via OTP: ${phoneNumber}`);
    } else {
      // Mark phone as verified
      if (!user.phoneVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }

      console.log(`✅ User logged in via OTP: ${phoneNumber}`);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      success: true,
      isNewUser: isNewUser,
      token: {
        access_token: accessToken,
        type: 'Bearer',
      },
      refreshToken: refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        roles: user.roles,
        language: user.language,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify code',
    });
  }
});

/**
 * Google Sign-In for Mobile (Native SDK)
 * Mobile app uses Google Sign-In SDK which provides serverAuthCode
 */
router.post('/login/google/mobile', async (req, res) => {
  try {
    const { serverAuthCode, referralCode, loginContext } = req.body;
    // Which app is signing in — Google accounts are scoped per account type too.
    const gAccountType = loginContext === 'MOBILE_COURIER' ? 'COURIER' : 'CLIENT';
    const gIsCourier = gAccountType === 'COURIER';

    if (!serverAuthCode) {
      return res.status(400).json({
        success: false,
        error: 'serverAuthCode is required',
      });
    }

    // Initialize Google OAuth2 client
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Exchange serverAuthCode for tokens
    const { tokens } = await client.getToken(serverAuthCode);
    client.setCredentials(tokens);

    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google token',
      });
    }

    // Create Google profile identifier
    const googleId = payload.sub;
    const email = payload.email || '';
    const name = payload.name || '';
    const picture = payload.picture || '';
    const firstName = payload.given_name || '';
    const surname = payload.family_name || '';

    // Find or create user within this app's account namespace
    let user = await prisma.user.findFirst({
      where: {
        accountType: gAccountType,
        OR: [
          { email: email.toLowerCase() },
          { googleId: googleId },
        ],
      },
    });

    let isFirstTimeGoogleLogin = false;

    if (!user) {
      // Create new user scoped to the signing-in app
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: await hashPassword(CodeGenerator.generateRandomString(32)),
          googleId: googleId,
          accountType: gAccountType,
          name: name,
          firstName: firstName,
          surname: surname,
          picture: picture,
          roles: gIsCourier ? ['COURIER'] : ['CLIENT'],
          emailVerified: true,
          phoneVerified: false,
          registrationSource: gIsCourier ? 'MOBILE_COURIER' : 'MOBILE_CLIENT',
          language: 'PL',
          referralCode: {
            create: {
              code: CodeGenerator.generateReferralCode(name || email),
            },
          },
          ...(gIsCourier
            ? { courierProfile: { create: {} } }
            : {
                pointBalance: {
                  create: {
                    totalPoints: 0,
                    availablePoints: 0,
                    lockedPoints: 0,
                  },
                },
              }),
        },
      });

      isFirstTimeGoogleLogin = true;

      // Handle referral code if provided
      if (referralCode) {
        const referralCodeRecord = await prisma.userReferralCode.findUnique({
          where: { code: referralCode },
        });

        if (referralCodeRecord && referralCodeRecord.userId !== user.id) {
          await prisma.referral.create({
            data: {
              referrerId: referralCodeRecord.userId,
              referredUserId: user.id,
              referralCode: referralCode,
              pointsAwarded: 500, // Standard referral points
              isCompleted: true,
            },
          });

          // Award points to referrer
          await prisma.pointBalance.update({
            where: { userId: referralCodeRecord.userId },
            data: {
              totalPoints: { increment: 500 },
              availablePoints: { increment: 500 },
            },
          });
        }
      }

      console.log(`✅ New user created via Google: ${user.email}`);
    } else {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: googleId },
        });
      }

      console.log(`✅ User logged in via Google: ${user.email}`);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return mobile-friendly response
    return res.json({
      success: true,
      isFirstTimeGoogleLogin: isFirstTimeGoogleLogin,
      token: {
        access_token: accessToken,
        type: 'Bearer',
      },
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        surname: user.surname,
        picture: user.picture,
        phone: user.phone,
        roles: user.roles,
        language: user.language,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Google mobile login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Google authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Apple Sign-In for Mobile
 * Mobile app uses Apple Sign-In SDK which provides identityToken
 */
router.post('/login/apple/mobile', async (req, res) => {
  try {
    const { identityToken, user: appleUser, referralCode, loginContext } = req.body;
    const aAccountType = loginContext === 'MOBILE_COURIER' ? 'COURIER' : 'CLIENT';
    const aIsCourier = aAccountType === 'COURIER';

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        error: 'identityToken is required',
      });
    }

    // Verify Apple identity token
    // Note: For production, you should verify the token with Apple's public keys
    // For now, we'll decode it to get user info
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(identityToken) as any;

    if (!decoded || !decoded.sub) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Apple identity token',
      });
    }

    const appleId = decoded.sub;
    const email = decoded.email || appleUser?.email || `${appleId}@appleid.apple`;
    const name = appleUser?.fullName
      ? `${appleUser.fullName.givenName || ''} ${appleUser.fullName.familyName || ''}`.trim()
      : email.split('@')[0];
    const firstName = appleUser?.fullName?.givenName || '';
    const surname = appleUser?.fullName?.familyName || '';

    // Find or create user within this app's account namespace
    let user = await prisma.user.findFirst({
      where: {
        accountType: aAccountType,
        OR: [
          { email: email.toLowerCase() },
          { appleId: appleId },
        ],
      },
    });

    let isFirstTimeAppleLogin = false;

    if (!user) {
      // Create new user scoped to the signing-in app
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: await hashPassword(CodeGenerator.generateRandomString(32)),
          appleId: appleId,
          accountType: aAccountType,
          name: name,
          firstName: firstName,
          surname: surname,
          roles: aIsCourier ? ['COURIER'] : ['CLIENT'],
          emailVerified: true,
          phoneVerified: false,
          registrationSource: aIsCourier ? 'MOBILE_COURIER' : 'MOBILE_CLIENT',
          language: 'PL',
          referralCode: {
            create: {
              code: CodeGenerator.generateReferralCode(name || email),
            },
          },
          ...(aIsCourier
            ? { courierProfile: { create: {} } }
            : {
                pointBalance: {
                  create: {
                    totalPoints: 0,
                    availablePoints: 0,
                    lockedPoints: 0,
                  },
                },
              }),
        },
      });

      isFirstTimeAppleLogin = true;

      // Handle referral code if provided
      if (referralCode) {
        const referralCodeRecord = await prisma.userReferralCode.findUnique({
          where: { code: referralCode },
        });

        if (referralCodeRecord && referralCodeRecord.userId !== user.id) {
          await prisma.referral.create({
            data: {
              referrerId: referralCodeRecord.userId,
              referredUserId: user.id,
              referralCode: referralCode,
              pointsAwarded: 500,
              isCompleted: true,
            },
          });

          // Award points to referrer
          await prisma.pointBalance.update({
            where: { userId: referralCodeRecord.userId },
            data: {
              totalPoints: { increment: 500 },
              availablePoints: { increment: 500 },
            },
          });
        }
      }

      console.log(`✅ New user created via Apple: ${user.email}`);
    } else {
      // Update Apple ID if not set
      if (!user.appleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { appleId: appleId },
        });
      }

      console.log(`✅ User logged in via Apple: ${user.email}`);
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Return mobile-friendly response
    return res.json({
      success: true,
      isFirstTimeAppleLogin: isFirstTimeAppleLogin,
      token: {
        access_token: accessToken,
        type: 'Bearer',
      },
      refreshToken: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        surname: user.surname,
        phone: user.phone,
        roles: user.roles,
        language: user.language,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Apple mobile login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Apple authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Admin: request a password-reset code (email OTP). Scoped to the ADMIN
 * namespace. Always responds success (don't reveal whether the account exists).
 */
router.post('/admin/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType: 'ADMIN' } },
    });

    if (user) {
      const code = CodeGenerator.generateOTP();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: code,
          emailVerificationExpires: new Date(Date.now() + EMAIL_CODE_TTL_MS),
        },
      });
      await EmailService.sendEmail({
        to: user.email,
        subject: 'Your Gelato admin password reset code',
        html: `<div style="font-family:sans-serif;text-align:center;padding:24px">
          <h2 style="color:#EC2828">Password reset</h2>
          <p>Your reset code is:</p>
          <p style="font-size:32px;font-weight:800;letter-spacing:6px">${code}</p>
          <p style="color:#888">This code expires in 15 minutes.</p>
        </div>`,
        text: `Your Gelato admin password reset code is ${code}. It expires in 15 minutes.`,
      });
    }

    return res.json({ message: 'If the account exists, a reset code was sent' });
  } catch (error) {
    console.error('Admin forgot-password error:', error);
    return res.status(500).json({ error: 'Failed to send reset code' });
  }
});

/**
 * Admin: reset the password using the emailed code.
 */
router.post('/admin/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code and new password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType: 'ADMIN' } },
    });
    if (
      !user ||
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date() ||
      user.emailVerificationCode !== String(code).trim()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    let hashed: string;
    try {
      hashed = await hashPassword(newPassword);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        emailVerificationCode: null,
        emailVerificationExpires: null,
        tokenVersion: { increment: 1 }, // invalidate existing sessions
      },
    });

    console.log(`✅ Admin password reset: ${user.email}`);
    return res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Admin reset-password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * Admin/employee: change password (used for the forced first-login change).
 * Verifies the current password, sets the new one, clears the employee's
 * isFirstLogin flag, and bumps tokenVersion.
 */
router.post('/admin/change-password', async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email_accountType: { email: email.toLowerCase(), accountType: 'ADMIN' } },
    });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await validatePassword(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    let hashed: string;
    try {
      hashed = await hashPassword(newPassword);
    } catch (err) {
      return res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid password' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        tokenVersion: { increment: 1 },
        employeeProfile: { updateMany: { where: {}, data: { isFirstLogin: false } } },
      },
    });

    console.log(`✅ Admin/employee password changed: ${user.email}`);
    return res.json({ message: 'Password changed' });
  } catch (error) {
    console.error('Admin change-password error:', error);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
