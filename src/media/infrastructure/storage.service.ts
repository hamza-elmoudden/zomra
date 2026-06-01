import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private region: string;
  private readonly logger = new Logger(StorageService.name);
  private initialized = false;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || '';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';

    if (this.region && accessKeyId && secretAccessKey && this.bucketName) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: { accessKeyId, secretAccessKey },
      });
      this.initialized = true;
    } else {
      this.logger.warn('AWS S3 not configured - file storage will be unavailable');
    }
  }

  private ensureInitialized() {
    if (!this.initialized || !this.s3Client) {
      throw new InternalServerErrorException('Storage service is not configured');
    }
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    mimetype: string,
  ): Promise<string> {
    this.ensureInitialized();
    try {
      await this.s3Client!.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        }),
      );
      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
  }

  async deleteFile(key: string): Promise<void> {
    this.ensureInitialized();
    try {
      await this.s3Client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete file from storage');
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureInitialized();
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      return getSignedUrl(this.s3Client!, command, { expiresIn });
    } catch (error) {
      throw new InternalServerErrorException('Failed to generate signed URL');
    }
  }

  extractKeyFromUrl(url: string): string {
    return url.replace(`https://${this.bucketName}.s3.${this.region}.amazonaws.com/`, '');
  }
}
