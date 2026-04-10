import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Priority } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: { title: string; content: string; classId: string; priority?: Priority }) {
    return this.announcementsService.create({ ...body, createdById: req.user.userId });
  }

  @Get(':classId')
  async findByClass(@Param('classId') classId: string) {
    return this.announcementsService.findByClass(classId);
  }
}
