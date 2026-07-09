import nodemailer from 'nodemailer';

export const sendOtpEmail = async (email, otp) => {
  // If SMTP configuration is missing, print the OTP to the console.
  // This is a robust fallback for development environment without SMTP keys.
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n========================================`);
    console.log(`[SMTP Not Configured]`);
    console.log(`OTP sent to: ${email}`);
    console.log(`OTP code:    ${otp}`);
    console.log(`========================================\n`);
    return true;
  }

  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || 'gmail',
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"Socialoop" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Socialoop - Your One-Time Password (OTP)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #0071e3; text-align: center; margin-bottom: 24px;">Socialoop Verification</h2>
        <p style="font-size: 16px; color: #333333; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; color: #333333; line-height: 1.5;">Thank you for choosing Socialoop. Use the following One-Time Password (OTP) to complete your verification. This OTP is valid for 10 minutes:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0071e3; background-color: #f5f5f7; padding: 12px 24px; border-radius: 8px; border: 1px dashed #0071e3; display: inline-block;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #86868b; line-height: 1.5; text-align: center;">If you did not request this verification, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #86868b; text-align: center;">&copy; ${new Date().getFullYear()} Socialoop. All rights reserved.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending SMTP email:', error);
    // If SMTP fails, print to console as a fallback in dev
    console.log(`\n========================================`);
    console.log(`[SMTP Failed - Fallback Console Output]`);
    console.log(`OTP sent to: ${email}`);
    console.log(`OTP code:    ${otp}`);
    console.log(`========================================\n`);
    return false;
  }
};
