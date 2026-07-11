import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  console.log(`[OTP DEBUG] OTP for ${email}: ${otp}`);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #0071e3; text-align: center;">Socialoop Email Verification</h2>
      <p>Hello,</p>
      <p>Thank you for signing up for Socialoop! To complete your registration, please verify your email address by entering the following One-Time Password (OTP) in the signup form:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 30px 0; color: #1d1d1f; padding: 15px; background-color: #f5f5f7; border-radius: 8px;">
        ${otp}
      </div>
      <p style="color: #86868b; font-size: 14px;">This OTP is valid for 5 minutes. If you did not request this code, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e3e3e7; margin: 20px 0;" />
      <p style="font-size: 12px; color: #86868b; text-align: center;">Socialoop Team</p>
    </div>
  `;

  // 1. Attempt sending via Brevo API (HTTP POST)
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;
  if (brevoApiKey && brevoSenderEmail) {
    try {
      console.log(`[MAILER] Attempting to send email via Brevo API...`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: process.env.BREVO_SENDER_NAME || 'Socialoop',
            email: brevoSenderEmail
          },
          to: [{ email }],
          subject: 'Socialoop - Verify your email',
          htmlContent: htmlTemplate
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[MAILER] Email sent successfully via Brevo: ${data.messageId}`);
        return { success: true, mode: 'brevo', messageId: data.messageId };
      } else {
        console.error(`[MAILER] Brevo API returned error:`, data);
        throw new Error(data.message || 'Brevo error');
      }
    } catch (error) {
      console.error(`[MAILER ERROR] Brevo sending failed:`, error);
      // fallback to next provider
    }
  }

  // 2. Attempt sending via SendGrid API (HTTP POST)
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridSenderEmail = process.env.SENDGRID_SENDER_EMAIL;
  if (sendgridApiKey && sendgridSenderEmail) {
    try {
      console.log(`[MAILER] Attempting to send email via SendGrid API...`);
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }]
          }],
          from: {
            email: sendgridSenderEmail,
            name: process.env.SENDGRID_SENDER_NAME || 'Socialoop'
          },
          subject: 'Socialoop - Verify your email',
          content: [{
            type: 'text/html',
            value: htmlTemplate
          }]
        })
      });

      if (response.ok) {
        console.log(`[MAILER] Email sent successfully via SendGrid`);
        return { success: true, mode: 'sendgrid' };
      } else {
        const text = await response.text();
        let errorData = text;
        try {
          errorData = JSON.parse(text);
        } catch (_) {}
        console.error(`[MAILER] SendGrid API returned error:`, errorData);
        throw new Error(typeof errorData === 'object' ? JSON.stringify(errorData) : errorData);
      }
    } catch (error) {
      console.error(`[MAILER ERROR] SendGrid sending failed:`, error);
      // fallback to next provider
    }
  }

  // 3. Attempt sending via Resend API (HTTP POST)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      console.log(`[MAILER] Attempting to send email via Resend API...`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Socialoop <onboarding@resend.dev>', // Default free domain for testing
          to: email,
          subject: 'Socialoop - Verify your email',
          html: htmlTemplate
        })
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[MAILER] Email sent successfully via Resend: ${data.id}`);
        return { success: true, mode: 'resend', messageId: data.id };
      } else {
        console.error(`[MAILER] Resend API returned error:`, data);
        throw new Error(data.message || 'Resend error');
      }
    } catch (error) {
      console.error(`[MAILER ERROR] Resend sending failed:`, error);
      // fallback to SMTP if Resend fails
    }
  }

  // 4. Fallback to standard SMTP using Nodemailer (supports Brevo SMTP relay)
  const smtpUser = process.env.SMTP_USER;           // Auth username (e.g. Brevo login email)
  const smtpPass = process.env.SMTP_PASS;           // Auth password or SMTP key
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpFrom = process.env.SMTP_FROM || smtpUser; // Visible sender address
  const smtpFromName = process.env.SMTP_FROM_NAME || 'Socialoop';

  // Need at least a password and a from address to attempt sending
  if (!smtpPass || !smtpFrom) {
    console.log(`[SMTP CONFIG] Missing SMTP credentials (SMTP_PASS or SMTP_FROM). Falling back to log-only.`);
    return { success: false, mode: 'log', otp };
  }

  try {
    console.log(`[SMTP] Attempting to send email via SMTP (${smtpHost}:${smtpPort})...`);

    const transportConfig = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
    };

    // Only add auth if credentials are available
    if (smtpUser && smtpPass) {
      transportConfig.auth = { user: smtpUser, pass: smtpPass };
    } else if (smtpPass) {
      // Brevo-style: use the from address as the auth username
      transportConfig.auth = { user: smtpFrom, pass: smtpPass };
    }

    const transporter = nodemailer.createTransport(transportConfig);

    const mailOptions = {
      from: `"${smtpFromName}" <${smtpFrom}>`,
      to: email,
      subject: 'Socialoop - Verify your email',
      html: htmlTemplate
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully via SMTP: ${info.messageId}`);
    return { success: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP ERROR] SMTP sending failed:`, error);
    return { success: false, mode: 'error', error: error.message, otp };
  }
};
