/**
 * ResendMailer — sends email via the Resend API.
 *
 * Universal driver (works on Node.js and Cloudflare Workers).
 * Requires `resend` to be installed in the app:
 *   pnpm add resend
 *
 * Configure via config/mail.ts:
 *   driver: 'resend'
 *   resend: { apiKey }
 *
 * @example
 * // bootstrap/providers.ts
 * import { ResendMailer } from '@lumiarq/framework/runtime';
 * export const mailer = new ResendMailer({ apiKey: env.RESEND_API_KEY, from: 'hello@yourapp.com', queue });
 */
import type { MailerContract, MailMessage } from '@illumiarq/contracts';
import type { QueueContract } from '@illumiarq/contracts';

export interface ResendMailerOptions {
  apiKey: string;
  from: string;
  queue?: QueueContract;
}

interface ResendClient {
  emails: {
    send(
      opts: Record<string, unknown>,
    ): Promise<{ data?: { id: string }; error?: { message: string } }>;
  };
}

async function createResendClient(apiKey: string): Promise<ResendClient> {
  let ResendModule: { Resend: new (key: string) => ResendClient };
  try {
    ResendModule = (await import('resend')) as unknown as {
      Resend: new (key: string) => ResendClient;
    };
  } catch {
    throw new Error('[ResendMailer] resend is not installed. Run: pnpm add resend');
  }
  return new ResendModule.Resend(apiKey);
}

export class ResendMailer implements MailerContract {
  private readonly opts: ResendMailerOptions;
  private client: ResendClient | null = null;

  constructor(opts: ResendMailerOptions) {
    this.opts = opts;
  }

  private async getClient(): Promise<ResendClient> {
    if (!this.client) {
      this.client = await createResendClient(this.opts.apiKey);
    }
    return this.client;
  }

  async send(message: MailMessage): Promise<void> {
    const resend = await this.getClient();
    const result = await resend.emails.send({
      from: message.from ?? this.opts.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      reply_to: message.replyTo,
      subject: message.subject,
      // Template rendering would produce html here in a full implementation.
      text: `Template: ${message.template}\nPayload: ${JSON.stringify(message.payload)}`,
    });
    if (result.error) {
      throw new Error(`[ResendMailer] send failed: ${result.error.message}`);
    }
  }

  async queue(message: MailMessage): Promise<void> {
    if (!this.opts.queue) {
      return this.send(message);
    }
    await this.opts.queue.dispatch(
      { name: 'mail.send', data: message as unknown as Record<string, unknown> },
      { queue: 'mail' },
    );
  }
}
