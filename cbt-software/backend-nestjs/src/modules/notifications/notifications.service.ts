import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private gateway: NotificationsGateway) {}

  async createNotification(userId: string, title: string, message: string, data?: any) {
    // In a full implementation, save to DB here.
    // For now, emit in real-time.
    this.gateway.sendNotificationToUser(userId, 'notification', { title, message, data });
  }
}
