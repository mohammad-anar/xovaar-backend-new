import bcrypt from "bcryptjs";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import prisma from "../../config/prisma";
import ApiError from "../../utils/ApiError";
import jwtHelpers from "../../helpers/jwtHelpers";
import { generateOtp, isOtpExpired } from "../../helpers/otpHelper";
import EmailHelper from "../../helpers/emailHelper";
import { User, UserRole } from "@prisma/client";

interface ISignupPayload {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
    status: string;
    profileImage: string | null;
    isDefaultPassword: boolean;
  };
}

const signup = async (payload: ISignupPayload): Promise<ILoginResponse> => {
  const { name, email, phone, password, role } = payload;

  const cleanEmail = email?.trim() ? email.trim().toLowerCase() : null;
  const cleanPhone = phone?.trim() ? phone.trim() : null;

  if (!cleanEmail && !cleanPhone) {
    throw new ApiError(400, "At least one of Email or Phone Number is required");
  }

  // Check unique constraints
  if (cleanEmail) {
    const existingEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existingEmail) {
      throw new ApiError(409, "An account with this email already exists");
    }
  }

  if (cleanPhone) {
    const existingPhone = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });
    if (existingPhone) {
      throw new ApiError(409, "An account with this phone number already exists");
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.bcrypt_salt_rounds);

  const newUser = await prisma.user.create({
    data: {
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: role || UserRole.CUSTOMER,
      status: "ACTIVE",
      isDeleted: false,
    },
  });

  // Generate tokens
  const tokenPayload = {
    userId: newUser.id,
    role: newUser.role,
    email: newUser.email,
    phone: newUser.phone,
  };

  const accessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: newUser.status,
      profileImage: newUser.profileImage,
      isDefaultPassword: newUser.isDefaultPassword,
    },
  };
};

const login = async (identifier: string, password: string): Promise<ILoginResponse> => {
  const cleanIdentifier = identifier.trim();

  // Find user by email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: cleanIdentifier.toLowerCase() },
        { phone: cleanIdentifier },
      ],
    },
  });

  if (!user) {
    throw new ApiError(404, "No account found matching this email or phone");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "This account has been deleted. Please contact support.");
  }

  if (user.status === "BLOCKED") {
    throw new ApiError(403, "This account has been blocked. Access denied.");
  }

  if (user.status === "SUSPENDED") {
    throw new ApiError(403, "This account is currently suspended. Please contact support.");
  }

  if (user.status === "HOLD") {
    throw new ApiError(403, "This account is currently on hold. Please contact support.");
  }

  if (user.status === "INACTIVE") {
    throw new ApiError(403, "This account is inactive. Please contact support.");
  }

  // Validate password
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid password. Please check your credentials.");
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  };

  const accessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      profileImage: user.profileImage,
      isDefaultPassword: user.isDefaultPassword,
    },
  };
};

const refreshToken = async (token: string): Promise<{ accessToken: string; refreshToken: string }> => {
  let verifiedToken: any;
  try {
    verifiedToken = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_secret as Secret
    );
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token. Please sign in again.");
  }

  const { userId } = verifiedToken;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.isDeleted || user.status !== "ACTIVE") {
    throw new ApiError(403, "User account is unavailable or restricted.");
  }

  const tokenPayload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    phone: user.phone,
  };

  const newAccessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in
  );

  const newRefreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret as Secret,
    config.jwt.refresh_expires_in
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const changePassword = async (
  userId: string,
  oldPass: string,
  newPass: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User account not found");
  }

  // Security Rule: If user has no email registered, they cannot update password via self-service until adding email
  if (!user.email) {
    throw new ApiError(400, "Please add your email address first to secure and change your password");
  }

  const isMatched = await bcrypt.compare(oldPass, user.password);
  if (!isMatched) {
    throw new ApiError(400, "Current password does not match");
  }

  const hashedNewPassword = await bcrypt.hash(newPass, config.bcrypt_salt_rounds);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      isDefaultPassword: false,
    },
  });
};

const sendOtp = async (identifier: string): Promise<{ otp: string; expiresAt: Date; emailOrPhone: string }> => {
  const cleanId = identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: cleanId.toLowerCase() }, { phone: cleanId }],
    },
  });

  if (!user) {
    throw new ApiError(404, "No account registered with this email or phone");
  }

  if (user.isDeleted || user.status !== "ACTIVE") {
    throw new ApiError(403, "This account is inactive, deleted, or restricted.");
  }

  // Rule: If user has no email set, cannot do password recovery
  if (!user.email) {
    throw new ApiError(400, "Please contact with admin");
  }

  const { otp, expiresAt } = generateOtp();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otp,
      otpExpiresAt: expiresAt,
    },
  });

  // Send branded OTP email
  await EmailHelper.sendOtpEmail(user.email, otp);

  console.log(`[XOVAAR OTP] Generated OTP ${otp} for account: ${user.email}`);

  return {
    otp,
    expiresAt,
    emailOrPhone: user.email,
  };
};

const verifyOtp = async (identifier: string, otp: string): Promise<boolean> => {
  const cleanId = identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: cleanId.toLowerCase() }, { phone: cleanId }],
    },
  });

  if (!user) {
    throw new ApiError(404, "No account registered with this email or phone");
  }

  if (!user.otp || user.otp !== otp.trim()) {
    throw new ApiError(400, "Invalid OTP code. Please enter the correct 6-digit code.");
  }

  if (isOtpExpired(user.otpExpiresAt)) {
    throw new ApiError(400, "OTP has expired. Please request a new code.");
  }

  return true;
};

const resetPassword = async (
  identifier: string,
  otp: string,
  newPass: string
): Promise<void> => {
  const cleanId = identifier.trim();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: cleanId.toLowerCase() }, { phone: cleanId }],
    },
  });

  if (!user) {
    throw new ApiError(404, "No account registered with this email or phone");
  }

  if (!user.otp || user.otp !== otp.trim()) {
    throw new ApiError(400, "Invalid OTP code");
  }

  if (isOtpExpired(user.otpExpiresAt)) {
    throw new ApiError(400, "OTP has expired. Please request a new code.");
  }

  const hashedPassword = await bcrypt.hash(newPass, config.bcrypt_salt_rounds);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      isDefaultPassword: false,
      otp: null,
      otpExpiresAt: null,
    },
  });
};

export const AuthService = {
  signup,
  login,
  refreshToken,
  changePassword,
  sendOtp,
  verifyOtp,
  resetPassword,
};

export default AuthService;
