export class StubMailer {
  logger;
  sent = [];
  constructor(opts) {
    this.logger = opts.logger;
  }
  async send(message) {
    this.sent.push(message);
    this.logger.info('[StubMailer] send', {
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      template: message.template,
    });
  }
  async queue(message) {
    this.sent.push(message);
    this.logger.info('[StubMailer] queue', {
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      template: message.template,
    });
  }
}
//# sourceMappingURL=stub-mailer.js.map
