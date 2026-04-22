import { Module } from '@nestjs/common';
import { QuickWinsController } from './quickwins.controller';
import { QuickWinsService } from './quickwins.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuickWinsController],
  providers: [QuickWinsService],
})
export class QuickWinsModule {}
