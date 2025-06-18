declare module 'nodemailer' {
  import { Transport } from 'nodemailer-core';
  interface Transporter {
    verify: () => Promise<void>;
    sendMail: (options: unknown) => Promise<unknown>;
  }
  function createTransport(options: unknown): Transporter;
  const nodemailer: {
    createTransport: typeof createTransport;
    Transporter: Transporter;
  };
  export default nodemailer;
  export type Transporter = Transporter;
}
