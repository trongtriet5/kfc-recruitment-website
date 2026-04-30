import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
@Injectable()
export class CandidateGateway {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('CandidateGateway');

  emitCandidateCreated(candidate: any) {
    this.logger.debug(`Emitting candidate_created: ${candidate.id}`);
    this.server.emit('candidate_created', candidate);
  }

  emitNotification(notification: any) {
    this.logger.debug(`Emitting notification: ${notification.id}`);
    this.server.emit('notification_received', notification);
  }
}
