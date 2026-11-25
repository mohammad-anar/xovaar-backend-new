import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import AuthService from "./auth.service";
import config from "../../config";
import ApiError from "../../utils/ApiError";

const signup = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.signup(req.body);

  // Set refresh token in cookie
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User signed up successfully!",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  const result = await AuthService.login(identifier, password);

  // Set refresh token in cookie
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User signed in successfully!",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken || req.body.refreshToken || req.headers["x-refresh-token"];

  if (!token) {
    throw new ApiError(401, "Refresh token is missing from request");
  }

  const result = await AuthService.refreshToken(token as string);

  // Set new refresh token in cookie
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "New access token generated successfully!",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, "Unauthorized user");
  }

  const { oldPassword, newPassword } = req.body;
  await AuthService.changePassword(userId, oldPassword, newPassword);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully!",
    data: null,
  });
});

const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { identifier } = req.body;
  const result = await AuthService.sendOtp(identifier);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP sent successfully to your registered email or phone!",
    data: result,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { identifier, otp } = req.body;
  await AuthService.verifyOtp(identifier, otp);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified successfully!",
    data: { verified: true },
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { identifier, otp, newPassword } = req.body;
  await AuthService.resetPassword(identifier, otp, newPassword);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password has been reset successfully! You can now sign in.",
    data: null,
  });
});

export const AuthController = {
  signup,
  login,
  refreshToken,
  changePassword,
  sendOtp,
  verifyOtp,
  resetPassword,
};

export default AuthController;
