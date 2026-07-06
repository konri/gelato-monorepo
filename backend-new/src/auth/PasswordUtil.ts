import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

/**
 * Security constants
 */
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_ROUNDS = 12; // Higher than 10 for better security (2^12 iterations)

/**
 * JWT Payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  roles: string[];
  tokenVersion: number;
}

/**
 * Hash password using bcrypt with 12 rounds (more secure than default 10)
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }

  // Additional password strength validation
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Validate password against hashed password
 * @param plainPassword Plain text password
 * @param hashedPassword Hashed password from database
 * @returns True if password matches
 */
export async function validatePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate JWT access token
 * @param user User object
 * @returns JWT token
 */
export function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    roles: user.roles,
    tokenVersion: user.tokenVersion,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
    issuer: 'gelato-api',
    audience: 'gelato-client',
  });
}

/**
 * Generate JWT refresh token
 * @param user User object
 * @returns JWT refresh token
 */
export function generateRefreshToken(user: User): string {
  const payload = {
    userId: user.id,
    tokenVersion: user.tokenVersion,
  };

  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '90d',
    issuer: 'gelato-api',
    audience: 'gelato-client',
  });
}

/**
 * Verify JWT access token
 * @param token JWT token
 * @returns Decoded payload
 */
export function verifyAccessToken(token: string): JWTPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    return jwt.verify(token, secret, {
      issuer: 'gelato-api',
      audience: 'gelato-client',
    }) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify JWT refresh token
 * @param token JWT refresh token
 * @returns Decoded payload
 */
export function verifyRefreshToken(token: string): { userId: string; tokenVersion: number } {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }

  try {
    return jwt.verify(token, secret, {
      issuer: 'gelato-api',
      audience: 'gelato-client',
    }) as { userId: string; tokenVersion: number };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Invalidate all user tokens by incrementing tokenVersion
 * @param prisma Prisma client
 * @param userId User ID
 */
export async function invalidateAllTokens(prisma: any, userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}
