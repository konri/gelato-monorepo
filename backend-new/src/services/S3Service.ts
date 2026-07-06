import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

/**
 * S3 Upload Service
 *
 * Handles image and file uploads to AWS S3
 *
 * Folder structure:
 * - /tastes/{tasteId}/{filename}
 * - /products/{productId}/{filename}
 * - /spots/{spotId}/{filename}
 * - /news/{newsId}/{filename}
 * - /prizes/{prizeId}/{filename}
 * - /users/{userId}/{filename}
 */
export class S3Service {
  private static client: S3Client | null = null;
  private static bucketName: string;
  private static region: string;
  private static cloudFrontUrl: string | undefined;
  private static endpoint: string | undefined;
  private static forcePathStyle = false;

  /**
   * Initialize S3 client.
   * Accepts both the canonical AWS_* names and the shorter alternatives
   * (AWS_SECRET_KEY, AWS_BUCKET_NAME, AWS_S3_SERVER_ENDPOINT).
   */
  static initialize(): void {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
    const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'eu-central-1';
    // Custom S3 endpoint (e.g. an S3-compatible provider). If it's a bare AWS
    // regional endpoint we let the SDK derive it, so only set for non-AWS.
    const endpoint = process.env.AWS_S3_SERVER_ENDPOINT || process.env.AWS_S3_ENDPOINT;

    if (!accessKeyId || !secretAccessKey || !bucketName) {
      console.warn('⚠️  AWS S3 credentials not configured. Image uploads disabled.');
      return;
    }

    const isCustomEndpoint = !!endpoint && !endpoint.includes('amazonaws.com');

    this.client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
      ...(endpoint ? { endpoint } : {}),
      // Non-AWS/custom endpoints usually need path-style addressing.
      ...(isCustomEndpoint ? { forcePathStyle: true } : {}),
    });

    this.bucketName = bucketName;
    this.region = region;
    this.cloudFrontUrl = process.env.AWS_CLOUDFRONT_URL;
    this.endpoint = endpoint;
    this.forcePathStyle = isCustomEndpoint;

    console.log(
      `✅ S3 service initialized (bucket: ${bucketName}, region: ${region}${endpoint ? `, endpoint: ${endpoint}` : ''})`,
    );
  }

  /**
   * Build the public URL for a stored object key.
   */
  private static publicUrl(key: string): string {
    if (this.cloudFrontUrl) return `${this.cloudFrontUrl}/${key}`;
    // Custom (non-AWS) endpoint → path-style, honouring its scheme.
    if (this.endpoint && this.forcePathStyle) {
      return `${this.endpoint.replace(/\/$/, '')}/${this.bucketName}/${key}`;
    }
    // AWS (or AWS-style endpoint) → always canonical virtual-hosted HTTPS URL,
    // so the bucket is included and links are secure (iOS blocks plain http).
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Upload image to S3
   */
  static async uploadImage(
    buffer: Buffer,
    folder: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error('S3 service not initialized');
    }

    // Generate unique filename
    const extension = filename.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${extension}`;
    const key = `${folder}/${uniqueFilename}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    });

    await this.client.send(command);

    return this.publicUrl(key);
  }

  /**
   * Delete image from S3
   */
  static async deleteImage(url: string): Promise<void> {
    if (!this.client) {
      throw new Error('S3 service not initialized');
    }

    // Extract key from URL
    let key: string;

    if (this.cloudFrontUrl && url.startsWith(this.cloudFrontUrl)) {
      key = url.replace(`${this.cloudFrontUrl}/`, '');
    } else {
      // Extract from S3 URL
      const match = url.match(/amazonaws\.com\/(.+)$/);
      if (!match) {
        throw new Error('Invalid S3 URL');
      }
      key = match[1];
    }

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
    console.log(`✅ Deleted image from S3: ${key}`);
  }

  /**
   * Upload taste image
   */
  static async uploadTasteImage(
    buffer: Buffer,
    tasteId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    return this.uploadImage(buffer, `tastes/${tasteId}`, filename, contentType);
  }

  /**
   * Upload product image
   */
  static async uploadProductImage(
    buffer: Buffer,
    productId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    return this.uploadImage(buffer, `products/${productId}`, filename, contentType);
  }

  /**
   * Upload spot image
   */
  static async uploadSpotImage(
    buffer: Buffer,
    spotId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    return this.uploadImage(buffer, `spots/${spotId}`, filename, contentType);
  }

  /**
   * Upload news image
   */
  static async uploadNewsImage(
    buffer: Buffer,
    newsId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    return this.uploadImage(buffer, `news/${newsId}`, filename, contentType);
  }

  /**
   * Upload prize image
   */
  static async uploadPrizeImage(
    buffer: Buffer,
    prizeId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    return this.uploadImage(buffer, `prizes/${prizeId}`, filename, contentType);
  }

  /**
   * Upload user profile picture
   */
  static async uploadUserImage(
    buffer: Buffer,
    userId: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    return this.uploadImage(buffer, `users/${userId}`, filename, contentType);
  }

  /**
   * Validate image file
   */
  static validateImage(file: Express.Multer.File): void {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 5MB.');
    }
  }
}

// Initialize S3 on module load
S3Service.initialize();
