import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagingGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly messagingService: MessagingService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: { senderId: string; receiverId?: string; classId?: string; content: string }, @ConnectedSocket() client: Socket) {
    const message = await this.messagingService.saveMessage(data);
    
    if (data.classId) {
      // Broadcast to class
      this.server.emit(`class_message_${data.classId}`, message);
    } else if (data.receiverId) {
      // Direct message
      this.server.emit(`user_message_${data.receiverId}`, message);
      this.server.emit(`user_message_${data.senderId}`, message);
    }
    
    return message;
  }
}
