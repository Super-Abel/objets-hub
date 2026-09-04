import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CorsIoAdapter } from './common/ws/cors-io.adapter';

/**
 * `CORS_ORIGIN` is a comma-separated list of allowed origins (one entry is the
 * common case). Platform env vars (Render `fromService`) expose a bare hostname,
 * so prefix `https://` when a scheme is missing. `*` anywhere means "any origin".
 */
function parseCorsOrigin(value: string): string | string[] {
  const origins = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) =>
      entry === '*' || /^https?:\/\//i.test(entry)
        ? entry
        : `https://${entry.replace(/\/+$/, '')}`,
    );

  if (origins.length === 0 || origins.includes('*')) return '*';
  return origins.length === 1 ? origins[0] : origins;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigin = parseCorsOrigin(config.get<string>('CORS_ORIGIN', '*'));

  // `crossOriginResourcePolicy` off: images are served from a different origin (S3/MinIO).
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({ origin: corsOrigin });
  app.useWebSocketAdapter(new CorsIoAdapter(app, corsOrigin));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const openApi = new DocumentBuilder()
    .setTitle('Objects API')
    .setDescription('Manage a collection of Objects (title, description, image).')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, openApi),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`API ready on port ${port} (docs at /docs)`);
}
bootstrap();
