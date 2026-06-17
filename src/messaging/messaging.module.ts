import { Module, forwardRef } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/events/events.module';
import { ID_CONVERSATION_REPOSITORY } from './domain/repositories/conversation.repository';
import { ID_MESSAGE_REPOSITORY } from './domain/repositories/message.repository';
import { ID_GROUP_MESSAGE_REPOSITORY } from './domain/repositories/group-message.repository';
import { ConversationInfrastructure } from './infrastructure/conversation.infrastructure';
import { MessageInfrastructure } from './infrastructure/message.infrastructure';
import { GroupMessageInfrastructure } from './infrastructure/group-message.infrastructure';
import { SendMessageHandler } from './application/commands/handler/send-message.handler';
import { DeleteMessageHandler } from './application/commands/handler/delete-message.handler';
import { SendGroupMessageHandler } from './application/commands/handler/send-group-message.handler';
import { CreateConversationHandler } from './application/commands/handler/create-conversation.handler';
import { GetConversationsHandler } from './application/queries/handler/get-conversations.handler';
import { GetMessagesHandler } from './application/queries/handler/get-messages.handler';
import { GetGroupMessagesHandler } from './application/queries/handler/get-group-messages.handler';
import { MessagingController } from './api/messaging.controller';
import { MessagingGateway } from './gateway/messaging.gateway';

@Module({
  imports: [PrismaModule, CqrsModule, forwardRef(() => EventsModule), JwtModule.register({}), ConfigModule],
  controllers: [MessagingController],
  providers: [
    {
      provide: ID_CONVERSATION_REPOSITORY,
      useClass: ConversationInfrastructure,
    },
    {
      provide: ID_MESSAGE_REPOSITORY,
      useClass: MessageInfrastructure,
    },
    {
      provide: ID_GROUP_MESSAGE_REPOSITORY,
      useClass: GroupMessageInfrastructure,
    },
    CreateConversationHandler,
    SendMessageHandler,
    DeleteMessageHandler,
    SendGroupMessageHandler,
    GetConversationsHandler,
    GetMessagesHandler,
    GetGroupMessagesHandler,
    MessagingGateway,
  ],
  exports: [ID_CONVERSATION_REPOSITORY, MessagingGateway],
})
export class MessagingModule {}
