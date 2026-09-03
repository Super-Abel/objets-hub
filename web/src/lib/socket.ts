'use client';

import { io, type Socket } from 'socket.io-client';
import { API_URL } from './config';
import type { CollectionObject } from './types';

/** Events the API gateway pushes (see api `ObjectsGateway`). */
export interface ServerToClientEvents {
  'object:created': (object: CollectionObject) => void;
  'object:deleted': (payload: { id: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents>;

let socket: AppSocket | null = null;

/** Lazily created, shared connection — every hook reuses the same socket. */
export function getSocket(): AppSocket {
  if (!socket) {
    socket = io(API_URL, { transports: ['websocket'], autoConnect: true });
  }
  return socket;
}
