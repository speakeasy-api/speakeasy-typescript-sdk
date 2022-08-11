import { NextFunction, Request, RequestHandler, Response } from "express";

import { HarBuilder } from "../../harbuilder";
import { MiddlewareController } from "../../controller";
import { PassThrough } from "stream";
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

    // Capturing response body by overwriting the default write and end methods
    const oldWrite = res.write;
    const oldEnd = res.end;

    var responseBuffer: Buffer = Buffer.alloc(0);

    res.write = (chunk, ...args) => {
      responseBuffer = Buffer.concat([responseBuffer, chunk]);

      //@ts-ignore TS cannot type args correctly
      return oldWrite.apply(res, [chunk, ...args]);
    };

    //@ts-ignore TS cannot type args correctly
    res.end = (...args) => {
      // #end has 3 signatures, the first argument is a chunk only if there are more than 1 argument
      if (args.length > 1) {
        responseBuffer = Buffer.concat([
          responseBuffer,
          new TextEncoder().encode(args[0]),
        ]);
      }
      //@ts-ignore TS cannot type args correctly
      return oldEnd.apply(res, args);
    };

    const controller = new MiddlewareController();

    var reqPipe = new PassThrough();

    req.pipe(reqPipe);

    res.on("finish", async () => {
      reqPipe.end();

      // If we don't have a route then we have likely hit a 404 and there exist no route for this request
      if (req.route) {
        var pathHint = req.__route || req.route.path;
        pathHint = normalizePathHint(pathHint);
        if (controller.getPathHint()) {
          pathHint = controller.getPathHint();
        }

        const har = await HarBuilder.populate(
          req,
          reqPipe,
          res,
          responseBuffer,
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
