import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  CreateBudgetDto,
  UpdateBudgetDto,
} from './dto/expense.dto';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List expense categories' })
  findCategories(@Req() req: any) {
    return this.service.findCategories(req.user.tenantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create expense category' })
  createCategory(@Req() req: any, @Body() dto: CreateExpenseCategoryDto) {
    return this.service.createCategory(req.user.tenantId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete expense category' })
  deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteCategory(req.user.tenantId, id);
  }

  @Get()
  @ApiOperation({ summary: 'List expenses' })
  findAll(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.service.findAllExpenses(req.user.tenantId, +(page || 1), +(limit || 20), categoryId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get expense summary' })
  getSummary(@Req() req: any) {
    return this.service.getExpenseSummary(req.user.tenantId);
  }

  @Get('budget/summary')
  @ApiOperation({ summary: 'Get budget vs actual summary' })
  getBudgetSummary(@Req() req: any) {
    return this.service.getBudgetSummary(req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create expense' })
  create(@Req() req: any, @Body() dto: CreateExpenseDto) {
    return this.service.createExpense(req.user.tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense' })
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateExpenseDto) {
    return this.service.updateExpense(req.user.tenantId, id, dto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve expense' })
  approve(@Req() req: any, @Param('id') id: string) {
    return this.service.approveExpense(req.user.tenantId, id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete expense' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteExpense(req.user.tenantId, id);
  }

  @Post('budget')
  @ApiOperation({ summary: 'Create budget' })
  createBudget(@Req() req: any, @Body() dto: CreateBudgetDto) {
    return this.service.createBudget(req.user.tenantId, dto);
  }

  @Put('budget/:id')
  @ApiOperation({ summary: 'Update budget' })
  updateBudget(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.service.updateBudget(req.user.tenantId, id, dto);
  }
}
