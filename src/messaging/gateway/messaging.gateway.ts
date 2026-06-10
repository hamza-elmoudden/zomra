import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  },
  namespace: "/messaging",
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Rejected unauthenticated socket: ${client.id}`);
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      this.logger.log(`Socket connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.logger.warn(`Rejected socket with invalid token: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  @SubscribeMessage("joinConversation")
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`)
  }

  @SubscribeMessage("leaveConversation")
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`)
  }

  @SubscribeMessage("joinEventRoom")
  handleJoinEventRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string },
  ) {
    client.join(`event:${data.eventId}`)
  }

  @SubscribeMessage("leaveEventRoom")
  handleLeaveEventRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { eventId: string },
  ) {
    client.leave(`event:${data.eventId}`)
  }

  sendNewMessage(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit("newMessage", message)
  }

  sendNewGroupMessage(eventId: string, message: any) {
    this.server.to(`event:${eventId}`).emit("newGroupMessage", message)
  }

  sendMessageDeleted(conversationId: string, messageId: string) {
    this.server.to(`conversation:${conversationId}`).emit("messageDeleted", { messageId })
  }

  sendEventJoinRequest(eventId: string, hostId: string, data: { userId: string; userName: string; eventTitle: string }) {
    this.server.to(`user:${hostId}`).emit("eventJoinRequest", { eventId, ...data })
  }

  sendParticipantStatusUpdate(userId: string, data: { eventId: string; eventTitle: string; status: string }) {
    this.server.to(`user:${userId}`).emit("participantStatusUpdate", data)
  }
}
