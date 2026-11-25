import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import authGuard from "../../middlewares/authGuard";
import AuthValidation from "./auth.validation";
import AuthController from "./auth.controller";

const router = express.Router();

router.post(
  "/signup",
  validateRequest(AuthValidation.signupZodSchema),
  AuthController.signup
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.login
);

router.post(
  "/refresh-token",
  AuthController.refreshToken
);

router.patch(
  "/change-password",
  authGuard(),
  validateRequest(AuthValidation.changePasswordZodSchema),
  AuthController.changePassword
);

router.post(
  "/send-otp",
  validateRequest(AuthValidation.sendOtpZodSchema),
  AuthController.sendOtp
);

router.post(
  "/verify-otp",
  validateRequest(AuthValidation.verifyOtpZodSchema),
  AuthController.verifyOtp
);

router.patch(
  "/reset-password",
  validateRequest(AuthValidation.resetPasswordZodSchema),
  AuthController.resetPassword
);

export const AuthRoutes = router;
export default AuthRoutes;
