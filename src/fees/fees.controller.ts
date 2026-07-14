import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto, CreateInvoiceDto, RecordPaymentDto } from './dto/fee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('structures')
  @Roles('school_admin', 'accountant')
  createFeeStructure(@TenantId() tenantId: string, @Body() dto: CreateFeeStructureDto) {
    return this.feesService.createFeeStructure(tenantId, dto);
  }

  @Get('structures')
  @Roles('school_admin', 'accountant', 'teacher')
  getFeeStructures(@TenantId() tenantId: string, @Query('classId') classId?: string) {
    return this.feesService.getFeeStructures(tenantId, classId);
  }

  @Post('invoices')
  @Roles('school_admin', 'accountant')
  createInvoice(@TenantId() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.feesService.createInvoice(tenantId, dto);
  }

  @Get('invoices')
  @Roles('school_admin', 'accountant', 'teacher', 'parent')
  getInvoices(@TenantId() tenantId: string, @Query('studentId') studentId?: string, @Query('status') status?: string) {
    return this.feesService.getInvoices(tenantId, studentId, status);
  }

  @Post('payments')
  @Roles('school_admin', 'accountant')
  recordPayment(@TenantId() tenantId: string, @Body() dto: RecordPaymentDto) {
    return this.feesService.recordPayment(tenantId, dto);
  }

  @Get('revenue')
  @Roles('school_admin', 'accountant')
  getRevenue(@TenantId() tenantId: string, @Query('academicYearId') academicYearId?: string) {
    return this.feesService.getRevenue(tenantId, academicYearId);
  }

  @Delete('invoices/:id')
  @Roles('school_admin', 'accountant')
  deleteInvoice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.feesService.deleteInvoice(tenantId, id);
  }
}
