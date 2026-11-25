import nodemailer from "nodemailer";
import config from "../config";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendOtpEmail = async (
  to: string,
  otp: string,
  purpose: "PASSWORD_RESET" | "EMAIL_VERIFICATION" = "PASSWORD_RESET"
) => {
  console.log(`🔑 [OTP GENERATED] To: ${to} | Code: ${otp} | Purpose: ${purpose}`);

  const subject =
    purpose === "PASSWORD_RESET"
      ? "XOVAAR — Password Reset Verification Code"
      : "XOVAAR — Account Verification Code";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f17; color: #f3f4f6; margin: 0; padding: 30px 15px; }
          .container { max-width: 500px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; padding: 35px 30px; text-align: center; }
          .logo { font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #ffffff; text-transform: uppercase; margin-bottom: 25px; }
          .title { font-size: 16px; font-weight: 700; color: #ffffff; margin-bottom: 12px; letter-spacing: 0.5px; }
          .subtitle { font-size: 12px; color: #9ca3af; line-height: 1.6; margin-bottom: 25px; }
          .otp-box { background: #000000; border: 1px solid #374151; padding: 18px 25px; font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #22c55e; display: inline-block; margin-bottom: 25px; font-family: 'Courier New', Courier, monospace; }
          .expiry { font-size: 11px; color: #6b7280; margin-bottom: 30px; }
          .footer { font-size: 10px; color: #4b5563; border-top: 1px solid #1f2937; padding-top: 20px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">XOVAAR</div>
          <div class="title">VERIFICATION CODE</div>
          <p class="subtitle">Use the one-time code below to verify your identity and update your security credentials.</p>
          <div class="otp-box">${otp}</div>
          <div class="expiry">This code will expire in 10 minutes. If you did not initiate this request, please disregard this email.</div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} XOVAAR. Aura Streetwear & Minimalist Luxury.<br>
            All rights reserved. Secure Automated Dispatch.
          </div>
        </div>
      </body>
    </html>
  `;

  // If credentials are not set or in test mode, return cleanly without throwing unhandled network rejection
  if (!config.smtp.pass) {
    console.warn("⚠️ [XOVAAR Email] SMTP_PASS not set in .env. OTP displayed in console for development.");
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
    console.log(`📨 [XOVAAR Email] Sent OTP email to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ [XOVAAR Email] Failed to send email:", error);
    // Return gracefully so OTP flow can still be completed in development
    return { success: false, error };
  }
};

export const EmailHelper = {
  sendOtpEmail,
};

export default EmailHelper;
