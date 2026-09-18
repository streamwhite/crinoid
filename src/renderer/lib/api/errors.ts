export class ApiError extends Error { constructor(public readonly status: number, message: string) { super(message); this.name = 'ApiError' } }

export function createApiError(status: number, message: string): ApiError { return new ApiError(status, message) }

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) { if (error.status === 401) return 'Request was not authorized'; if (error.status === 403) return 'Request was forbidden'; if (error.status === 404) return 'Requested resource was not found' }
  return 'The request could not be completed'
}
