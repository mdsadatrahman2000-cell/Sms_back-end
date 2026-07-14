import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordReset(email: string, resetToken: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request',
        template: 'password-reset',
        context: {
          resetUrl,
          expiresIn: '1 hour',
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
    }
  }

  async sendWelcome(email: string, firstName: string, schoolName: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Welcome to ${schoolName}`,
        template: 'welcome',
        context: {
          firstName,
          schoolName,
        },
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}: ${error.message}`);
    }
  }

  async sendInvoice(email: string, invoiceData: {
    studentName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    schoolName: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Fee Invoice - ${invoiceData.invoiceNumber}`,
        template: 'invoice',
        context: invoiceData,
      });
      this.logger.log(`Invoice email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invoice email to ${email}: ${error.message}`);
    }
  }

  async sendNotification(email: string, notification: {
    title: string;
    message: string;
    schoolName: string;
  }) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: notification.title,
        template: 'notification',
        context: notification,
      });
      this.logger.log(`Notification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send notification email to ${email}: ${error.message}`);
    }
  }

  async sendBulkNotification(emails: string[], notification: {
    title: string;
    message: string;
    schoolName: string;
  }) {
    for (const email of emails) {
      await this.sendNotification(email, notification);
    }
  }
}
