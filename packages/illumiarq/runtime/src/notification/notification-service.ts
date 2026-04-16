/**
 * NotificationService — composes MailerContract and QueueContract to send notifications.
 *
 * `send()` sends immediately via the mailer.
 * `queue()` dispatches a `mail.send` job onto the mail queue (non-blocking).
 *
 * @example
 * // bootstrap/providers.ts
 * import { NotificationService } from '@lumiarq/framework/runtime';
 * export const notifier = new NotificationService({ mailer, queue, from: env.MAIL_FROM });
 *
 * // In an action:
 * await notifier.send(user, new WelcomeNotification(user));
 */
import type { NotificationContract, Notifiable } from '@illumiarq/contracts';
import type { MailerContract, MailMessage } from '@illumiarq/contracts';
import type { QueueContract } from '@illumiarq/contracts';

/**
 * A notification object — defines the mail message to send.
 * Implement this interface in your Notification classes.
 *
 * @example
 * export class WelcomeNotification implements Notification {
 *   constructor(private readonly user: User) {}
 *   toMail(): Omit<MailMessage, 'to'> {
 *     return {
 *       subject: 'Welcome to MyApp',
 *       template: 'emails.welcome',
 *       payload: { name: this.user.name },
 *     };
 *   }
 * }
 */
export interface Notification {
  toMail(): Omit<MailMessage, 'to'>;
}

export interface NotificationServiceOptions {
  mailer: MailerContract;
  queue?: QueueContract;
  /** Default from-address. Overridden if notification.toMail() provides `from`. */
  from?: string;
}

export class NotificationService implements NotificationContract {
  private readonly mailer: MailerContract;
  private readonly queueDriver: QueueContract | undefined;
  private readonly from: string;

  constructor(opts: NotificationServiceOptions) {
    this.mailer = opts.mailer;
    this.queueDriver = opts.queue ?? undefined;
    this.from = opts.from ?? 'notifications@example.com';
  }

  async send(notifiable: Notifiable, notification: unknown): Promise<void> {
    if (!hasToMail(notification)) {
      throw new Error('[NotificationService] notification must implement toMail()');
    }
    if (!notifiable.email) {
      throw new Error(`[NotificationService] notifiable "${notifiable.id}" has no email address`);
    }
    const message: MailMessage = {
      ...notification.toMail(),
      to: notifiable.email,
      from: notification.toMail().from ?? this.from,
    };
    await this.mailer.send(message);
  }

  async queue(notifiable: Notifiable, notification: unknown): Promise<void> {
    if (!hasToMail(notification)) {
      throw new Error('[NotificationService] notification must implement toMail()');
    }
    if (!notifiable.email) {
      throw new Error(`[NotificationService] notifiable "${notifiable.id}" has no email address`);
    }
    const message: MailMessage = {
      ...notification.toMail(),
      to: notifiable.email,
      from: notification.toMail().from ?? this.from,
    };
    if (this.queueDriver) {
      await this.queueDriver.dispatch(
        { name: 'mail.send', data: message as unknown as Record<string, unknown> },
        { queue: 'mail' },
      );
    } else {
      // No queue configured — send immediately
      await this.mailer.send(message);
    }
  }
}

function hasToMail(notification: unknown): notification is Notification {
  return (
    notification !== null &&
    typeof notification === 'object' &&
    'toMail' in notification &&
    typeof (notification as { toMail: unknown }).toMail === 'function'
  );
}
