/*
 * Jest manual mock for the "nodemailer" package.
 * We don't want to hit the real SMTP transport in unit tests –
 * just confirm that our code calls `sendMail` with the expected
 * parameters.  The mock provides a minimal implementation that
 * satisfies the typings and resolves immediately.
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck – this file is intentionally loose for mocking

const sendMailMock = jest.fn().mockResolvedValue({ accepted: ['test@example.com'] });

export const createTransport = jest.fn().mockReturnValue({
  sendMail: sendMailMock,
});

export const __resetMocks = () => {
  sendMailMock.mockClear();
  createTransport.mockClear();
};
