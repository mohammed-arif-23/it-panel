import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

export interface StudentNotification {
  email: string;
  name: string;
  registerNumber: string;
  seminarDate: string;
  seminarTopic?: string;
  classYear?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        fromEmail: process.env.FROM_EMAIL || '',
        fromName: process.env.FROM_NAME || 'College Seminar System'
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendSelectionNotification(student: StudentNotification): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.error('Email service not properly initialized');
      return false;
    }

    try {
      const htmlContent = this.generateSelectionEmailHTML(student);
      const textContent = this.generateSelectionEmailText(student);

      const mailOptions = {
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: student.email,
        subject: `🎉 You're Selected for Tomorrow's Seminar - ${student.seminarDate}`,
        text: textContent,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Selection email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send selection email:', error);
      return false;
    }
  }

  private generateSelectionEmailHTML(student: StudentNotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seminar Selection Notification</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">You've been selected for tomorrow's seminar</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">Dear ${student.name},</h2>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            We are pleased to inform you that you have been <strong>selected to present</strong> in tomorrow's seminar session.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Seminar Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Student:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${student.name} (${student.registerNumber})</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Class:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${student.classYear || 'Not specified'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${student.seminarDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Topic:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;">${student.seminarTopic || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Department:</strong></td>
                <td style="padding: 8px 0;">'Department of Information Technology - AVSEC'</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #856404;">⚠️ Important Reminders</h4>
            <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
              <li>Please prepare your presentation materials in advance</li>
              <li>Arrive at least 15 minutes before the scheduled time</li>
              <li>Bring any required technical equipment or materials</li>
              <li>Contact your faculty coordinator if you have any questions</li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
          <p style="margin: 0;">This is an automated notification from the <b>Supabase</b> created by Arif - All Rights Reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  private generateSelectionEmailText(student: StudentNotification): string {
    return `
🎉 CONGRATULATIONS! You've been selected for tomorrow's seminar

Dear ${student.name},

We are pleased to inform you that you have been SELECTED to present in tomorrow's seminar session.

SEMINAR DETAILS:
- Student: ${student.name} (${student.registerNumber})
- Class: ${student.classYear || 'Not specified'}
- Date: ${student.seminarDate}
- Topic: ${student.seminarTopic || 'Not provided'}
- Department: ${process.env.COLLEGE_NAME || 'Department of IT'}
    `;
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();