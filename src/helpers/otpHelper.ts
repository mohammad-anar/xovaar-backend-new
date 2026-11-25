/**
 * Generates a 6-digit numeric OTP and expiry timestamp (10 minutes from now)
 */
export const generateOtp = (): { otp: string; expiresAt: Date } => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { otp, expiresAt };
};

export const isOtpExpired = (expiresAt: Date | null | undefined): boolean => {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
};

export default {
  generateOtp,
  isOtpExpired,
};
