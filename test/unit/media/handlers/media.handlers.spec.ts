import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UploadMediaHandler } from 'src/media/application/commands/handler/upload-media.handler';
import { DeleteMediaHandler } from 'src/media/application/commands/handler/delete-media.handler';
import { GetEventMediaHandler } from 'src/media/application/queries/handler/get-event-media.handler';
import { ID_MEDIA_REPOSITORY, MediaRepository } from 'src/media/domain/repositories/media.repository';
import { EVENTS_KAY, EventsRepositories } from 'src/events/domain/repositories/events.repositories';
import { EVENT_PARTICIPANT_KEY, EventParticipantRepository } from 'src/events/domain/repositories/event-participant.repository';
import { Events } from 'src/events/domain/entities/events.entities';
import { EventParticipant } from 'src/events/domain/entities/event-participant.entity';
import { Media } from 'src/media/domain/entities/media.entity';
import { StorageService } from 'src/media/infrastructure/storage.service';
import { UploadMediaImpl } from 'src/media/application/commands/impl/upload-media.impl';
import { DeleteMediaImpl } from 'src/media/application/commands/impl/delete-media.impl';
import { GetEventMediaImpl } from 'src/media/application/queries/impl/get-event-media.impl';
import { media_type } from 'generated/prisma/enums';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'generated-media-uuid'),
}));

jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('thumbnail')),
  }));
});

function makeMedia(overrides: Partial<Media> = {}): Media {
  return new Media(
    overrides.id ?? 'media-1',
    overrides.event_id ?? 'event-1',
    overrides.uploader_id ?? 'uploader-1',
    (overrides.media_type ?? 'photo') as media_type,
    overrides.url ?? 'https://bucket.s3.region.amazonaws.com/media/e1/m1.jpg',
    overrides.thumbnail_url ?? null,
    overrides.duration_seconds ?? null,
    overrides.views_count ?? 0,
    overrides.likes_count ?? 0,
    overrides.created_at ?? new Date(),
  );
}

function makeEvent(eventId: string, hostId: string): Events {
  return new Events(
    eventId,
    hostId,
    'Test Event',
    'social',
    new Date(),
    60,
    10,
    1,
    'open' as any,
    true,
  );
}

function makeAcceptedParticipant(eventId: string, userId: string): EventParticipant {
  return new EventParticipant(
    'participant-1',
    eventId,
    userId,
    'accepted' as any,
    new Date(),
  );
}

