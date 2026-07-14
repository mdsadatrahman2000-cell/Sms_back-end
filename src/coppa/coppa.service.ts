import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoppaService {
  private readonly COPPA_AGE_THRESHOLD = 13;

  constructor(private prisma: PrismaService) {}

  async checkAgeEligibility(dateOfBirth: string) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return {
      age,
      requiresParentalConsent: age < this.COPPA_AGE_THRESHOLD,
      isEligible: true,
      message: age < this.COPPA_AGE_THRESHOLD
        ? 'Parental consent is required for students under 13'
        : 'Student meets age requirements',
    };
  }

  async recordParentalConsent(tenantId: string, studentId: string, parentId: string, consentType: string) {
    const existing = await this.prisma.parentalConsent.findUnique({
      where: { studentId_consentType: { studentId, consentType } },
    });

    if (existing) {
      if (existing.granted) {
        throw new BadRequestException('Parental consent already granted');
      }
      return this.prisma.parentalConsent.update({
        where: { id: existing.id },
        data: { granted: true, grantedAt: new Date() },
      });
    }

    return this.prisma.parentalConsent.create({
      data: {
        tenantId,
        studentId,
        parentId,
        consentType,
        granted: true,
        grantedAt: new Date(),
      },
    });
  }

  async revokeConsent(studentId: string, consentType: string) {
    const consent = await this.prisma.parentalConsent.findUnique({
      where: { studentId_consentType: { studentId, consentType } },
    });

    if (!consent) throw new NotFoundException('Consent record not found');

    return this.prisma.parentalConsent.update({
      where: { id: consent.id },
      data: { granted: false, revokedAt: new Date() },
    });
  }

  async getConsentStatus(studentId: string) {
    const consents = await this.prisma.parentalConsent.findMany({
      where: { studentId },
      include: {
        parent: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    return {
      consents,
      allGranted: consents.every((c) => c.granted),
      pendingTypes: consents.filter((c) => !c.granted).map((c) => c.consentType),
    };
  }

  async verifyConsent(studentId: string, consentType: string): Promise<boolean> {
    const consent = await this.prisma.parentalConsent.findUnique({
      where: { studentId_consentType: { studentId, consentType } },
    });

    return consent?.granted === true;
  }
}
