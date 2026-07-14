import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LibraryService } from './library.service';
import { CreateBookDto, IssueBookDto, ReturnBookDto } from './dto/library.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../auth/decorators/tenant-id.decorator';

@Controller('library')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('books')
  @Roles('school_admin', 'librarian')
  createBook(@TenantId() tenantId: string, @Body() dto: CreateBookDto) {
    return this.libraryService.createBook(tenantId, dto);
  }

  @Get('books')
  @Roles('school_admin', 'librarian', 'teacher', 'student')
  getBooks(@TenantId() tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.libraryService.getBooks(tenantId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, search);
  }

  @Get('books/:id')
  @Roles('school_admin', 'librarian', 'teacher', 'student')
  getBook(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.libraryService.getBook(tenantId, id);
  }

  @Patch('books/:id')
  @Roles('school_admin', 'librarian')
  updateBook(@TenantId() tenantId: string, @Param('id') id: string, @Body() data: any) {
    return this.libraryService.updateBook(tenantId, id, data);
  }

  @Delete('books/:id')
  @Roles('school_admin', 'librarian')
  deleteBook(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.libraryService.deleteBook(tenantId, id);
  }

  @Post('issue')
  @Roles('school_admin', 'librarian')
  issueBook(@TenantId() tenantId: string, @Body() dto: IssueBookDto) {
    return this.libraryService.issueBook(tenantId, dto);
  }

  @Post('return/:issueId')
  @Roles('school_admin', 'librarian')
  returnBook(@TenantId() tenantId: string, @Param('issueId') issueId: string, @Body() dto: ReturnBookDto) {
    return this.libraryService.returnBook(tenantId, issueId, dto);
  }

  @Get('issued')
  @Roles('school_admin', 'librarian')
  getIssuedBooks(@TenantId() tenantId: string) {
    return this.libraryService.getIssuedBooks(tenantId);
  }
}
