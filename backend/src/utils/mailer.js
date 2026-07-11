import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  console.log(`[OTP DEBUG] OTP for ${email}: ${otp}`);

  // 1. Attempt sending via Resend API (HTTP POST - unaffected by Render's SMTP port blocks)
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
          html: `
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
          `
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

  // 2. Fallback to standard SMTP using Nodemailer
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');

  if (!user || !pass) {
    console.log(`[SMTP CONFIG] Missing SMTP credentials (and no RESEND_API_KEY). Falling back to log-only.`);
    return { success: false, mode: 'log', otp };
  }

  try {
    console.log(`[SMTP] Attempting to send email via SMTP (${host}:${port})...`);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"Socialoop" <${user}>`,
      to: email,
      subject: 'Socialoop - Verify your email',
      html: `
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
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully via SMTP: ${info.messageId}`);
    return { success: true, mode: 'smtp', messageId: info.messageId };
  } catch (error) {
    console.error(`[SMTP ERROR] SMTP sending failed:`, error);
    return { success: false, mode: 'error', error: error.message, otp };
  }
};
