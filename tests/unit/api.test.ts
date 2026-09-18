import { describe, expect, it } from 'vitest'
import { createApiError, getErrorMessage } from '../../src/renderer/lib/api/errors'

describe('API errors', () => {
  it('normalizes HTTP failures without leaking response bodies', () => {
    const error = createApiError(401, 'Unauthorized')
    expect(error.status).toBe(401)
    expect(getErrorMessage(error)).toBe('Request was not authorized')
  })
})
