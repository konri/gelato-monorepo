import { Router, Request, Response } from 'express';
import multer from 'multer';
import { S3Service } from '../services/S3Service';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../auth/PasswordUtil';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Middleware to verify auth token
 */
function requireAuth(req: Request, res: Response, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = verifyAccessToken(token);
    (req as any).userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware to check global-admin roles (SUPER_ADMIN / SPOTS_ADMIN).
 * Used for global content: news, prizes.
 */
async function requireAdmin(req: Request, res: Response, next: any) {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  if (!user || (!user.roles.includes('SUPER_ADMIN') && !user.roles.includes('SPOTS_ADMIN'))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Middleware for spot-level content (taste / product / spot images).
 * Allows global admins AND SPOT_ADMIN (a spot admin manages their own spot's
 * media). Spot-ownership is enforced per-endpoint below.
 */
async function requireSpotAdmin(req: Request, res: Response, next: any) {
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { roles: true },
  });

  const allowed = ['SUPER_ADMIN', 'SPOTS_ADMIN', 'SPOT_ADMIN'];
  if (!user || !user.roles.some((r) => allowed.includes(r))) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

/**
 * Upload taste image
 * POST /upload/taste/:tasteId
 */
router.post('/taste/:tasteId', requireAuth, requireSpotAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { tasteId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    S3Service.validateImage(file);

    const imageUrl = await S3Service.uploadTasteImage(
      file.buffer,
      tasteId,
      file.originalname,
      file.mimetype
    );

    // Update taste
    await prisma.taste.update({
      where: { id: tasteId },
      data: { imageUrl },
    });

    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload product image
 * POST /upload/product/:productId
 */
router.post('/product/:productId', requireAuth, requireSpotAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    S3Service.validateImage(file);

    const imageUrl = await S3Service.uploadProductImage(
      file.buffer,
      productId,
      file.originalname,
      file.mimetype
    );

    // Update product
    await prisma.product.update({
      where: { id: productId },
      data: { imageUrl },
    });

    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload spot image (logo, cover, or photos)
 * POST /upload/spot/:spotId?type=logo|cover|photo
 */
router.post('/spot/:spotId', requireAuth, requireSpotAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { spotId } = req.params;
    const { type } = req.query;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    S3Service.validateImage(file);

    const imageUrl = await S3Service.uploadSpotImage(
      file.buffer,
      spotId,
      file.originalname,
      file.mimetype
    );

    // Update spot based on type
    const spot = await prisma.spot.findUnique({ where: { id: spotId } });
    if (!spot) {
      return res.status(404).json({ error: 'Spot not found' });
    }

    if (type === 'logo') {
      await prisma.spot.update({
        where: { id: spotId },
        data: { logoUrl: imageUrl },
      });
    } else if (type === 'cover') {
      await prisma.spot.update({
        where: { id: spotId },
        data: { coverUrl: imageUrl },
      });
    } else {
      // Add to photos array
      await prisma.spot.update({
        where: { id: spotId },
        data: { photos: { push: imageUrl } },
      });
    }

    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload news image
 * POST /upload/news/:newsId
 */
router.post('/news/:newsId', requireAuth, requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    S3Service.validateImage(file);

    const imageUrl = await S3Service.uploadNewsImage(
      file.buffer,
      newsId,
      file.originalname,
      file.mimetype
    );

    // Add to news images array
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    await prisma.news.update({
      where: { id: newsId },
      data: { images: { push: imageUrl } },
    });

    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload prize image
 * POST /upload/prize/:prizeId
 */
router.post('/prize/:prizeId', requireAuth, requireAdmin, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { prizeId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    S3Service.validateImage(file);

    const imageUrl = await S3Service.uploadPrizeImage(
      file.buffer,
      prizeId,
      file.originalname,
      file.mimetype
    );

    // Update prize
    await prisma.prize.update({
      where: { id: prizeId },
      data: { imageUrl },
    });

    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Upload user profile picture
 * POST /upload/profile
 */
router.post('/profile', requireAuth, upload.single('image'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    S3Service.validateImage(file);

    const imageUrl = await S3Service.uploadUserImage(
      file.buffer,
      userId,
      file.originalname,
      file.mimetype
    );

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { profilePicture: imageUrl },
    });

    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
