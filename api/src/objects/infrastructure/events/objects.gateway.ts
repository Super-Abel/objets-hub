import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CollectionObject } from '../../domain/collection-object';
import { ObjectEventPublisher } from '../../domain/ports/object-event-publisher.port';

export const OBJECT_CREATED = 'object:created';
export const OBJECT_UPDATED = 'object:updated';
export const OBJECT_DELETED = 'object:deleted';

/** Adapter binding the ObjectEventPublisher port to Socket.IO. */
// CORS is set once by CorsIoAdapter (main.ts) from CORS_ORIGIN.
@WebSocketGateway()
export class ObjectsGateway implements ObjectEventPublisher {
  @WebSocketServer()
  private readonly server!: Server;

  objectCreated(object: CollectionObject): void {
    this.server.emit(OBJECT_CREATED, this.toPayload(object));
  }

  objectUpdated(object: CollectionObject): void {
    this.server.emit(OBJECT_UPDATED, this.toPayload(object));
  }

  objectDeleted(id: string): void {
    this.server.emit(OBJECT_DELETED, { id });
  }

  /**
   * Same payload shape as the REST ObjectView, kept inline so this adapter has
   * no dependency on the HTTP layer.
   */
  private toPayload(object: CollectionObject) {
    return {
      id: object.id,
      title: object.title,
      description: object.description,
      imageUrl: object.imageUrl,
      createdAt: object.createdAt.toISOString(),
    };
  }
}
