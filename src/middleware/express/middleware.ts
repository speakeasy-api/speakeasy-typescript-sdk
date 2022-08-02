import { Request, Response } from "express";
import { getInstance } from "../../speakeasy";
import { sendApiCall } from "../../transport";
import { outputError } from "../../error";
import { Har, AdditionalData } from "../../format/har";

export function expressMiddleware() {
  return function (req: Request, res: Response, next: () => void) {
    const speakeasy = getInstance();
    if (speakeasy == null) {
      outputError("Speakeasy has not been initialized");
      return next();
    }

    res.on("finish", () => {
      const additionalData: AdditionalData = {};
      // TODO(kevinc): Get body data
      const har = Har.buildHar(req, res, additionalData);
      sendApiCall(har);
    });
    next();
  };
}
