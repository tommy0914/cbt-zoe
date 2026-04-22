import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsService } from './questions.service';
import { Prisma, QuestionType, Difficulty } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import * as xlsx from 'xlsx';

@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      return { error: 'No file uploaded' };
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonQuestions = xlsx.utils.sheet_to_json(worksheet);

    const questionsToInsert = jsonQuestions.map((item: any) => ({
      text: item.Question,
      options: [item['Option A'], item['Option B'], item['Option C'], item['Option D']],
      correctAnswer: String(item['Correct Answer']),
      createdById: req.user.userId,
      tags: item.Subject ? [item.Subject] : ['General'],
    }));

    const result = await this.questionsService.bulkCreate(questionsToInsert);
    return { message: 'Successfully uploaded questions', count: result.count };
  }

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
