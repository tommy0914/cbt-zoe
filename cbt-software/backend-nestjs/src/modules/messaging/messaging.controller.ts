import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('class/:classId')
  async getMessagesByClass(@Param('classId') classId: string) {
    return this.messagingService.getMessagesByClass(classId);
  }

  @Get('direct/:receiverId')
  async getDirectMessages(@Request() req: any, @Param('receiverId') receiverId: string) {
    return this.messagingService.getDirectMessages(req.user.userId, receiverId);
  }
}
