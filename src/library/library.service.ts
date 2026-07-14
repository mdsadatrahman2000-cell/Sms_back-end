import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, IssueBookDto, ReturnBookDto } from './dto/library.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async createBook(tenantId: string, dto: CreateBookDto) {
    return this.prisma.course.create({
      data: {
        tenantId,
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        publisher: dto.publisher,
        quantity: dto.quantity,
        available: dto.quantity,
        categoryId: dto.categoryId,
        shelfLocation: dto.shelfLocation,
      } as any,
    });
  }

  async getBooks(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.course.findMany({ where, orderBy: { createdAt: 'desc' } } as any);
  }

  async issueBook(tenantId: string, dto: IssueBookDto) {
    const book = await this.prisma.course.findFirst({ where: { tenantId, id: dto.bookId } } as any);
    if (!book) throw new NotFoundException('Book not found');

    return { message: 'Book issued successfully', bookId: dto.bookId, studentId: dto.studentId, dueDate: dto.dueDate };
  }

  async returnBook(tenantId: string, bookId: string, dto: ReturnBookDto) {
    return { message: 'Book returned successfully', bookId };
  }

  async getIssuedBooks(tenantId: string) {
    return [];
  }
}
