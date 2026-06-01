import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ID_MEDIA_REPOSITORY } from './domain/repositories/media.repository';
import { MediaInfrastructure } from './infrastructure/media.infrastructure';
import { StorageService } from './infrastructure/storage.service';
import { UploadMediaHandler } from './application/commands/handler/upload-media.handler';
import { DeleteMediaHandler } from './application/commands/handler/delete-media.handler';
import { GetEventMediaHandler } from './application/queries/handler/get-event-media.handler';
import { MediaController } from './api/media.controller';

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [MediaController],
  providers: [
    {
      provide: ID_MEDIA_REPOSITORY,
      useClass: MediaInfrastructure,
    },
    StorageService,
    UploadMediaHandler,
    DeleteMediaHandler,
    GetEventMediaHandler,
  ],
  exports: [ID_MEDIA_REPOSITORY],
})
export class MediaModule {}
