import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 10;
  private readonly LOCKOUT_DURATION_MINUTES = 15;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    let tenant = await this.prisma.tenant.findFirst({ where: { slug: 'demo-school' } });
    if (!tenant) {
      tenant = await this.prisma.tenant.create({
        data: { name: 'Demo School', slug: 'demo-school', subdomain: 'demo', timezone: 'UTC', currency: 'USD', language: 'en', plan: 'free' },
      });
    }

    const existingUser = await this.prisma.user.findFirst({ where: { email: dto.email, tenantId: tenant.id, deletedAt: null } });
    if (existingUser) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash: hashedPassword, firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone, tenantId: tenant.id },
    });

    const studentRole = await this.prisma.role.findFirst({ where: { tenantId: tenant.id, name: 'student' } });
    if (studentRole) {
      await this.prisma.userRole.create({ data: { tenantId: tenant.id, userId: user.id, roleId: studentRole.id } });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, ['student']);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ForbiddenException(`Account locked. Try again in ${minutesLeft} minutes`);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const attempts = user.failedLoginAttempts + 1;
      const updateData: any = { failedLoginAttempts: attempts };
      if (attempts >= this.MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION_MINUTES * 60000);
        updateData.failedLoginAttempts = 0;
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, roles);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) return { message: 'If the email exists, a reset link has been sent' };

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'reset' },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '1h' },
    );

    const hashedToken = await bcrypt.hash(resetToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashedToken },
    });

    return { message: 'If the email exists, a reset link has been sent', resetToken };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (payload.type !== 'reset') throw new BadRequestException('Invalid token');

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash: hashedPassword, failedLoginAttempts: 0, lockedUntil: null },
      });

      return { message: 'Password reset successful' };
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.refreshTokenHash) throw new UnauthorizedException();

      const isRefreshValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isRefreshValid) throw new UnauthorizedException();

      const roles = (await this.prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      })).map((ur) => ur.role.name);

      const tokens = await this.generateTokens(user.id, user.email, user.tenantId, roles);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException();
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: null } });
  }

  private async generateTokens(userId: string, email: string, tenantId: string, roles: string[]) {
    const payload = { sub: userId, email, tenantId, roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '15m' }),
      this.jwtService.signAsync(payload, { secret: this.configService.get<string>('JWT_REFRESH_SECRET'), expiresIn: '7d' }),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: hashedToken } });
  }
}