describe('UploadMediaHandler', () => {
  let handler: UploadMediaHandler;
  let mediaRepo: jest.Mocked<MediaRepository>;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let participantRepo: jest.Mocked<EventParticipantRepository>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(async () => {
    mediaRepo = { create: jest.fn() } as any;
    eventRepo = { findById: jest.fn() } as any;
    participantRepo = { findByEventAndUser: jest.fn() } as any;
    storage = {
      uploadFile: jest.fn(),
      extractKeyFromUrl: jest.fn(),
      deleteFile: jest.fn(),
      getSignedUrl: jest.fn(),
    } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadMediaHandler,
        { provide: ID_MEDIA_REPOSITORY, useValue: mediaRepo },
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: EVENT_PARTICIPANT_KEY, useValue: participantRepo },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    handler = module.get<UploadMediaHandler>(UploadMediaHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should upload an image with thumbnail', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(makeAcceptedParticipant('event-1', 'user-1'));
    storage.uploadFile.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/media/e1/generated-media-uuid.jpg');
    storage.uploadFile.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/media/e1/thumb_generated-media-uuid.jpg');
    const expected = makeMedia({ id: 'generated-media-uuid' });
    mediaRepo.create.mockResolvedValue(expected);

    const result = await handler.execute(
      new UploadMediaImpl('event-1', 'user-1', 'photo.jpg', Buffer.from('image-data'), 'image/jpeg', 'photo'),
    );

    expect(storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(mediaRepo.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('should upload a video without thumbnail', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(makeAcceptedParticipant('event-1', 'user-1'));
    storage.uploadFile.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/media/e1/generated-media-uuid.mp4');
    const expected = makeMedia({ id: 'generated-media-uuid', media_type: 'video' as media_type, url: 'https://bucket.s3.amazonaws.com/media/e1/generated-media-uuid.mp4' });
    mediaRepo.create.mockResolvedValue(expected);

    const result = await handler.execute(
      new UploadMediaImpl('event-1', 'user-1', 'video.mp4', Buffer.from('video-data'), 'video/mp4', 'video'),
    );

    expect(storage.uploadFile).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException for invalid mime type', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(makeAcceptedParticipant('event-1', 'user-1'));

    await expect(
      handler.execute(
        new UploadMediaImpl('event-1', 'user-1', 'file.exe', Buffer.from('data'), 'application/x-msdownload', 'photo'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for overly large file', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(makeAcceptedParticipant('event-1', 'user-1'));
    const bigBuffer = Buffer.alloc(60 * 1024 * 1024);

    await expect(
      handler.execute(
        new UploadMediaImpl('event-1', 'user-1', 'big.jpg', bigBuffer, 'image/jpeg', 'photo'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException on storage error', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(makeAcceptedParticipant('event-1', 'user-1'));
    storage.uploadFile.mockRejectedValue(new Error('S3 error'));

    await expect(
      handler.execute(
        new UploadMediaImpl('event-1', 'user-1', 'photo.jpg', Buffer.from('data'), 'image/jpeg', 'photo'),
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should throw NotFoundException if event does not exist', async () => {
    eventRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UploadMediaImpl('nonexistent-event', 'user-1', 'photo.jpg', Buffer.from('data'), 'image/jpeg', 'photo'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not a participant', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1'));
    participantRepo.findByEventAndUser.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UploadMediaImpl('event-1', 'user-1', 'photo.jpg', Buffer.from('data'), 'image/jpeg', 'photo'),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow upload if user is the event host', async () => {
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'user-1')); // user is host
    storage.uploadFile.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/media/e1/generated-media-uuid.jpg');
    storage.uploadFile.mockResolvedValueOnce('https://bucket.s3.amazonaws.com/media/e1/thumb_generated-media-uuid.jpg');
    const expected = makeMedia({ id: 'generated-media-uuid', uploader_id: 'user-1' });
    mediaRepo.create.mockResolvedValue(expected);

    const result = await handler.execute(
      new UploadMediaImpl('event-1', 'user-1', 'photo.jpg', Buffer.from('image-data'), 'image/jpeg', 'photo'),
    );

    expect(storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(mediaRepo.create).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });
});

describe('DeleteMediaHandler', () => {
  let handler: DeleteMediaHandler;
  let mediaRepo: jest.Mocked<MediaRepository>;
  let eventRepo: jest.Mocked<EventsRepositories>;
  let storage: jest.Mocked<StorageService>;

  beforeEach(async () => {
    mediaRepo = { findById: jest.fn(), delete: jest.fn() } as any;
    eventRepo = { findById: jest.fn() } as any;
    storage = {
      uploadFile: jest.fn(),
      extractKeyFromUrl: jest.fn(),
      deleteFile: jest.fn(),
      getSignedUrl: jest.fn(),
    } as any;

    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteMediaHandler,
        { provide: ID_MEDIA_REPOSITORY, useValue: mediaRepo },
        { provide: EVENTS_KAY, useValue: eventRepo },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    handler = module.get<DeleteMediaHandler>(DeleteMediaHandler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should delete media successfully', async () => {
    const media = makeMedia({ id: 'm1', uploader_id: 'user-1' });
    mediaRepo.findById.mockResolvedValue(media);
    storage.extractKeyFromUrl.mockReturnValue('media/e1/m1.jpg');
    storage.deleteFile.mockResolvedValue(undefined);

    await handler.execute(new DeleteMediaImpl('m1', 'user-1'));

    expect(storage.extractKeyFromUrl).toHaveBeenCalledWith(media.url);
    expect(storage.deleteFile).toHaveBeenCalledWith('media/e1/m1.jpg');
    expect(mediaRepo.delete).toHaveBeenCalledWith('m1');
  });

  it('should delete media with thumbnail', async () => {
    const media = makeMedia({ id: 'm1', uploader_id: 'user-1', thumbnail_url: 'https://bucket.s3.amazonaws.com/media/e1/thumb_m1.jpg' });
    mediaRepo.findById.mockResolvedValue(media);
    storage.extractKeyFromUrl.mockReturnValueOnce('media/e1/m1.jpg').mockReturnValueOnce('media/e1/thumb_m1.jpg');
    storage.deleteFile.mockResolvedValue(undefined);

    await handler.execute(new DeleteMediaImpl('m1', 'user-1'));

    expect(storage.deleteFile).toHaveBeenCalledWith('media/e1/m1.jpg');
    expect(storage.deleteFile).toHaveBeenCalledWith('media/e1/thumb_m1.jpg');
    expect(mediaRepo.delete).toHaveBeenCalledWith('m1');
  });

  it('should throw NotFoundException if media does not exist', async () => {
    mediaRepo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteMediaImpl('bad-id', 'user-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if not the uploader nor the host', async () => {
    const media = makeMedia({ id: 'm1', uploader_id: 'other-user', event_id: 'event-1' });
    mediaRepo.findById.mockResolvedValue(media);
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1')); // host is not user-1

    await expect(
      handler.execute(new DeleteMediaImpl('m1', 'user-1')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow event host to delete media', async () => {
    const media = makeMedia({ id: 'm1', uploader_id: 'uploader-1', event_id: 'event-1' });
    mediaRepo.findById.mockResolvedValue(media);
    eventRepo.findById.mockResolvedValue(makeEvent('event-1', 'host-1')); // host is host-1
    storage.extractKeyFromUrl.mockReturnValue('media/e1/m1.jpg');
    storage.deleteFile.mockResolvedValue(undefined);

    await handler.execute(new DeleteMediaImpl('m1', 'host-1'));

    expect(storage.deleteFile).toHaveBeenCalledWith('media/e1/m1.jpg');
    expect(mediaRepo.delete).toHaveBeenCalledWith('m1');
  });

  it('should not throw on S3 delete failure — just log warning', async () => {
    const media = makeMedia({ id: 'm1', uploader_id: 'user-1', thumbnail_url: 'https://bucket.s3.amazonaws.com/media/e1/thumb_m1.jpg' });
    mediaRepo.findById.mockResolvedValue(media);
    storage.extractKeyFromUrl.mockReturnValueOnce('media/e1/m1.jpg').mockReturnValueOnce('media/e1/thumb_m1.jpg');
    storage.deleteFile.mockRejectedValue(new Error('S3 gone'));

    await handler.execute(new DeleteMediaImpl('m1', 'user-1'));

    expect(mediaRepo.delete).toHaveBeenCalledWith('m1');
  });

  it('should throw InternalServerErrorException on repo delete error', async () => {
    const media = makeMedia({ id: 'm1', uploader_id: 'user-1' });
    mediaRepo.findById.mockResolvedValue(media);
    storage.extractKeyFromUrl.mockReturnValue('media/e1/m1.jpg');
    storage.deleteFile.mockResolvedValue(undefined);
    mediaRepo.delete.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(new DeleteMediaImpl('m1', 'user-1')),
    ).rejects.toThrow(InternalServerErrorException);
  });
});

describe('GetEventMediaHandler', () => {
  let handler: GetEventMediaHandler;
  let mediaRepo: jest.Mocked<MediaRepository>;

  beforeEach(async () => {
    mediaRepo = { findByEventId: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEventMediaHandler,
        { provide: ID_MEDIA_REPOSITORY, useValue: mediaRepo },
      ],
    }).compile();

    handler = module.get<GetEventMediaHandler>(GetEventMediaHandler);
  });

  it('should return media for an event', async () => {
    const expected = [makeMedia({ id: 'm1', event_id: 'event-1' })];
    mediaRepo.findByEventId.mockResolvedValue(expected);

    const result = await handler.execute(new GetEventMediaImpl('event-1'));
    expect(mediaRepo.findByEventId).toHaveBeenCalledWith('event-1');
    expect(result).toEqual(expected);
  });

  it('should return empty array when no media', async () => {
    mediaRepo.findByEventId.mockResolvedValue([]);

    const result = await handler.execute(new GetEventMediaImpl('event-1'));
    expect(result).toEqual([]);
  });
});
