import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const { questionIds, classId, ...testData } = body;
    const data = {
      ...testData,
      title: testData.title || testData.testName || 'Untitled Test',
      classroom: { connect: { id: classId } },
      createdBy: { connect: { id: req.user.userId } },
      questions: { connect: questionIds.map((id: string) => ({ id })) }
    };
    const test = await this.testsService.create(data);
    const updated = (await this.testsService.calculateTotalMarks(test.id)) || test;
    return { message: 'Test created', test: { ...updated, _id: updated.id, testName: updated.title } };
  }

  @Get()
  async findAll() {
    const tests = await this.testsService.findAll();
    return {
      tests: tests.map((t: any) => ({ ...t, _id: t.id, testName: t.title })),
    };
  }

  @Get('list')
  async list(@Query('page') page = '1', @Query('pageSize') pageSize = '10') {
    const data = await this.testsService.list(Number(page), Number(pageSize));
    return {
      ...data,
      tests: data.tests.map((t: any) => ({ ...t, _id: t.id, testName: t.title })),
    };
  }

  @Get('search')
  async search(@Query('page') page = '1', @Query('pageSize') pageSize = '10') {
    const data = await this.testsService.search(Number(page), Number(pageSize));
    return {
      ...data,
      tests: data.tests.map((t: any) => ({ ...t, _id: t.id, testName: t.title })),
    };
  }

  @Get('start/:id')
  @UseGuards(JwtAuthGuard)
  async start(@Request() req: any, @Param('id') id: string) {
    return this.testsService.startAttempt(req.user.userId, id);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(@Request() req: any, @Body() body: any) {
    return this.testsService.submitAttempt(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const updated = await this.testsService.updateTest(id, body);
    return { message: 'Test updated', test: { ...updated, _id: updated.id, testName: updated.title } };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/exceptions')
  async createException(@Param('id') id: string, @Body() body: any) {
    return {
      success: true,
      message: 'Exception recorded',
      exception: { _id: `${id}_${Date.now()}`, testId: id, ...body },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const test = await this.testsService.findOne(id);
    return test ? { test: { ...test, _id: test.id, testName: test.title } } : { test: null };
  }
}
