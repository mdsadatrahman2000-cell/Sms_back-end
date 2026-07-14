import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, StockMovementDto } from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async createItem(tenantId: string, dto: CreateInventoryItemDto) {
    return this.prisma.inventoryItem.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
        supplier: dto.supplier,
        location: dto.location,
      },
    });
  }

  async getItems(tenantId: string, page = 1, limit = 20, category?: string, search?: string) {
    const where: any = { tenantId };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getItem(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { tenantId, id },
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async updateItem(tenantId: string, id: string, dto: UpdateInventoryItemDto) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { tenantId, id } });
    if (!item) throw new NotFoundException('Item not found');
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async deleteItem(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { tenantId, id } });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.stockMovement.deleteMany({ where: { itemId: id } });
    await this.prisma.inventoryItem.delete({ where: { id } });
    return { message: 'Item deleted' };
  }

  async recordMovement(tenantId: string, itemId: string, dto: StockMovementDto) {
    const item = await this.prisma.inventoryItem.findFirst({ where: { tenantId, id: itemId } });
    if (!item) throw new NotFoundException('Item not found');

    const newQuantity = dto.type === 'in'
      ? item.quantity + dto.quantity
      : item.quantity - dto.quantity;

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: { tenantId, itemId, type: dto.type, quantity: dto.quantity, reason: dto.reason },
      }),
      this.prisma.inventoryItem.update({
        where: { id: itemId },
        data: { quantity: Math.max(0, newQuantity) },
      }),
    ]);

    return movement;
  }

  async getLowStock(tenantId: string) {
    const allItems = await this.prisma.inventoryItem.findMany({
      where: { tenantId },
      orderBy: { quantity: 'asc' },
    });
    return allItems.filter((item) => item.quantity <= item.minStock);
  }

  async getCategories(tenantId: string) {
    const result = await this.prisma.inventoryItem.groupBy({
      by: ['category'],
      where: { tenantId },
      _count: true,
    });
    return result.map((r) => ({ category: r.category, count: r._count }));
  }
}
