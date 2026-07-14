import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
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
  getBooks(@TenantId() tenantId: string, @Query('search') search?: string) {
    return this.libraryService.getBooks(tenantId, search);
  }

  @Post('issue')
  @Roles('school_admin', 'librarian')
  issueBook(@TenantId() tenantId: string, @Body() dto: IssueBookDto) {
    return this.libraryService.issueBook(tenantId, dto);
  }

  @Post('return/:bookId')
  @Roles('school_admin', 'librarian')
  returnBook(@TenantId() tenantId: string, @Param('bookId') bookId: string, @Body() dto: ReturnBookDto) {
    return this.libraryService.returnBook(tenantId, bookId, dto);
  }

  @Get('issued')
  @Roles('school_admin', 'librarian')
  getIssuedBooks(@TenantId() tenantId: string) {
    return this.libraryService.getIssuedBooks(tenantId);
  }
}
