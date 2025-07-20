import { ServiceError, HttpStatusCode } from '@/types';

describe('Types', () => {
  describe('ServiceError', () => {
    it('should create a ServiceError with all parameters', () => {
      const code = 'TEST_ERROR';
      const message = 'Test error message';
      const cause = new Error('Original error');

      const error = new ServiceError(code, message, cause);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.name).toBe('ServiceError');
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.cause).toBe(cause);
    });

    it('should create a ServiceError with only code', () => {
      const code = 'MINIMAL_ERROR';

      const error = new ServiceError(code);

      expect(error.name).toBe('ServiceError');
      expect(error.code).toBe(code);
      expect(error.message).toBe('');
      expect(error.cause).toBeUndefined();
    });

    it('should create a ServiceError with no parameters', () => {
      const error = new ServiceError();

      expect(error.name).toBe('ServiceError');
      expect(error.code).toBeUndefined();
      expect(error.message).toBe('');
      expect(error.cause).toBeUndefined();
    });

    it('should create a ServiceError with code and message', () => {
      const code = 'PARTIAL_ERROR';
      const message = 'Partial error message';

      const error = new ServiceError(code, message);

      expect(error.name).toBe('ServiceError');
      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.cause).toBeUndefined();
    });
  });

  describe('HttpStatusCode', () => {
    it('should have correct success status codes', () => {
      expect(HttpStatusCode.OK).toBe(200);
      expect(HttpStatusCode.CREATED).toBe(201);
      expect(HttpStatusCode.ACCEPTED).toBe(202);
      expect(HttpStatusCode.NO_CONTENT).toBe(204);
    });

    it('should have correct client error status codes', () => {
      expect(HttpStatusCode.BAD_REQUEST).toBe(400);
      expect(HttpStatusCode.UNAUTHORIZED).toBe(401);
      expect(HttpStatusCode.FORBIDDEN).toBe(403);
      expect(HttpStatusCode.NOT_FOUND).toBe(404);
      expect(HttpStatusCode.METHOD_NOT_ALLOWED).toBe(405);
      expect(HttpStatusCode.CONFLICT).toBe(409);
    });

    it('should have correct server error status codes', () => {
      expect(HttpStatusCode.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HttpStatusCode.NOT_IMPLEMENTED).toBe(501);
      expect(HttpStatusCode.BAD_GATEWAY).toBe(502);
      expect(HttpStatusCode.SERVICE_UNAVAILABLE).toBe(503);
    });
  });
});
