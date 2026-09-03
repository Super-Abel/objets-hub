import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { storageConfig } from '../config/storage.config';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  controllers: [HealthController],
})
export class HealthModule {}
