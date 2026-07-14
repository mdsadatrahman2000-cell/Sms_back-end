import { Module } from '@nestjs/common';
import { CoppaController } from './coppa.controller';
import { CoppaService } from './coppa.service';

@Module({
  controllers: [CoppaController],
  providers: [CoppaService],
  exports: [CoppaService],
})
export class CoppaModule {}
