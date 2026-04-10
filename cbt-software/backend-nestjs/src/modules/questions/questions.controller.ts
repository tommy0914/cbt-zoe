import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { Prisma, QuestionType, Difficulty } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const data: Prisma.QuestionCreateInput = {
      ...body,
      createdBy: { connect: { id: req.user.userId } }
    };
    return this.questionsService.create(data);
  }

  @Get()
  async findAll() {
    return this.questionsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: Prisma.QuestionUpdateInput) {
    return this.questionsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.questionsService.remove(id);
  }
}
