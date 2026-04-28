import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
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
    @Req() req: any, 
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
      // 1. Map Question Text
      const text = item.Question || item.question || item.Text || item.text || item.Content || item.content;
      
      // 2. Map Options (Highly flexible)
      const optA = item['Option A'] || item.optionA || item.A || item.a || item['Option 1'] || item.option1 || item['Choice A'] || item.choiceA;
      const optB = item['Option B'] || item.optionB || item.B || item.b || item['Option 2'] || item.option2 || item['Choice B'] || item.choiceB;
      const optC = item['Option C'] || item.optionC || item.C || item.c || item['Option 3'] || item.option3 || item['Choice C'] || item.choiceC;
      const optD = item['Option D'] || item.optionD || item.D || item.d || item['Option 4'] || item.option4 || item['Choice D'] || item.choiceD;
      
      // 3. Map Correct Answer
      const correct = item['Correct Answer'] || item.correctAnswer || item.Answer || item.answer || item.Correct || item.correct;

      if (!text || !correct) return null;

      // Clean options array
      const options = [optA, optB, optC, optD]
        .filter(o => o !== undefined && o !== null && String(o).trim() !== '')
        .map(o => String(o).trim());

      // If only 1 or 0 options found, try comma separation fallback
      if (options.length < 2 && item.options) {
        const splitOptions = String(item.options).split(',').map(o => o.trim()).filter(Boolean);
        if (splitOptions.length >= 2) options.push(...splitOptions);
      }

      const finalSubject = overrideSubject || item.Subject || item.subject || item.Tag || item.tag || 'General';

      return {
        text: String(text).trim(),
        options: options,
        correctAnswer: String(correct).trim(),
        createdById: req.user.userId,
        tags: [String(finalSubject).trim()],
        schoolId: schoolId || null,
        points: Number(item.Points || item.points || 1),
        explanation: item.Explanation || item.explanation || null
      };
    }).filter(q => q !== null && q.options.length >= 2);

    if (questionsToInsert.length === 0) {
      return { error: 'No valid questions found. Ensure your Excel has columns like "Question", "Option A", "Option B", and "Correct Answer".' };
    }

    const result = await this.questionsService.bulkCreate(questionsToInsert);
    return { message: `Successfully uploaded ${result.count} questions`, count: result.count };
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const schoolId = body.schoolId || req.user.schoolId;
    const data: Prisma.QuestionCreateInput = {
      ...body,
      school: schoolId ? { connect: { id: schoolId } } : undefined,
      createdBy: { connect: { id: req.user.userId } }
    };
    return this.questionsService.create(data);
  }

  @Get('subjects')
  async getSubjects(@Req() req: any, @Query('schoolId') qSchoolId?: string) {
    const schoolId = qSchoolId || req.user.schoolId;
    const subjects = await this.questionsService.getSubjects(schoolId);
    return { subjects };
  }

  @Get('by-subject/:subject')
  async findBySubject(@Param('subject') subject: string, @Req() req: any, @Query('schoolId') qSchoolId?: string) {
    const schoolId = qSchoolId || req.user.schoolId;
    const questions = await this.questionsService.findBySubject(subject, schoolId);
    return { questions };
  }

  @Get()
  async findAll(@Req() req: any, @Query('schoolId') qSchoolId?: string) {
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
