import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * HTTP payload for `PATCH /objects/:id` — sent as `multipart/form-data`.
 * Every field is optional: send only what changes. An `image` part, when
 * present, replaces the stored image.
 */
export class UpdateObjectRequest {
  @ApiPropertyOptional({ example: 'Vintage camera', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    example: 'A 1970s rangefinder in working condition.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Replacement image file (jpeg, png, webp or gif).',
  })
  image?: unknown;
}
