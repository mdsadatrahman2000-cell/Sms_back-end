import { Module } from '@nestjs/common';
import { ScholarshipsService } from './scholarships.service';
import { ScholarshipsController } from './scholarships.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScholarshipsController],
  providers: [ScholarshipsService],
})
export class ScholarshipsModule {}
