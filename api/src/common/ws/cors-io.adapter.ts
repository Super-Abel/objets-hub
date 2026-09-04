import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

/**
 * Socket.IO adapter that applies the same CORS origin as the REST layer, so the
 * allowed origin lives in one place (`CORS_ORIGIN`) instead of being hard-coded
 * on the `@WebSocketGateway()` decorator.
 */
export class CorsIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origin: string | string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origin },
    });
  }
}
