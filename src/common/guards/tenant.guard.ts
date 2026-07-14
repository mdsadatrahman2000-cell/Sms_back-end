import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId || request.user?.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Missing tenant context');
    }

    request.tenantId = tenantId;
    return true;
  }
}
