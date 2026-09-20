export class AppError extends Error {
  constructor(
    public code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT',
    message: string,
    public status: number,
  ) {
    super(message)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super('FORBIDDEN', message, 403)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
  }
}

export function sendError(res: any, e: unknown) {
  if (e instanceof AppError) {
    return res.status(e.status).json({ data: null, error: { code: e.code, message: e.message } })
  }
  if (e && typeof e === 'object' && 'issues' in e) {
    return res.status(400).json({ data: null, error: { code: 'VALIDATION_ERROR', message: (e as any).message } })
  }
  res.status(500).json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } })
}
