import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, IssueBookDto, ReturnBookDto } from './dto/library.dto';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async createBook(tenantId: string, dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        tenantId,
        title: dto.title,
        author: dto.author,
        isbn: dto.isbn,
        publisher: dto.publisher,
        quantity: dto.quantity,
        available: dto.quantity,
        category: dto.categoryId,
        shelfLocation: dto.shelfLocation,
      },
    });
  }

  async getBooks(tenantId: string, page = 1, limit = 20, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count({ where }),
    ]);

    return { books, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getBook(tenantId: string, id: string) {
    const book = await this.prisma.book.findFirst({
      where: { tenantId, id },
      include: { issues: { where: { status: 'issued' }, include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } } } },
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async updateBook(tenantId: string, id: string, data: any) {
    const book = await this.prisma.book.findFirst({ where: { tenantId, id } });
    if (!book) throw new NotFoundException('Book not found');
    return this.prisma.book.update({ where: { id }, data });
  }

  async deleteBook(tenantId: string, id: string) {
    const book = await this.prisma.book.findFirst({ where: { tenantId, id } });
    if (!book) throw new NotFoundException('Book not found');
    await this.prisma.book.delete({ where: { id } });
    return { message: 'Book deleted' };
  }

  async issueBook(tenantId: string, dto: IssueBookDto) {
    const book = await this.prisma.book.findFirst({ where: { tenantId, id: dto.bookId } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.available <= 0) throw new BadRequestException('No copies available');

    const student = await this.prisma.student.findFirst({ where: { tenantId, id: dto.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.book.update({ where: { id: dto.bookId }, data: { available: book.available - 1 } });

    return this.prisma.bookIssue.create({
      data: {
        tenantId,
        bookId: dto.bookId,
        studentId: dto.studentId,
        dueDate: new Date(dto.dueDate),
      },
      include: { book: { select: { title: true } }, student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async returnBook(tenantId: string, issueId: string, dto: ReturnBookDto) {
    const issue = await this.prisma.bookIssue.findFirst({ where: { tenantId, id: issueId } });
    if (!issue) throw new NotFoundException('Issue not found');
    if (issue.status === 'returned') throw new BadRequestException('Already returned');

    await this.prisma.book.update({ where: { id: issue.bookId }, data: { available: { increment: 1 } } });

    return this.prisma.bookIssue.update({
      where: { id: issueId },
      data: { returnDate: new Date(), status: 'returned', notes: dto.remarks },
    });
  }

  async getIssuedBooks(tenantId: string) {
    return this.prisma.bookIssue.findMany({
      where: { tenantId, status: 'issued' },
      include: {
        book: { select: { title: true, author: true } },
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { issueDate: 'desc' },
    });
  }
}
