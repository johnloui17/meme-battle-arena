import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT ?? 587,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export const mailer = {
  /**
   * Sends via SMTP when configured. Otherwise logs the message instead of
   * sending it — the "console mailer" dev/test default, so e.g. the
   * password-reset URL is still visible (in the server log) with zero setup.
   */
  async send(message: MailMessage): Promise<void> {
    if (!env.SMTP_HOST) {
      logger.info({ to: message.to, subject: message.subject, text: message.text }, "SMTP not configured — email logged instead of sent");
      return;
    }
    await getTransporter().sendMail({ from: env.MAIL_FROM, ...message });
  },
};
