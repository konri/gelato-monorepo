import { PrismaClient, User } from '@prisma/client';
import { Request, Response } from 'express';

export interface Context {
  req: Request & { user?: User };
  res: Response;
  prisma: PrismaClient;
}
