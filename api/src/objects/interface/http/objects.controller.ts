import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ListObjectsQueryDto } from './dto/list-objects.query';
import { CreateObjectUseCase } from '../../application/create-object.use-case';
import { DeleteObjectUseCase } from '../../application/delete-object.use-case';
import { GetObjectUseCase } from '../../application/get-object.use-case';
import { ListObjectsUseCase } from '../../application/list-objects.use-case';
import { CreateObjectRequest } from './dto/create-object.request';
import { ObjectResponseDto } from './dto/object.response.dto';
import { ObjectView, toObjectView } from '../../application/object.view';

/** Driving adapter: exposes the object use cases over REST. */
@ApiTags('Objects')
@Controller('objects')
export class ObjectsController {
  constructor(
    private readonly createObject: CreateObjectUseCase,
    private readonly listObjects: ListObjectsUseCase,
    private readonly getObject: GetObjectUseCase,
    private readonly deleteObject: DeleteObjectUseCase,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create an object (uploads its image to S3)' })
  @ApiCreatedResponse({ type: ObjectResponseDto })
  async create(
    @Body() body: CreateObjectRequest,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ObjectView> {
    const object = await this.createObject.execute({
      title: body.title,
      description: body.description,
      image: image && {
        buffer: image.buffer,
        mimeType: image.mimetype,
        originalName: image.originalname,
        size: image.size,
      },
    });
    return toObjectView(object);
  }

  @Get()
  @ApiOperation({ summary: 'List objects (newest first, bounded window)' })
  @ApiOkResponse({ type: ObjectResponseDto, isArray: true })
  async findAll(@Query() query: ListObjectsQueryDto): Promise<ObjectView[]> {
    const objects = await this.listObjects.execute(query);
    return objects.map(toObjectView);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single object by id' })
  @ApiParam({ name: 'id', example: '65f1c0a4d2b8a1e4c9a7b123' })
  @ApiOkResponse({ type: ObjectResponseDto })
  @ApiNotFoundResponse({ description: 'No object with this id.' })
  async findOne(@Param('id') id: string): Promise<ObjectView> {
    return toObjectView(await this.getObject.execute(id));
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an object and its S3 image' })
  @ApiParam({ name: 'id', example: '65f1c0a4d2b8a1e4c9a7b123' })
  @ApiNoContentResponse({ description: 'Deleted.' })
  @ApiNotFoundResponse({ description: 'No object with this id.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.deleteObject.execute(id);
  }
}
