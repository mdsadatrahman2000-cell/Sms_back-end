import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditInterceptor');

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, tenantId } = request;
    const body = request.body;
    const params = request.params;

    const action = this.mapMethodToAction(method);
    const entityType = this.extractEntityType(url);

    return next.handle().pipe(
      tap(async (response) => {
        try {
          if (user?.id && entityType) {
            await this.prisma.auditLog.create({
              data: {
                tenantId: tenantId || user.tenantId,
                userId: user.id,
                action,
                entityType,
                entityId: params.id || response?.id || undefined,
                ipAddress: request.ip || undefined,
                userAgent: request.headers['user-agent'] as string || undefined,
              },
            });
          }
        } catch (err) {
          this.logger.warn(`Audit log failed: ${err.message}`);
        }
      }),
    );
  }

  private mapMethodToAction(method: string): string {
    const map: Record<string, string> = { POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete', GET: 'read' };
    return map[method] || method.toLowerCase();
  }

  private extractEntityType(url: string): string | null {
    const parts = url.replace('/api/v1/', '').split('/').filter(Boolean);
    if (parts.length > 0) {
      const entity = parts[0].replace(/s$/, '');
      return entity.charAt(0).toUpperCase() + entity.slice(1);
    }
    return null;
  }
}
