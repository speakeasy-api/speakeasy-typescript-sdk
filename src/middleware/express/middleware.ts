import { Request, Response } from "express";
import { getInstance } from "../../speakeasy";
import { sendApiCall } from "../../transport";
import { outputError } from "../../error";

export function expressMiddleware() {
  return function (req: Request, res: Response, next: () => void) {
    const speakeasy = getInstance();
    if (speakeasy == null) {
      outputError("Speakeasy has not been initialized");
      return next();
    }

    res.on("finish", () => {
      sendApiCall();
    });
    next();
  };
}
