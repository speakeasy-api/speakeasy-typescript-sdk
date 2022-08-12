import { NextFunction, Request, RequestHandler, Response } from "express";

import { HarBuilder } from "../../harbuilder";
import { MiddlewareController } from "../../controller";
import { RequestResponseWriter } from "../../requestresponsewriter";
import { SpeakeasySDK } from "../../speakeasy";
import { normalizePathHint } from "../../pathhints";
import { timeNow } from "../../time";

declare global {
  namespace Express {
    interface Request {
      controller: MiddlewareController;
      __route: string;
    }
  }
}

export function expressCompatibleMiddleware(
  speakeasy: SpeakeasySDK
): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    const startTime = timeNow();

    const reqResWriter = new RequestResponseWriter(req, res);

    const controller = new MiddlewareController();

    res.on("finish", () => {
      reqResWriter.end();

      // If we don't have a route then we have likely hit a 404 and there exist no route for this request
      if (req.route) {
        var pathHint = req.__route || req.route.path;
        pathHint = normalizePathHint(pathHint);
        if (controller.getPathHint()) {
          pathHint = controller.getPathHint();
        }

        const har = HarBuilder.populate(
          req,
          res,
          reqResWriter,
          startTime,
          speakeasy.port
        );

        speakeasy.send(har.build(), pathHint, controller.getCustomerID());
      }
    });

    req.controller = controller;

    next();
  };
}
