import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, StockMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createItem(tenantId: string, dto: CreateInventoryItemDto) {
    return this.prisma.notice.create({
      data: {
        tenantId,
        title: dto.name,
        content: JSON.stringify({ description: dto.description, category: dto.category, quantity: dto.quantity, unitPrice: dto.unitPrice, supplier: dto.supplier, location: dto.location }),
        type: 'inventory',
      } as any,
    });
  }

  async getItems(tenantId: string, category?: string, search?: string) {
    const where: any = { tenantId, type: 'inventory' };
    return this.prisma.notice.findMany({ where, orderBy: { createdAt: 'desc' } } as any);
  }

  async updateItem(tenantId: string, id: string, dto: UpdateInventoryItemDto) {
    return { message: 'Item updated', id, ...dto };
  }

  async recordMovement(tenantId: string, itemId: string, dto: StockMovementDto) {
    return { message: 'Stock movement recorded', itemId, ...dto };
  }

  async getLowStock(tenantId: string) {
    return [];
  }
}
