import { Duplex } from "stream";

import { Request, Response } from "express";
import getRawBody from "raw-body";
import { parse as parseContentType } from "content-type";

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

    // Capturing request body
    let rawBody: null | string = null;
    let rawBodyParserErr: null | Error = null;
    const rawBodyOptions: {
      encoding: string;
    } = {
      encoding: "utf-8",
    };
    try {
      rawBodyOptions.encoding = parseContentType(req).parameters.charset;
    } catch (err) {} // We don't decode if we can't parse the charset
    getRawBody(req, rawBodyOptions, (err, result) => {
      if (err) {
        rawBodyParserErr = err;
        return;
        // We skip logging the body if there's an error
      }
      rawBody = result;
    });

    // Capturing response body by overwriting the default write and end methods
    const oldWrite = res.write;
    const oldEnd = res.end;

    const responseChunks: any[] = [];

    res.write = (chunk, ...args) => {
      responseChunks.push(chunk);
      //@ts-ignore TS cannot type args correctly
      return oldWrite.apply(res, [chunk, ...args]);
    };

    //@ts-ignore TS cannot type args correctly
    res.end = (...args) => {
      // #end has 3 signatures, the first argument is a chunk only if there are more than 1 argument
      if (args.length > 1) {
        responseChunks.push(args[0]);
      }
      //@ts-ignore TS cannot type args correctly
      return oldEnd.apply(res, args);
    };

    res.on("finish", () => {
      const additionalData: AdditionalData = {};
      if (rawBody != null) {
        additionalData.reqBodyString = rawBody;
      }
      if (rawBodyParserErr != null) {
        additionalData.reqBodyStringComment = `Failed to capture body string: ${rawBodyParserErr.message}`;
      }
      if (responseChunks.length > 0) {
        const responseBuffer = Buffer.concat(responseChunks);
        additionalData.responseText = responseBuffer.toString("utf8");
        additionalData.responseSize = responseBuffer.byteLength;
      }

      const har = Har.buildHar(req, res, additionalData);
      sendApiCall(har);
    });
    next();
  };
}
