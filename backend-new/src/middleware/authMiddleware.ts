import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../auth/PasswordUtil';

const prisma = new PrismaClient();

/**
 * Authentication middleware for Express
 * Extracts JWT from Authorization header and attaches user to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    // Verify JWT
    const payload = verifyAccessToken(token);

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return next();
    }

    // Check if tokenVersion matches (for logout/revocation)
    if (user.tokenVersion !== payload.tokenVersion) {
      return next();
    }

    // Attach user to request
    (req as any).user = user;

    next();
  } catch (error) {
    // Invalid token - continue without user
    next();
  }
}

/**
 * TypeGraphQL AuthChecker for @Authorized decorator
 */
export function authChecker(
  { context }: any,
  roles: string[]
): boolean {
  const user = context.req.user;

  // If no roles specified, just check if user exists
  if (roles.length === 0) {
    return !!user;
  }

  // Check if user has any of the required roles
  if (!user || !user.roles) {
    return false;
  }

  return user.roles.some((userRole: string) => roles.includes(userRole));
}
