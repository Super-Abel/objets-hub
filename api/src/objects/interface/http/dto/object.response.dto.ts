import { ApiProperty } from '@nestjs/swagger';
import { ObjectView } from '../../../application/object.view';

/** Swagger/response contract for a single Object (matches {@link ObjectView}). */
export class ObjectResponseDto implements ObjectView {
  @ApiProperty({ example: '65f1c0a4d2b8a1e4c9a7b123' })
  id!: string;

  @ApiProperty({ example: 'Vintage camera' })
  title!: string;

  @ApiProperty({ example: 'A 1970s rangefinder in working condition.' })
  description!: string;

  @ApiProperty({
    example: 'http://localhost:9000/objects/objects/2f1c….jpg',
    description: 'Public S3 URL of the uploaded image.',
  })
  imageUrl!: string;

  @ApiProperty({ format: 'date-time', example: '2026-09-03T10:15:00.000Z' })
  createdAt!: string;
}
