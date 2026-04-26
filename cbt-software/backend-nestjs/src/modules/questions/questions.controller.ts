import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
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
  async uploadFile(
    @UploadedFile() file: Express.Multer.File, 
    @Request() req: any, 
    @Body('schoolId') bodySchoolId?: string,
    @Body('overrideSubject') overrideSubject?: string
  ) {
    if (!file) {
      return { error: 'No file uploaded' };
    }

    const schoolId = req.query.schoolId || bodySchoolId || req.user.schoolId;

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonQuestions = xlsx.utils.sheet_to_json(worksheet);

    const questionsToInsert = jsonQuestions.map((item: any) => {
      // Robust header matching
      const text = item.Question || item.question || item.Text || item.text;
      const optA = item['Option A'] || item.optionA || item.A || item.a || item.options?.split(',')[0];
      const optB = item['Option B'] || item.optionB || item.B || item.b || item.options?.split(',')[1];
      const optC = item['Option C'] || item.optionC || item.C || item.c || item.options?.split(',')[2];
      const optD = item['Option D'] || item.optionD || item.D || item.d || item.options?.split(',')[3];
      const correct = item['Correct Answer'] || item.correctAnswer || item.Answer || item.answer;

      if (!text || !correct) return null;

      const finalSubject = overrideSubject || item.Subject || item.subject || item.Tag || item.tag || 'General';

      return {
        text: String(text),
        options: [optA, optB, optC, optD].filter(o => o !== undefined).map(o => String(o)),
        correctAnswer: String(correct),
        createdById: req.user.userId,
        tags: [String(finalSubject)],
        schoolId: schoolId || null,
      };
    }).filter(q => q !== null);

    if (questionsToInsert.length === 0) {
      return { error: 'No valid questions found in the file. Please check your column headers.' };
    }

    const result = await this.questionsService.bulkCreate(questionsToInsert);
    return { message: 'Successfully uploaded questions', count: result.count };
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const schoolId = body.schoolId || req.user.schoolId;
    const data: Prisma.QuestionCreateInput = {
      ...body,
      school: schoolId ? { connect: { id: schoolId } } : undefined,
      createdBy: { connect: { id: req.user.userId } }
    };
    return this.questionsService.create(data);
  }

  @Get('subjects')
  async getSubjects(@Request() req: any, @Query('schoolId') qSchoolId?: string) {
    const schoolId = qSchoolId || req.user.schoolId;
    const subjects = await this.questionsService.getSubjects(schoolId);
    return { subjects };
  }

  @Get('by-subject/:subject')
  async findBySubject(@Param('subject') subject: string, @Request() req: any, @Query('schoolId') qSchoolId?: string) {
    const schoolId = qSchoolId || req.user.schoolId;
    const questions = await this.questionsService.findBySubject(subject, schoolId);
    return { questions };
  }

  @Get()
  async findAll(@Request() req: any, @Query('schoolId') qSchoolId?: string) {
    const schoolId = qSchoolId || req.user.schoolId;
    return this.questionsService.findAll(schoolId);
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
