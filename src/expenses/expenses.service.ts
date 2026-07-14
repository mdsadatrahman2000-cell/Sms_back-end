import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  CreateBudgetDto,
  UpdateBudgetDto,
} from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findCategories(tenantId: string) {
    return this.prisma.expenseCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, dto: CreateExpenseCategoryDto) {
    return this.prisma.expenseCategory.create({
      data: { tenantId, ...dto },
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id, tenantId },
    });
    if (!category) throw new NotFoundException('Category not found');

    const hasExpenses = await this.prisma.expense.findFirst({
      where: { categoryId: id },
    });
    if (hasExpenses) throw new BadRequestException('Cannot delete category with expenses');

    return this.prisma.expenseCategory.delete({ where: { id } });
  }

  async findAllExpenses(tenantId: string, page = 1, limit = 20, categoryId?: string) {
    const where: any = { tenantId, deletedAt: null };
    if (categoryId) where.categoryId = categoryId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { expenseDate: 'desc' },
      }),
      this.prisma.expense.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createExpense(tenantId: string, dto: CreateExpenseDto) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: dto.categoryId, tenantId },
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.expense.create({
      data: { tenantId, ...dto },
      include: { category: true },
    });
  }

  async updateExpense(tenantId: string, id: string, dto: UpdateExpenseDto) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.expense.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async approveExpense(tenantId: string, id: string, approvedBy: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.status !== 'pending') throw new BadRequestException('Expense already processed');

    return this.prisma.expense.update({
      where: { id },
      data: { status: 'approved', approvedBy, approvedAt: new Date() },
    });
  }

  async deleteExpense(tenantId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getBudgetSummary(tenantId: string) {
    const now = new Date();
    const budgets = await this.prisma.budget.findMany({
      where: {
        tenantId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: { category: true },
    });

    const summary = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.prisma.expense.aggregate({
          where: {
            tenantId,
            categoryId: budget.categoryId,
            status: 'approved',
            expenseDate: { gte: budget.startDate, lte: budget.endDate },
          },
          _sum: { amount: true },
        });
        return {
          ...budget,
          spent: spent._sum.amount || 0,
          remaining: Number(budget.amount) - Number(spent._sum.amount || 0),
        };
      }),
    );

    return summary;
  }

  async createBudget(tenantId: string, dto: CreateBudgetDto) {
    const category = await this.prisma.expenseCategory.findFirst({
      where: { id: dto.categoryId, tenantId },
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.budget.create({
      data: { tenantId, ...dto },
      include: { category: true },
    });
  }

  async updateBudget(tenantId: string, id: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, tenantId },
    });
    if (!budget) throw new NotFoundException('Budget not found');

    return this.prisma.budget.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async getExpenseSummary(tenantId: string) {
    const totalExpenses = await this.prisma.expense.aggregate({
      where: { tenantId, status: 'approved', deletedAt: null },
      _sum: { amount: true },
      _count: true,
    });

    const byCategory = await this.prisma.expense.groupBy({
      by: ['categoryId'],
      where: { tenantId, status: 'approved', deletedAt: null },
      _sum: { amount: true },
      _count: true,
    });

    const categories = await this.prisma.expenseCategory.findMany({
      where: { tenantId },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      total: totalExpenses._sum.amount || 0,
      count: totalExpenses._count,
      byCategory: byCategory.map((item) => ({
        categoryId: item.categoryId,
        categoryName: categoryMap.get(item.categoryId) || 'Unknown',
        total: item._sum.amount || 0,
        count: item._count,
      })),
    };
  }
}
