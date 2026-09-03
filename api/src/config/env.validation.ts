import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

/**
 * Every environment variable the API needs to boot. Checked once at startup so a
 * missing/blank value fails fast with a clear message instead of surfacing as an
 * obscure runtime error later. Variables owned by optional features (e.g. the
 * job queue) are validated in their own `registerAs` config, not here.
 */
class EnvVars {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsString()
  @MinLength(1)
  MONGODB_URI!: string;

  @IsString()
  @MinLength(1)
  S3_ENDPOINT!: string;

  @IsOptional()
  @IsString()
  S3_REGION?: string;

  @IsString()
  @MinLength(1)
  S3_BUCKET!: string;

  @IsString()
  @MinLength(1)
  S3_ACCESS_KEY!: string;

  @IsString()
  @MinLength(1)
  S3_SECRET_KEY!: string;

  @IsString()
  @MinLength(1)
  S3_PUBLIC_URL!: string;

  @IsOptional()
  @IsString()
  S3_FORCE_PATH_STYLE?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  S3_MAX_IMAGE_BYTES?: number;

  @IsOptional()
  @IsString()
  S3_KEY_PREFIX?: string;
}

export function validateEnv(raw: Record<string, unknown>): EnvVars {
  const parsed = plainToInstance(EnvVars, raw, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(parsed, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return parsed;
}
