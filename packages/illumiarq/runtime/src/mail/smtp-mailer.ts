/**
 * SMTPMailer — sends email via SMTP using nodemailer.
 *
 * Requires `nodemailer` to be installed in the app:
 *   pnpm add nodemailer
 *   pnpm add -D @types/nodemailer
 *
 * Configure via config/mail.ts:
 *   driver: 'smtp'
 *   smtp: { host, port, secure, user, pass }
 *
 * @example
 * // bootstrap/providers.ts
 * import { SMTPMailer } from '@lumiarq/framework/runtime';
 * export const mailer = new SMTPMailer({ config: mailConfig, queue });
 */
import type { MailerContract, MailMessage } from '@illumiarq/contracts';
import type { QueueContract } from '@illumiarq/contracts';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface SMTPMailerOptions {
  config: SmtpConfig;
  from: string;
  queue?: QueueContract;
}

// Lazily resolved nodemailer transport to avoid crash when package is absent
type Transporter = {
  sendMail(opts: Record<string, unknown>): Promise<{ messageId: string }>;
};

async function createTransporter(config: SmtpConfig): Promise<Transporter> {
  let nodemailer: typeof import('nodemailer');
  try {
    nodemailer = await import('nodemailer');
  } catch {
    throw new Error(
      '[SMTPMailer] nodemailer is not installed. Run: pnpm add nodemailer && pnpm add -D @types/nodemailer',
    );
  }
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
}

export class SMTPMailer implements MailerContract {
  private readonly opts: SMTPMailerOptions;
  private transporter: Transporter | null = null;

  constructor(opts: SMTPMailerOptions) {
    this.opts = opts;
  }

  private async getTransporter(): Promise<Transporter> {
    if (!this.transporter) {
      this.transporter = await createTransporter(this.opts.config);
    }
    return this.transporter;
  }

  async send(message: MailMessage): Promise<void> {
    const transport = await this.getTransporter();
    await transport.sendMail({
      from: message.from ?? this.opts.from,
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: message.replyTo,
      subject: message.subject,
      // In a full implementation, template would be rendered to HTML here.
      // For now, pass the template name and payload as plain text for debugging.
      text: `Template: ${message.template}\nPayload: ${JSON.stringify(message.payload)}`,
    });
  }

  async queue(message: MailMessage): Promise<void> {
    if (!this.opts.queue) {
      // No queue configured — fall back to sending immediately
      return this.send(message);
    }
    await this.opts.queue.dispatch(
      { name: 'mail.send', data: message as unknown as Record<string, unknown> },
      { queue: 'mail' },
    );
  }
}
