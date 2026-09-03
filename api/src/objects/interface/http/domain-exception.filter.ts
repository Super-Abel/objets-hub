import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';
import { DomainError, ErrorCode } from '../../domain/errors';

/** How each domain error `code` surfaces over HTTP. Unlisted codes fall back to 400. */
const STATUS_BY_CODE: Partial<Record<ErrorCode, number>> = {
  [ErrorCode.OBJECT_NOT_FOUND]: 404,
  [ErrorCode.IMAGE_REQUIRED]: 400,
  [ErrorCode.IMAGE_UNSUPPORTED_TYPE]: 415,
  [ErrorCode.IMAGE_TOO_LARGE]: 413,
  [ErrorCode.IMAGE_CONTENT_MISMATCH]: 415,
};

/** Translates framework-free domain errors into HTTP responses at the boundary. */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[error.code] ?? 400;

    response.status(status).json({
      statusCode: status,
      code: error.code,
      error: error.name,
      message: error.message,
    });
  }
}
