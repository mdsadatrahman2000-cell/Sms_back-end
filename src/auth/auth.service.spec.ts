import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginHistoryService } from '../login-history/login-history.service';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let loginHistoryService: any;

  beforeEach(async () => {
    prisma = {
      user: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
      tenant: { findFirst: jest.fn() },
      role: { findFirst: jest.fn() },
      userRole: { create: jest.fn(), findMany: jest.fn() },
    };
    jwtService = { sign: jest.fn(), signAsync: jest.fn(), verify: jest.fn() };
    loginHistoryService = { log: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('secret') } },
        { provide: LoginHistoryService, useValue: loginHistoryService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when account is locked', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: '1', email: 'test@test.com', passwordHash: 'hash',
        lockedUntil: new Date(Date.now() + 60000),
        failedLoginAttempts: 10, userRoles: [],
      });
      await expect(service.login({ email: 'test@test.com', password: 'pass' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should increment failed attempts on wrong password', async () => {
      const user = {
        id: '1', email: 'test@test.com', passwordHash: 'hashed',
        lockedUntil: null, failedLoginAttempts: 5,
        userRoles: [{ role: { name: 'student' } }],
        tenantId: 't1',
      };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.user.update.mockResolvedValue({});
      jwtService.signAsync.mockResolvedValue('token');
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(false);

      await expect(service.login({ email: 'test@test.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      prisma.user.update.mockResolvedValue({});
      await service.logout('user-id');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: { refreshTokenHash: null },
      });
    });
  });
});
