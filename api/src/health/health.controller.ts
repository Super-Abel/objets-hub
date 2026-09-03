import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Connection } from 'mongoose';
import { storageConfig } from '../config/storage.config';
import { createS3Client } from '../objects/infrastructure/storage/create-s3-client';

type Check = 'up' | 'down';

interface HealthReport {
  status: 'ok' | 'degraded';
  uptime: number;
  checks: { mongo: Check; storage: Check };
}

/** Liveness/readiness probe: reports whether MongoDB and the object store answer. */
@ApiTags('Health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  private readonly s3: S3Client;

  constructor(
    @InjectConnection() private readonly mongo: Connection,
    @Inject(storageConfig.KEY)
    private readonly storage: ConfigType<typeof storageConfig>,
  ) {
    this.s3 = createS3Client(this.storage);
  }

  @Get()
  @ApiOkResponse({ description: 'All dependencies are reachable.' })
  @ApiServiceUnavailableResponse({
    description: 'At least one dependency is down.',
  })
  async check(): Promise<HealthReport> {
    const [mongo, storage] = await Promise.all([
      this.pingMongo(),
      this.pingStorage(),
    ]);
    const ok = mongo === 'up' && storage === 'up';
    const report: HealthReport = {
      status: ok ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      checks: { mongo, storage },
    };
    if (!ok) {
      throw new HttpException(report, HttpStatus.SERVICE_UNAVAILABLE);
    }
    return report;
  }

  private async pingMongo(): Promise<Check> {
    return this.mongo.readyState === 1 ? 'up' : 'down';
  }

  private async pingStorage(): Promise<Check> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.storage.bucket }));
      return 'up';
    } catch {
      return 'down';
    }
  }
}
