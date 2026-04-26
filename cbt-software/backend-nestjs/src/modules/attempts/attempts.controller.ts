import { Controller, Post, Body, Param, Get, UseGuards, Request, Delete } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post('start')
  async start(@Request() req: any, @Body('testId') testId: string) {
    return this.attemptsService.startAttempt(req.user.userId, testId);
  }

  @Post(':id/response')
  async submitResponse(
    @Param('id') id: string,
    @Body() body: { questionId: string; answer: string },
  ) {
    return this.attemptsService.submitResponse(id, body.questionId, body.answer);
  }

  @Post(':id/submit')
  async submit(@Param('id') id: string) {
    return this.attemptsService.finishAttempt(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.attemptsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.attemptsService.deleteAttempt(id);
    return { success: true, message: 'Attempt reset successfully' };
  }
}
