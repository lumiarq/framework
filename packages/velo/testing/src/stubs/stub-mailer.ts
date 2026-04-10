// ─── StubMailer — logs mail to console, does not send ────────────────────────
import type { MailerContract, MailMessage } from '@velo/contracts';
import type { LoggerContract } from '@velo/contracts';

export interface StubMailerOptions {
  logger: LoggerContract;
}

export class StubMailer implements MailerContract {
  private readonly logger: LoggerContract;
  readonly sent: MailMessage[] = [];

  constructor(opts: StubMailerOptions) {
    this.logger = opts.logger;
  }

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    this.logger.info('[StubMailer] send', {
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      template: message.template,
    });
  }

  async queue(message: MailMessage): Promise<void> {
    this.sent.push(message);
    this.logger.info('[StubMailer] queue', {
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      template: message.template,
    });
  }
}
