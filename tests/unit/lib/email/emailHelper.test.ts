import { sendSignupNotification, sendDailyUsageReport } from '@/lib/email';

// Mock the global eval function to intercept dynamic imports
const originalEval = global.eval;

const mockSendMail = jest.fn().mockResolvedValue({});
const mockCreateTransport = jest.fn().mockReturnValue({
  sendMail: mockSendMail,
});

describe('email helper', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
    mockCreateTransport.mockClear();

    // Mock eval to return a mock nodemailer module
    global.eval = jest.fn().mockImplementation((code: string) => {
      if (code.includes("import('nodemailer')")) {
        return Promise.resolve({
          default: {
            createTransport: mockCreateTransport,
          },
        });
      }
      return originalEval(code);
    });

    process.env.EMAIL_SMTP_USER = 'test@example.com';
    process.env.EMAIL_SMTP_PASS = 'pass';
    process.env.NOTIFICATIONS_EMAIL_TO = 'owner@example.com';
  });

  afterEach(() => {
    global.eval = originalEval;
  });

  it('sends signup notification email', async () => {
    await sendSignupNotification({ email: 'newuser@example.com', name: 'Alice' });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.to).toBe('owner@example.com');
    expect(arg.subject).toContain('newuser@example.com');
    expect(arg.text).toContain('Alice');
  });

  it('sends daily usage report email', async () => {
    await sendDailyUsageReport('Report body');

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const arg = mockSendMail.mock.calls[0][0];
    expect(arg.subject).toContain('Daily usage report');
    expect(arg.text).toBe('Report body');
  });
});
