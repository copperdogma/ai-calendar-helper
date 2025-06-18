import { sendSignupNotification, sendDailyUsageReport } from '@/lib/email';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock(
  'nodemailer',
  () => ({
    createTransport: jest.fn(),
  }),
  { virtual: true }
);

type MockTransporter = {
  sendMail: jest.Mock;
};

describe('email helper', () => {
  const mockSendMail = jest.fn().mockResolvedValue({});
  const mockCreateTransport = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    mockSendMail.mockClear();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as MockTransporter);

    process.env.EMAIL_SMTP_USER = 'test@example.com';
    process.env.EMAIL_SMTP_PASS = 'pass';
    process.env.NOTIFICATIONS_EMAIL_TO = 'owner@example.com';
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
