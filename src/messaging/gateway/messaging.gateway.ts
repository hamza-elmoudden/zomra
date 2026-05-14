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
import { UseGuards } from "@nestjs/common";

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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`)
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
}
