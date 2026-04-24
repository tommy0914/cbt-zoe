import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TestEngineService } from './test-engine.service';

@Controller('test-engine')
@UseGuards(JwtAuthGuard)
export class TestEngineController {
  constructor(private readonly testEngineService: TestEngineService) {}

  @Get('class/:classId')
  async getTestsByClass(@Param('classId') classId: string) {
    const tests = await this.testEngineService.getTestsByClass(classId);
    return { tests: tests.map((t: any) => ({ ...t, _id: t.id })) };
  }

  @Get(':id')
  async getTest(@Param('id') id: string) {
    const test = await this.testEngineService.getTestWithQuestions(id);
    return {
      ...test,
      _id: test.id,
      questions: (test.questions || []).map((q: any) => ({ ...q, _id: q.id })),
    };
  }

  @Post(':id/start')
  async start(@Param('id') id: string, @Req() req: any) {
    return this.testEngineService.startOrResumeAttempt(req.user.userId, id);
  }

  @Patch(':id/save-progress')
  async saveProgress(@Param('id') id: string, @Req() req: any, @Body('responses') responses: any[]) {
    return this.testEngineService.saveProgress(req.user.userId, id, responses);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string, @Req() req: any, @Body('responses') responses: any[]) {
    return this.testEngineService.submitTest(req.user.userId, id, responses);
  }
}
