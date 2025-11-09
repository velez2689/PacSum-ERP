import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.JWT_ACCESS_SECRET = 'test-secret-access'
process.env.JWT_REFRESH_SECRET = 'test-secret-refresh'
process.env.JWT_EMAIL_VERIFICATION_SECRET = 'test-secret-email'
process.env.JWT_PASSWORD_RESET_SECRET = 'test-secret-password'

// Add TextEncoder/TextDecoder polyfill for tests
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}

// Mock fetch globally if not available
if (!global.fetch) {
  global.fetch = jest.fn()
}
