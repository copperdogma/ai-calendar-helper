export class ApiError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, message: string, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    this.name = this.constructor.name;
  }
}
