'use server';
/**
 * @fileOverview Flow to send emails using the connected Google account.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { google } from 'googleapis';

const RecipientSchema = z.object({
  studentName: z.string(),
  guardianName: z.string(),
  email: z.string().email(),
});

const AttachmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  dataUri: z.string(),
});

const SendEmailInputSchema = z.object({
  recipients: z.array(RecipientSchema),
  subject: z.string(),
  message: z.string(),
  accessToken: z.string(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; message: string }> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async ({ recipients, subject, message, accessToken, attachments }) => {
    if (recipients.length === 0) {
        return { success: false, message: "Nenhum destinatário selecionado." };
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let successCount = 0;
    let failedCount = 0;
    let lastError: any = null;

    for (const recipient of recipients) {
      const currentMessage = String(message || '');
      const personalizedMessage = currentMessage
        .replace(/{guardian_name}/g, recipient.guardianName)
        .replace(/{student_name}/g, recipient.studentName);

      // Construct MIME message with attachments if present
      let emailRaw = "";
      
      if (attachments && attachments.length > 0) {
        const boundary = "__boundary_string__";
        const emailParts = [
          `To: ${recipient.email}`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/mixed; boundary="${boundary}"`,
          '',
          `--${boundary}`,
          `Content-Type: text/html; charset=utf-8`,
          '',
          personalizedMessage,
          '',
        ];

        for (const att of attachments) {
          const base64Data = att.dataUri.split(',')[1];
          emailParts.push(`--${boundary}`);
          emailParts.push(`Content-Type: ${att.type}; name="${att.name}"`);
          emailParts.push(`Content-Disposition: attachment; filename="${att.name}"`);
          emailParts.push(`Content-Transfer-Encoding: base64`);
          emailParts.push('');
          emailParts.push(base64Data);
          emailParts.push('');
        }

        emailParts.push(`--${boundary}--`);
        emailRaw = emailParts.join('\r\n');
      } else {
        emailRaw = [
          `To: ${recipient.email}`,
          'Content-Type: text/html; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${subject}`,
          '',
          personalizedMessage,
        ].join('\n');
      }

      const base64EncodedEmail = Buffer.from(emailRaw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      try {
        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: base64EncodedEmail,
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        failedCount++;
        lastError = error;
      }
    }
    
    if (failedCount > 0 && successCount === 0) {
        const errorMessage = lastError?.message || 'Erro desconhecido ao enviar e-mails.';
        return { success: false, message: `Falha ao enviar todos os e-mails. Erro: ${errorMessage}` };
    }

    const messageResult = `${successCount} e-mails foram enviados com sucesso. ${failedCount > 0 ? `${failedCount} falharam.` : ''}`;
    return { success: successCount > 0, message: messageResult };
  }
);
