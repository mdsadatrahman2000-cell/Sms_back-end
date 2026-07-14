import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'POST') {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
    if (!idempotencyKey) {
      return next();
    }

    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      if (existing.statusCode && existing.response) {
        res.status(existing.statusCode).json(existing.response);
        return;
      }
      return next();
    }

    await this.prisma.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        userId: (req as any).user?.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      this.prisma.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: {
          response: body,
          statusCode: res.statusCode,
        },
      }).catch(() => {});
      return originalJson(body);
    };

    next();
  }
}
