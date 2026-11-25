import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import config from "../config";
import ApiError from "../utils/ApiError";
import jwtHelpers from "../helpers/jwtHelpers";
import prisma from "../config/prisma";
import { UserRole } from "@prisma/client";

export interface IAuthUser {
  userId: string;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}

export const authGuard =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "You are not authorized! Token is missing.");
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new ApiError(401, "Access token is required");
      }

      // Verify token
      let verifiedUser: any;
      try {
        verifiedUser = jwtHelpers.verifyToken(
          token,
          config.jwt.access_secret as Secret
        );
      } catch (err) {
        throw new ApiError(401, "Access token has expired or is invalid");
      }

      // Check if user still exists in database and is active
      const user = await prisma.user.findUnique({
        where: { id: verifiedUser.userId },
      });

      if (!user) {
        throw new ApiError(404, "User account no longer exists");
      }

      if (user.isDeleted) {
        throw new ApiError(403, "This account has been deleted. Please contact support.");
      }

      if (user.status === "BLOCKED") {
        throw new ApiError(403, "Your account has been blocked.");
      }

      if (user.status === "SUSPENDED") {
        throw new ApiError(403, "Your account has been suspended.");
      }

      if (user.status === "HOLD") {
        throw new ApiError(403, "Your account is currently on hold.");
      }

      if (user.status === "INACTIVE") {
        throw new ApiError(403, "Your account is inactive.");
      }

      // Role check
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        throw new ApiError(403, "Forbidden! You do not have permission to access this resource.");
      }

      req.user = {
        userId: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
      };

      next();
    } catch (error) {
      next(error);
    }
  };

export default authGuard;
