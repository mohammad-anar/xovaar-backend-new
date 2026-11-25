import { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API not found",
      },
    ],
  });
};

export default notFoundHandler;
