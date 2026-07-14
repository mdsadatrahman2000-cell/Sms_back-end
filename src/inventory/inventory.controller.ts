import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, StockMovementDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles('school_admin', 'inventory_manager')
  createItem(@TenantId() tenantId: string, @Body() dto: CreateInventoryItemDto) {
    return this.inventoryService.createItem(tenantId, dto);
  }

  @Get()
  @Roles('school_admin', 'inventory_manager', 'teacher')
  getItems(@TenantId() tenantId: string, @Query('category') category?: string, @Query('search') search?: string) {
    return this.inventoryService.getItems(tenantId, category, search);
  }

  @Patch(':id')
  @Roles('school_admin', 'inventory_manager')
  updateItem(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateInventoryItemDto) {
    return this.inventoryService.updateItem(tenantId, id, dto);
  }

  @Post(':id/movements')
  @Roles('school_admin', 'inventory_manager')
  recordMovement(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: StockMovementDto) {
    return this.inventoryService.recordMovement(tenantId, id, dto);
  }

  @Get('low-stock')
  @Roles('school_admin', 'inventory_manager')
  getLowStock(@TenantId() tenantId: string) {
    return this.inventoryService.getLowStock(tenantId);
  }
}
