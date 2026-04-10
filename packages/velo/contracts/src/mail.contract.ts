export interface MailMessage {
  to: string | string[];
  subject: string;
  template: string;
  payload: Record<string, unknown>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface MailerContract {
  send(message: MailMessage): Promise<void>;
  queue(message: MailMessage): Promise<void>;
}
