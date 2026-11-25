import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import config from "../config";
import ApiError from "../utils/ApiError";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
) => {
  let statusCode = 500;
  let message = "Something went wrong!";
  let errorMessages: Array<{ path: string | number; message: string }> = [];

  if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorMessages = error.issues.map((issue) => ({
      path: issue.path[issue.path.length - 1],
      message: issue.message,
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      statusCode = 409;
      const target = (error.meta?.target as string) || "Field";
      message = `${target} already exists. Duplicate value not allowed.`;
    } else if (error.code === "P2025") {
      statusCode = 404;
      message = (error.meta?.cause as string) || "Record not found.";
    }
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.message ? [{ path: "", message: error.message }] : [];
  } else if (error?.name === "TokenExpiredError") {
    statusCode = 401;
    message = "JWT token has expired";
  } else if (error?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid JWT token";
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = error.message ? [{ path: "", message: error.message }] : [];
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errorMessages,
    stack: config.env === "development" ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
