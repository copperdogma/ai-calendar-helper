import { POST as logRoute } from '@/app/api/log/client/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/usage-event.service', () => ({
  logUsageEvent: jest.fn(),
}));

function createRequest(body: unknown) {
  const req = new Request('http://localhost/api/log/client', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  // NextRequest accepts a Request object in its constructor (internal polyfill for tests)
  return new NextRequest(req);
}

describe('log client API', () => {
  it('returns 200 for unrelated logger payload', async () => {
    const req = createRequest({ level: 'info', message: 'hello' });
    const res = await logRoute(req as any);
    expect(res.status).toBe(200);
  });
});
