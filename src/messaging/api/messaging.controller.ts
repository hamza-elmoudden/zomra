import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/decorators";
import { User } from "src/users/domain/entities/user.entity";
import { Conversation } from "../domain/entities/conversation.entity";
import { Message } from "../domain/entities/message.entity";
import { GroupMessage } from "../domain/entities/group-message.entity";
import { SendMessageDto } from "./dto/send-message.dto";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageImpl } from "../application/commands/impl/send-message.impl";
import { DeleteMessageImpl } from "../application/commands/impl/delete-message.impl";
import { SendGroupMessageImpl } from "../application/commands/impl/send-group-message.impl";
import { CreateConversationImpl } from "../application/commands/impl/create-conversation.impl";
import { GetConversationsImpl } from "../application/queries/impl/get-conversations.impl";
import { GetMessagesImpl } from "../application/queries/impl/get-messages.impl";
import { GetGroupMessagesImpl } from "../application/queries/impl/get-group-messages.impl";

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagingController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: User,
  ): Promise<Conversation> {
    return this.commandBus.execute(new CreateConversationImpl(user.id, dto.recipientId, dto.eventId))
  }

  @Get('conversations')
  async getConversations(@CurrentUser() user: User): Promise<Conversation[]> {
    return this.queryBus.execute(new GetConversationsImpl(user.id))
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() user: User,
  ): Promise<Message[]> {
    return this.queryBus.execute(new GetMessagesImpl(conversationId, user.id))
  }

  @Post('conversations/:conversationId/messages')
  async sendMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<Message> {
    return this.commandBus.execute(new SendMessageImpl(user.id, conversationId, dto.content))
  }

  @Delete('messages/:messageId')
  async deleteMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.commandBus.execute(new DeleteMessageImpl(messageId, user.id))
  }

  @Get('events/:eventId/messages')
  async getGroupMessages(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: User,
  ): Promise<GroupMessage[]> {
    return this.queryBus.execute(new GetGroupMessagesImpl(eventId, user.id))
  }

  @Post('events/:eventId/messages')
  async sendGroupMessage(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ): Promise<GroupMessage> {
    return this.commandBus.execute(new SendGroupMessageImpl(user.id, eventId, dto.content))
  }
}
