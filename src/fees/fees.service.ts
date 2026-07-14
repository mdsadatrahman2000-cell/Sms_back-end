import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeeStructureDto, CreateInvoiceDto, RecordPaymentDto } from './dto/fee.dto';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async createFeeStructure(tenantId: string, dto: CreateFeeStructureDto) {
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    return this.prisma.feeStructure.create({
      data: {
        tenantId,
        name: dto.name,
        classId: dto.classId,
        academicYearId: dto.academicYearId,
        totalAmount,
        items: {
          create: dto.items.map((item) => ({
            name: item.name,
            amount: item.amount,
          })),
        },
      },
      include: { items: true, class: { select: { name: true } } },
    });
  }

  async getFeeStructures(tenantId: string, classId?: string) {
    const where: any = { tenantId };
    if (classId) where.classId = classId;

    return this.prisma.feeStructure.findMany({
      where,
      include: {
        items: true,
        class: { select: { name: true, section: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createInvoice(tenantId: string, dto: CreateInvoiceDto) {
    const student = await this.prisma.student.findFirst({
      where: { tenantId, id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { tenantId, id: dto.feeStructureId },
      include: { items: true },
    });
    if (!feeStructure) throw new NotFoundException('Fee structure not found');

    const totalAmount = Number(feeStructure.totalAmount);
    const invoiceNumber = `INV-${Date.now()}`;

    const studentGuardian = await this.prisma.studentGuardian.findFirst({
      where: { studentId: dto.studentId },
    });

    return this.prisma.invoice.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        parentId: studentGuardian?.guardianId || '',
        feeStructureId: dto.feeStructureId,
        invoiceNumber,
        totalAmount,
        paidAmount: 0,
        status: 'unpaid',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(),
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        feeStructure: { include: { items: true } },
      },
    });
  }

  async getInvoices(tenantId: string, studentId?: string, status?: string) {
    const where: any = { tenantId };
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    return this.prisma.invoice.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        feeStructure: { select: { name: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordPayment(tenantId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { tenantId, id: dto.invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (Number(invoice.paidAmount) + dto.amount > Number(invoice.totalAmount)) {
      throw new BadRequestException('Payment exceeds invoice amount');
    }

    const newPaidAmount = Number(invoice.paidAmount) + dto.amount;
    const newStatus = newPaidAmount >= Number(invoice.totalAmount) ? 'paid' : 'partial';
    const paymentNumber = `PAY-${Date.now()}`;

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          tenantId,
          invoiceId: dto.invoiceId,
          paymentNumber,
          amount: dto.amount,
          method: dto.method,
          transactionRef: dto.reference,
          status: 'completed',
          paidAt: new Date(),
        },
      }),
      this.prisma.invoice.update({
        where: { id: dto.invoiceId },
        data: { paidAmount: newPaidAmount, status: newStatus },
      }),
    ]);

    return payment;
  }

  async getRevenue(tenantId: string, academicYearId?: string) {
    const where: any = { tenantId };

    const [totalRevenue, invoices] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId },
        _sum: { amount: true },
      }),
      this.prisma.invoice.findMany({
        where: { tenantId, status: { in: ['unpaid', 'partial'] } },
        select: { totalAmount: true, paidAmount: true },
      }),
    ]);

    const pending = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount) - Number(inv.paidAmount), 0);

    return {
      collected: Number(totalRevenue._sum.amount || 0),
      pending,
    };
  }

  async deleteInvoice(tenantId: string, invoiceId: string) {
    return this.prisma.invoice.deleteMany({ where: { id: invoiceId, tenantId } });
  }
}
