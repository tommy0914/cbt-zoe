import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const { questionIds, classId, ...testData } = body;
    const data = {
      ...testData,
      classroom: { connect: { id: classId } },
      createdBy: { connect: { id: req.user.userId } },
      questions: { connect: questionIds.map((id: string) => ({ id })) }
    };
    const test = await this.testsService.create(data);
    return this.testsService.calculateTotalMarks(test.id);
  }

  @Get()
  async findAll() {
    return this.testsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.testsService.findOne(id);
  }
}
