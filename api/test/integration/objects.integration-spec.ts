import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { CreateObjectUseCase } from '../../src/objects/application/create-object.use-case';
import { DeleteObjectUseCase } from '../../src/objects/application/delete-object.use-case';
import { GetObjectUseCase } from '../../src/objects/application/get-object.use-case';
import { ListObjectsUseCase } from '../../src/objects/application/list-objects.use-case';
import { UpdateObjectUseCase } from '../../src/objects/application/update-object.use-case';
import { storageConfig } from '../../src/config/storage.config';
import { IMAGE_STORAGE } from '../../src/objects/domain/ports/image-storage.port';
import { OBJECT_EVENT_PUBLISHER } from '../../src/objects/domain/ports/object-event-publisher.port';
import { OBJECT_JOB_QUEUE } from '../../src/objects/domain/ports/object-job-queue.port';
import { OBJECT_REPOSITORY } from '../../src/objects/domain/ports/object-repository.port';
import { DomainExceptionFilter } from '../../src/objects/interface/http/domain-exception.filter';
import { ObjectsController } from '../../src/objects/interface/http/objects.controller';
import { FakeObjectJobQueue } from '../../src/objects/testing/fake-object-job-queue';
import { InMemoryImageStorage } from '../../src/objects/testing/in-memory-image-storage';
import { InMemoryObjectRepository } from '../../src/objects/testing/in-memory-object.repository';
import { RecordingEventPublisher } from '../../src/objects/testing/recording-event-publisher';

const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('Objects HTTP (integration)', () => {
  let app: INestApplication;
  let repository: InMemoryObjectRepository;
  let storage: InMemoryImageStorage;
  let events: RecordingEventPublisher;

  beforeEach(async () => {
    repository = new InMemoryObjectRepository();
    storage = new InMemoryImageStorage();
    events = new RecordingEventPublisher();

    const moduleRef = await Test.createTestingModule({
      controllers: [ObjectsController],
      providers: [
        CreateObjectUseCase,
        ListObjectsUseCase,
        GetObjectUseCase,
        UpdateObjectUseCase,
        DeleteObjectUseCase,
        { provide: OBJECT_REPOSITORY, useValue: repository },
        { provide: IMAGE_STORAGE, useValue: storage },
        { provide: OBJECT_EVENT_PUBLISHER, useValue: events },
        { provide: OBJECT_JOB_QUEUE, useValue: new FakeObjectJobQueue() },
        { provide: storageConfig.KEY, useValue: { maxImageBytes: 5 * 1024 * 1024 } },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const create = (title = 'Vintage camera', description = 'A 1970s rangefinder.') =>
    request(app.getHttpServer())
      .post('/objects')
      .field('title', title)
      .field('description', description)
      .attach('image', PNG_1x1, { filename: 'camera.png', contentType: 'image/png' });

  it('creates an object, then lists / fetches / deletes it end to end', async () => {
    const created = await create().expect(201);

    expect(created.body).toEqual({
      id: expect.any(String),
      title: 'Vintage camera',
      description: 'A 1970s rangefinder.',
      imageUrl: expect.stringContaining('http'),
      createdAt: expect.any(String),
    });
    expect(created.body).not.toHaveProperty('imageKey');
    expect(storage.uploads).toHaveLength(1);
    expect(events.created).toHaveLength(1);

    const id = created.body.id as string;

    const list = await request(app.getHttpServer()).get('/objects').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(id);

    const one = await request(app.getHttpServer()).get(`/objects/${id}`).expect(200);
    expect(one.body.id).toBe(id);

    const patched = await request(app.getHttpServer())
      .patch(`/objects/${id}`)
      .field('title', 'Restored camera')
      .expect(200);
    expect(patched.body).toMatchObject({ id, title: 'Restored camera' });
    expect(patched.body.description).toBe('A 1970s rangefinder.'); // untouched
    expect(events.updated).toHaveLength(1);

    const patchedImage = await request(app.getHttpServer())
      .patch(`/objects/${id}`)
      .attach('image', PNG_1x1, { filename: 'new.png', contentType: 'image/png' })
      .expect(200);
    expect(patchedImage.body.imageUrl).toEqual(expect.stringContaining('http'));
    expect(storage.uploads).toHaveLength(2);
    expect(storage.deleted).toHaveLength(1); // the replaced image

    await request(app.getHttpServer()).delete(`/objects/${id}`).expect(204);
    expect(events.deleted).toEqual([id]);
    expect(storage.deleted).toHaveLength(2); // replaced image + the final one

    await request(app.getHttpServer()).get('/objects').expect(200).expect([]);
  });

  it('returns 404 with the OBJECT_NOT_FOUND code for an unknown id', async () => {
    const res = await request(app.getHttpServer())
      .get('/objects/deadbeef')
      .expect(404);

    expect(res.body).toMatchObject({
      statusCode: 404,
      code: 'OBJECT_NOT_FOUND',
    });
  });

  it('rejects a create with no title via the DTO validation pipe (400)', async () => {
    await request(app.getHttpServer())
      .post('/objects')
      .field('description', 'no title here')
      .attach('image', PNG_1x1, { filename: 'c.png', contentType: 'image/png' })
      .expect(400);

    expect(storage.uploads).toHaveLength(0);
  });

  it('rejects a create with no image file (IMAGE_REQUIRED) and stores nothing', async () => {
    const res = await request(app.getHttpServer())
      .post('/objects')
      .field('title', 'Vintage camera')
      .field('description', 'A 1970s rangefinder.')
      .expect(400);

    expect(res.body.code).toBe('IMAGE_REQUIRED');
    expect(repository.size).toBe(0);
  });

  it('rolls back the uploaded image when the DB write fails', async () => {
    repository.failNextSaveWith = new Error('mongo down');

    await create().expect(500);

    expect(storage.uploads).toHaveLength(1);
    expect(storage.liveKeys).toHaveLength(0);
    expect(repository.size).toBe(0);
    expect(events.created).toHaveLength(0);
  });
});
