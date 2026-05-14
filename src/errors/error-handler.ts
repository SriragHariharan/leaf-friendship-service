import type { NextFunction, Request, Response } from "express";
import { PrismaClientKnownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import createError, { isHttpError } from "http-errors";

function jsonError(res: Response, status: number, message: string): void {
  res.status(status).json({
    success: false,
    error: { status, message },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (isHttpError(err)) {
    const safeMessage =
      err.status >= 500 && process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;
    jsonError(res, err.status, safeMessage);
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const e = createError(409, "A conflicting record already exists");
      jsonError(res, e.status, e.message);
      return;
    }
    if (err.code === "P2025") {
      const e = createError(404, "Resource not found");
      jsonError(res, e.status, e.message);
      return;
    }
  }

  if (err instanceof PrismaClientValidationError) {
    const e = createError(400, "Invalid data supplied to the database layer");
    jsonError(res, e.status, e.message);
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  } else {
    console.error(err instanceof Error ? { name: err.name, message: err.message } : "Unknown error");
  }

  const e = createError(500, "Internal Server Error");
  jsonError(res, e.status, e.message);
}
