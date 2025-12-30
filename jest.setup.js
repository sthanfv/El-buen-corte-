const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require('whatwg-fetch');

// Polyfill static Response.json if missing (for NextResponse.json)
if (global.Response && !global.Response.json) {
  global.Response.json = (data, init) => {
    return new global.Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  };
}

require('@testing-library/jest-dom');

// --- Upstash Redis & Ratelimit Mocks for Jest ---
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  })),
}));

jest.mock('@upstash/ratelimit', () => {
  const Ratelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      remaining: 99,
      reset: Date.now() + 60000,
    }),
  }));

  Ratelimit.slidingWindow = jest.fn().mockReturnValue({});
  Ratelimit.fixedWindow = jest.fn().mockReturnValue({});
  Ratelimit.tokenBucket = jest.fn().mockReturnValue({});

  return { Ratelimit };
});
