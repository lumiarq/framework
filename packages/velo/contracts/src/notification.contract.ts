/** Notifiable entity — anything that can receive a notification */
export interface Notifiable {
  id: string;
  email?: string | undefined;
}

/**
 * NotificationContract — compose Mail + Queue to send notifications.
 * v1: StubNotifier — logs notification, does not send.
 * v2: real implementation composes MailerContract.
 */
export interface NotificationContract {
  send(notifiable: Notifiable, notification: unknown): Promise<void>;
  queue(notifiable: Notifiable, notification: unknown): Promise<void>;
}
