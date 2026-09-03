import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

/** HTTP payload for `POST /objects` — sent as `multipart/form-data`. */
export class CreateObjectRequest {
  @ApiProperty({ example: 'Vintage camera', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'A 1970s rangefinder in working condition.',
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file (jpeg, png, webp or gif).',
  })
  image!: unknown;
}
