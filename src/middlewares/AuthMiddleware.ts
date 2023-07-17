import { Request, Response } from "express";
import createHttpError from "http-errors";

export const authMiddleware = async (req: Request, res: Response, next: Function) => {

  if (!req.headers.authorization) {
    return next(createHttpError.Unauthorized())
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return next(createHttpError.Unauthorized())
  }
}