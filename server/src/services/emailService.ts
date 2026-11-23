import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { ENV } from '../config/env.js';
import { prisma } from '../config/prisma.js';

export interface ApplicationEmailPayload {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCity?: string;
  jobTitle: string;
  jobReference: string;
  applicationNumber: string;
  yearsOfExp?: number;
  skills: string[];
  coverLetterContent?: string;
  profileId: string;
  resumeType: 'UPLOADED_PDF' | 'PLATFORM_BUILDER';
  resumeFilePath?: string;
  resumeFileName?: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: ENV.SMTP_USER ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS } : undefined,
  });

  /**
   * Log email to PostgreSQL audit trail
   */
  private static async logEmail(
    recipient: string,
    subject: string,
    body: string,
    hasAttachment: boolean,
    attachmentName?: string,
    error?: string
  ): Promise<void> {
    try {
      await prisma.emailLog.create({
        data: {
          recipient,
          subject,
          body: body.slice(0, 5000), // sanitize size
          hasAttachment,
          attachmentName,
          status: error ? 'FAILED' : 'SENT',
          error,
        },
      });
    } catch (e) {
      console.error('Failed to write email log to database:', e);
    }
  }

  /**
   * Build master responsive HTML email layout with official ESTC branding
   * Colors: #004b82 (Blue), #868889 (Slate Gray), #ffffff (White)
   */
  private static renderEstcEmailLayout(params: {
    badgeText?: string;
    title: string;
    subtitle?: string;
    contentHtml: string;
    ctaText?: string;
    ctaUrl?: string;
  }): string {
    const { badgeText, title, subtitle, contentHtml, ctaText, ctaUrl } = params;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f6f8; padding: 30px 15px; }
    .main {
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e5e7;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 75, 130, 0.06);
    }
    .top-bar { height: 6px; background-color: #004b82; }
    .header {
      padding: 28px 24px 20px 24px;
      text-align: center;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e5e7;
    }
    .header img {
      height: 58px;
      width: auto;
      margin-bottom: 10px;
      display: inline-block;
    }
    .inst-title {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #004b82;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .inst-sub {
      margin: 4px 0 0 0;
      font-size: 11px;
      font-weight: 600;
      color: #868889;
    }
    .content { padding: 32px 28px; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      background-color: #e6f0f7;
      color: #004b82;
      border: 1px solid #c2dcf0;
      margin-bottom: 14px;
    }
    .title {
      margin: 0 0 8px 0;
      font-size: 19px;
      font-weight: 800;
      color: #004b82;
      line-height: 1.35;
    }
    .subtitle {
      margin: 0 0 20px 0;
      font-size: 13px;
      color: #868889;
      font-weight: 500;
    }
    .cta-container { text-align: center; margin-top: 30px; margin-bottom: 10px; }
    .cta-button {
      background-color: #004b82;
      color: #ffffff !important;
      padding: 13px 28px;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 13px;
      display: inline-block;
      box-shadow: 0 2px 8px rgba(0, 75, 130, 0.25);
    }
    .footer {
      background-color: #f8f9fa;
      padding: 22px 24px;
      text-align: center;
      border-top: 1px solid #e2e5e7;
      font-size: 11px;
      color: #868889;
      line-height: 1.6;
    }
    .footer strong { color: #004b82; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="top-bar"></div>
      
      <div class="header">
        <img src="cid:estc_logo" alt="EST Casablanca - Université Hassan II" />
        <h1 class="inst-title">École Supérieure de Technologie de Casablanca</h1>
        <p class="inst-sub">Université Hassan II de Casablanca &bull; SMARTRECRUIT ATS</p>
      </div>

      <div class="content">
        ${badgeText ? `<div class="badge">${badgeText}</div>` : ''}
        <h2 class="title">${title}</h2>
        ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}

        ${contentHtml}

        ${
          ctaText && ctaUrl
            ? `
          <div class="cta-container">
            <a href="${ctaUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">
              ${ctaText}
            </a>
          </div>
        `
            : ''
        }
      </div>

      <div class="footer">
        <strong>École Supérieure de Technologie de Casablanca (ESTC)</strong><br />
        Université Hassan II de Casablanca &bull; Route d'El Jadida, Km 7, B.P. 8012 Oasis, Casablanca, Maroc<br />
        Tél : +212 (0) 5 22 23 41 18 / 88 &bull; Courriel : contact@est-uh2c.ac.ma &bull; www.est-uh2c.ac.ma<br />
        <span style="font-size: 10px; color: #a0a3a5; margin-top: 8px; display: inline-block;">
          Ce message automatique et sécurisé est émis par le système de recrutement officiel SMARTRECRUIT ATS.
        </span>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send email using PHPMailer via XAMPP PHP CLI
   */
  public static async sendWithPhpMailer(payload: {
    to: string | string[];
    name?: string;
    code?: string;
    subject?: string;
    htmlBody?: string;
    attachmentPath?: string;
    attachmentName?: string;
  }): Promise<{ success: boolean; output: string }> {
    // 1. Prioritize Resend HTTPS REST API (Port 443 - Never blocked by Render or cloud firewalls)
    if (ENV.RESEND_API_KEY) {
      try {
        const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ENV.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: ENV.RESEND_FROM,
            to: recipients,
            subject: payload.subject || 'Notification SmartRecruit ATS',
            html: payload.htmlBody || `<p>${payload.code || ''}</p>`,
          }),
        });
        const data: any = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          console.log(`[Resend] Email délivré avec succès à ${recipients.join(', ')} (id: ${data.id})`);
          return { success: true, output: data.id };
        } else {
          console.warn(`[Resend] Réponse Resend:`, data);
        }
      } catch (err: any) {
        console.error('[Resend] Erreur envoi HTTPS:', err?.message);
      }
    }

    const phpExe = 'C:\\xampp\\php\\php.exe';
    const scriptPath = path.resolve('c:/xampp/htdocs/projet_ats_saad/php_mailer/send_mail.php');

    // On Linux/Render (or when local PHP is absent), deliver directly via Nodemailer & Gmail SMTP
    if (!fs.existsSync(phpExe) || !fs.existsSync(scriptPath)) {
      try {
        const recipients = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
        const mailOptions: any = {
          from: ENV.SMTP_FROM,
          to: recipients,
          subject: payload.subject || 'Notification SmartRecruit ATS',
          html: payload.htmlBody || `<p>${payload.code || ''}</p>`,
        };

        if (payload.attachmentPath && fs.existsSync(payload.attachmentPath)) {
          mailOptions.attachments = [
            {
              filename: payload.attachmentName || 'document.pdf',
              path: payload.attachmentPath,
            },
          ];
        }

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[EmailService] Email délivré avec succès via Nodemailer/Gmail à ${recipients}:`, info.messageId);
        return { success: true, output: info.messageId };
      } catch (err: any) {
        console.error('[EmailService] Échec envoi via Nodemailer/Gmail:', err);
        return { success: false, output: err.message };
      }
    }

    return new Promise((resolve) => {
      const jsonStr = JSON.stringify(payload);
      const b64 = Buffer.from(jsonStr).toString('base64');

      const proc = spawn(phpExe, [scriptPath, b64]);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          console.log(`[PHPMailer] Message délivré avec succès à ${JSON.stringify(payload.to)}`);
          resolve({ success: true, output: stdout });
        } else {
          console.warn(`[PHPMailer] Code sortie process PHP (${code}):`, stdout || stderr);
          resolve({ success: false, output: stderr || stdout });
        }
      });

      proc.on('error', (err) => {
        console.warn('[PHPMailer] Erreur lancement process PHP:', err.message);
        resolve({ success: false, output: err.message });
      });
    });
  }

  /**
   * 1. Send candidate registration verification code (OTP) via PHPMailer
   */
  public static async sendVerificationCode(
    email: string,
    name: string,
    code: string
  ): Promise<void> {
    const subject = `Code de vérification EST Casablanca : ${code}`;
    const contentHtml = `
      <p style="font-size: 13px; line-height: 1.6; color: #374151; margin-top: 0;">
        Bonjour <strong>${name}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Nous vous remercions pour votre démarche sur le portail de recrutement de l'<strong>École Supérieure de Technologie de Casablanca</strong>.
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Veuillez saisir le code de sécurité suivant sur la page de confirmation pour valider votre adresse e-mail et activer votre compte candidat :
      </p>

      <div style="background-color: #f8f9fa; border: 2px dashed #004b82; border-radius: 12px; padding: 22px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #004b82; font-family: 'Courier New', monospace; display: block;">
          ${code}
        </span>
      </div>

      <p style="font-size: 12px; line-height: 1.5; color: #868889; margin-bottom: 0;">
        Ce code est strictement personnel et expire dans <strong>15 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
      </p>
    `;

    const htmlBody = this.renderEstcEmailLayout({
      badgeText: 'Authentification & Sécurité',
      title: 'Activation de votre compte candidat',
      subtitle: 'Code de vérification à 6 chiffres',
      contentHtml,
    });

    console.log(`\n======================================================`);
    console.log(`[PHPMailer] CODE DE VÉRIFICATION OTP`);
    console.log(`Destinataire : ${email}`);
    console.log(`Code : ${code}`);
    console.log(`======================================================\n`);

    try {
      const phpRes = await this.sendWithPhpMailer({ to: email, name, code, subject, htmlBody });
      if (!phpRes.success && ENV.SMTP_ENABLED) {
        await this.transporter.sendMail({ from: ENV.SMTP_FROM, to: email, subject, html: htmlBody });
      }
      await this.logEmail(email, subject, htmlBody, false);
    } catch (err: any) {
      console.error(`Erreur envoi code vérification (${email}):`, err);
      await this.logEmail(email, subject, htmlBody, false, undefined, err?.message);
    }
  }

  /**
   * 2. Send notification to HR team when a new application is submitted
   */
  public static async notifyHrNewApplication(payload: ApplicationEmailPayload): Promise<void> {
    const recipients = ENV.SUPER_ADMIN_EMAILS;
    const subject = `Nouvelle candidature – ${payload.candidateName} – ${payload.jobTitle}`;
    const secureProfileUrl = `${ENV.CLIENT_BASE_URL}/hr/applications`;

    const isPdfUpload = payload.resumeType === 'UPLOADED_PDF';
    let attachmentPath: string | undefined;
    let attachmentName: string | undefined;
    let hasAttachment = false;

    if (isPdfUpload && payload.resumeFilePath && fs.existsSync(payload.resumeFilePath)) {
      const stats = fs.statSync(payload.resumeFilePath);
      if (stats.size <= ENV.MAX_FILE_SIZE_MB * 1024 * 1024) {
        attachmentPath = payload.resumeFilePath;
        attachmentName = payload.resumeFileName || 'CV_Candidat.pdf';
        hasAttachment = true;
      }
    }

    const contentHtml = `
      <p style="font-size: 13px; line-height: 1.6; color: #374151; margin-top: 0;">
        Une nouvelle candidature vient d'être enregistrée sur la plateforme de recrutement de l'EST Casablanca :
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background-color: #f8f9fa; border: 1px solid #e2e5e7; border-radius: 10px; overflow: hidden;">
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; width: 170px; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Numéro de dossier :</td>
          <td style="padding: 10px 14px; color: #111827; font-weight: 700; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.applicationNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Poste / Appel :</td>
          <td style="padding: 10px 14px; color: #111827; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.jobTitle} (Réf : ${payload.jobReference})</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Nom complet :</td>
          <td style="padding: 10px 14px; color: #111827; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.candidateName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Courriel :</td>
          <td style="padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #e2e5e7;">
            <a href="mailto:${payload.candidateEmail}" style="color: #004b82; text-decoration: none; font-weight: 600;">${payload.candidateEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Téléphone :</td>
          <td style="padding: 10px 14px; color: #111827; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.candidatePhone || 'Non renseigné'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Ville / Résidence :</td>
          <td style="padding: 10px 14px; color: #111827; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.candidateCity || 'Maroc'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Expérience :</td>
          <td style="padding: 10px 14px; color: #111827; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.yearsOfExp !== undefined ? `${payload.yearsOfExp} an(s)` : 'Non précisé'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px; border-bottom: 1px solid #e2e5e7;">Compétences clés :</td>
          <td style="padding: 10px 14px; color: #111827; font-size: 12px; border-bottom: 1px solid #e2e5e7;">${payload.skills.length > 0 ? payload.skills.join(', ') : 'Général'}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-weight: bold; color: #004b82; font-size: 12px;">Format du CV :</td>
          <td style="padding: 10px 14px; color: #111827; font-size: 12px;">
            ${isPdfUpload ? 'Fichier PDF (joint à cet e-mail)' : 'Créé via le concepteur interactif EST Casablanca'}
          </td>
        </tr>
      </table>

      ${
        payload.coverLetterContent
          ? `
        <div style="background-color: #f8f9fa; border-left: 4px solid #004b82; padding: 14px; margin: 18px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px 0; color: #004b82; font-size: 12px; text-transform: uppercase;">Lettre de motivation du candidat :</h4>
          <p style="margin: 0; font-size: 12px; font-style: italic; color: #4b5563; white-space: pre-wrap; line-height: 1.5;">${payload.coverLetterContent}</p>
        </div>
      `
          : ''
      }
    `;

    const htmlBody = this.renderEstcEmailLayout({
      badgeText: 'Commission RH & Recrutement',
      title: 'Nouvelle candidature réceptionnée',
      subtitle: `${payload.jobTitle} &bull; Réf. ${payload.jobReference}`,
      contentHtml,
      ctaText: 'Examiner le dossier sur la plateforme RH',
      ctaUrl: secureProfileUrl,
    });

    for (const adminEmail of recipients) {
      try {
        await this.sendWithPhpMailer({
          to: adminEmail,
          name: 'Administrateur RH',
          subject,
          htmlBody,
          attachmentPath,
          attachmentName,
        });
        await this.logEmail(adminEmail, subject, htmlBody, hasAttachment, attachmentName);
      } catch (err: any) {
        console.error(`Erreur envoi email RH à ${adminEmail}:`, err);
        await this.logEmail(adminEmail, subject, htmlBody, hasAttachment, attachmentName, err?.message);
      }
    }
  }

  /**
   * 3. Send application confirmation receipt to the candidate
   */
  public static async sendCandidateConfirmation(
    email: string,
    name: string,
    jobTitle: string,
    appNumber: string
  ): Promise<void> {
    const subject = `Confirmation de candidature : ${jobTitle} (Réf ${appNumber})`;
    const contentHtml = `
      <p style="font-size: 13px; line-height: 1.6; color: #374151; margin-top: 0;">
        Bonjour <strong>${name}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Nous vous confirmons la bonne réception de votre candidature pour le poste de <strong>${jobTitle}</strong> au sein de l'<strong>École Supérieure de Technologie de Casablanca</strong>.
      </p>
      
      <div style="background-color: #f8f9fa; border: 1px solid #e2e5e7; border-left: 4px solid #004b82; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #868889; display: block;">Numéro d'enregistrement unique :</span>
        <span style="font-size: 20px; font-weight: 800; color: #004b82; letter-spacing: 1px; font-family: monospace;">${appNumber}</span>
      </div>

      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Votre dossier fait l'objet d'un examen attentif par la commission de recrutement. Vous serez notifié(e) par e-mail et sur votre espace candidat à chaque étape du processus (présélection, entretiens, décision).
      </p>
    `;

    const htmlBody = this.renderEstcEmailLayout({
      badgeText: 'Accusé de Réception Officiel',
      title: 'Candidature bien enregistrée',
      subtitle: `Poste visé : ${jobTitle}`,
      contentHtml,
      ctaText: 'Suivre l\'avancement de mon dossier',
      ctaUrl: `${ENV.CLIENT_BASE_URL}/candidate/applications`,
    });

    try {
      const phpRes = await this.sendWithPhpMailer({ to: email, name, subject, htmlBody });
      if (!phpRes.success && ENV.SMTP_ENABLED) {
        await this.transporter.sendMail({ from: ENV.SMTP_FROM, to: email, subject, html: htmlBody });
      }
      await this.logEmail(email, subject, htmlBody, false);
    } catch (err: any) {
      console.error(`Erreur envoi confirmation candidat (${email}):`, err);
      await this.logEmail(email, subject, htmlBody, false, undefined, err?.message);
    }
  }

  /**
   * 4. Send status update notification to the candidate
   */
  public static async sendStatusUpdate(
    email: string,
    name: string,
    jobTitle: string,
    newStatusFrench: string,
    details?: string
  ): Promise<void> {
    const subject = `Mise à jour de votre candidature : ${jobTitle} – ${newStatusFrench}`;
    const contentHtml = `
      <p style="font-size: 13px; line-height: 1.6; color: #374151; margin-top: 0;">
        Bonjour <strong>${name}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Le statut de votre dossier de candidature pour le poste de <strong>${jobTitle}</strong> a été mis à jour par la commission de recrutement :
      </p>

      <div style="background-color: #f8f9fa; border: 1px solid #e2e5e7; border-left: 4px solid #004b82; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #868889; display: block;">Nouvelle étape de recrutement :</span>
        <span style="font-size: 17px; font-weight: 800; color: #004b82;">${newStatusFrench}</span>
      </div>

      ${
        details
          ? `
        <div style="background-color: #ffffff; border: 1px solid #e2e5e7; padding: 14px 18px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.6;">${details}</p>
        </div>
      `
          : ''
      }

      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Vous pouvez retrouver l'historique complet et les détails dans votre espace personnel en ligne.
      </p>
    `;

    const htmlBody = this.renderEstcEmailLayout({
      badgeText: 'Évolution du Recrutement',
      title: 'Mise à jour de votre statut',
      subtitle: `Poste : ${jobTitle}`,
      contentHtml,
      ctaText: 'Accéder à mon espace candidat',
      ctaUrl: `${ENV.CLIENT_BASE_URL}/candidate/applications`,
    });

    try {
      const phpRes = await this.sendWithPhpMailer({ to: email, name, subject, htmlBody });
      if (!phpRes.success && ENV.SMTP_ENABLED) {
        await this.transporter.sendMail({ from: ENV.SMTP_FROM, to: email, subject, html: htmlBody });
      }
      await this.logEmail(email, subject, htmlBody, false);
    } catch (err: any) {
      console.error(`Erreur envoi mise à jour statut (${email}):`, err);
      await this.logEmail(email, subject, htmlBody, false, undefined, err?.message);
    }
  }

  /**
   * 5. Send interview convocation email to the candidate
   */
  public static async sendInterviewNotification(
    email: string,
    name: string,
    jobTitle: string,
    interviewType: string,
    scheduledAt: Date,
    meetingLink?: string
  ): Promise<void> {
    const subject = `Convocation à un entretien – ${jobTitle} – EST Casablanca`;
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(scheduledAt);

    const contentHtml = `
      <p style="font-size: 13px; line-height: 1.6; color: #374151; margin-top: 0;">
        Bonjour <strong>${name}</strong>,
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #374151;">
        Nous avons le plaisir de vous convier à un <strong>${interviewType}</strong> dans le cadre de votre candidature pour le poste de <strong>${jobTitle}</strong>.
      </p>

      <div style="background-color: #f8f9fa; border: 1px solid #e2e5e7; border-left: 4px solid #004b82; padding: 18px 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #1f2937;">
          <strong style="color: #004b82;">Date et Heure :</strong> ${formattedDate}
        </p>
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #1f2937;">
          <strong style="color: #004b82;">Lieu / Modalité :</strong> ${meetingLink ? 'Entretien en visioconférence' : 'Campus EST Casablanca, Route d\'El Jadida, Km 7, Oasis'}
        </p>
        ${
          meetingLink
            ? `
          <p style="margin: 0; font-size: 13px; color: #1f2937;">
            <strong style="color: #004b82;">Lien de visioconférence :</strong>
            <a href="${meetingLink}" style="color: #004b82; font-weight: bold; text-decoration: underline;" target="_blank">${meetingLink}</a>
          </p>
        `
            : ''
        }
      </div>

      <p style="font-size: 12px; line-height: 1.6; color: #868889;">
        Nous vous invitons à vous connecter quelques minutes avant l'heure fixée avec une pièce d'identité en cours de validité.
      </p>
    `;

    const htmlBody = this.renderEstcEmailLayout({
      badgeText: 'Convocation Officielle',
      title: 'Entretien de recrutement',
      subtitle: `${jobTitle} &bull; ${interviewType}`,
      contentHtml,
      ctaText: 'Consulter les détails de l\'entretien',
      ctaUrl: `${ENV.CLIENT_BASE_URL}/candidate/applications`,
    });

    try {
      const phpRes = await this.sendWithPhpMailer({ to: email, name, subject, htmlBody });
      if (!phpRes.success && ENV.SMTP_ENABLED) {
        await this.transporter.sendMail({ from: ENV.SMTP_FROM, to: email, subject, html: htmlBody });
      }
      await this.logEmail(email, subject, htmlBody, false);
    } catch (err: any) {
      console.error(`Erreur convocation entretien (${email}):`, err);
      await this.logEmail(email, subject, htmlBody, false, undefined, err?.message);
    }
  }
}
