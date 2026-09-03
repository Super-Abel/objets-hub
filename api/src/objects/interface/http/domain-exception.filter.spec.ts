import { ArgumentsHost } from '@nestjs/common';
import { DomainExceptionFilter } from './domain-exception.filter';
import {
  DomainError,
  ImageTooLargeError,
  ObjectNotFoundError,
  UnsupportedImageTypeError,
} from '../../domain/errors';

function mockHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  const filter = new DomainExceptionFilter();

  it('maps a plain DomainError to 400', () => {
    const { host, status, json } = mockHost();

    filter.catch(new DomainError('title is required'), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      error: 'DomainError',
      message: 'title is required',
    });
  });

  it.each([
    [new ObjectNotFoundError('abc'), 404, 'OBJECT_NOT_FOUND'],
    [new UnsupportedImageTypeError('application/pdf', ['image/png']), 415, 'IMAGE_UNSUPPORTED_TYPE'],
    [new ImageTooLargeError(1024), 413, 'IMAGE_TOO_LARGE'],
  ])('maps %s to HTTP %i', (error, expectedStatus, expectedCode) => {
    const { host, status, json } = mockHost();

    filter.catch(error as DomainError, host);

    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: expectedStatus, code: expectedCode }),
    );
  });
});
