import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;

  constructor(private prisma: PrismaService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    tenantId: string,
    uploaderId: string,
    file: Express.Multer.File,
    entityType: string,
    entityId?: string,
    category?: string,
    description?: string,
  ) {
    const ext = path.extname(file.originalname);
    const storageKey = `${tenantId}/${entityType}/${entityId || 'general'}/${uuidv4()}${ext}`;

    const entityDir = path.join(this.uploadDir, tenantId, entityType, entityId || 'general');
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }

    const filePath = path.join(this.uploadDir, storageKey);
    fs.writeFileSync(filePath, file.buffer);

    const document = await this.prisma.document.create({
      data: {
        tenantId,
        uploaderId,
        entityType,
        entityId: entityId || null,
        fileName: `${uuidv4()}${ext}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        storageKey,
        category: category || 'general',
        description: description || null,
      },
    });

    this.logger.log(`File uploaded: ${file.originalname} -> ${storageKey}`);
    return document;
  }

  async findAll(
    tenantId: string,
    entityType?: string,
    entityId?: string,
  ) {
    const where: any = { tenantId, deletedAt: null };
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    return this.prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, tenantId },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    return doc;
  }

  async download(id: string, tenantId: string) {
    const doc = await this.findOne(id, tenantId);
    const filePath = path.join(this.uploadDir, doc.storageKey);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return { doc, filePath };
  }

  async remove(id: string, tenantId: string) {
    const doc = await this.findOne(id, tenantId);
    const filePath = path.join(this.uploadDir, doc.storageKey);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.prisma.document.delete({ where: { id } });

    return { message: 'Document deleted successfully' };
  }
}
