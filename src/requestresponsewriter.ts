import type { Request, Response } from "express";

import { PassThrough } from "stream";
import { parse as parseContentType } from "content-type";

var maxCaptureSize = 1 * 1024 * 1024;

export function setMaxCaptureSize(size: number): void {
  maxCaptureSize = size;
}

export class RequestResponseWriter {
  private responseBuffer: Buffer = Buffer.alloc(0);
  private responseDropped: boolean = false;
  private requestBuffer: Buffer = Buffer.alloc(0);
  private requestDropped: boolean = false;
  private reqPipe = new PassThrough();
  private encoding: string = "utf-8";

  constructor(req: Request, res: Response) {
    this.setupRequestCapture(req);
    this.setupResponseCapture(res);

    try {
      this.encoding = parseContentType(req).parameters.charset;
    } catch (err) {}
  }

  public end(): void {
    this.reqPipe.end();
  }

  public getRequestBody(): Buffer | null {
    return this.requestDropped ? null : this.requestBuffer;
  }

  public getRequestBodyEncoding(): BufferEncoding {
    return this.encoding as BufferEncoding;
  }

  public getResponseBody(): Buffer | null {
    return this.responseDropped ? null : this.responseBuffer;
  }

  private setupRequestCapture(req: Request): void {
    req.pipe(this.reqPipe);

    this.reqPipe.on("data", (chunk) => {
      if (
        this.responseBuffer.length + this.requestBuffer.length + chunk.length <=
        maxCaptureSize
      ) {
        this.requestBuffer = Buffer.concat([this.requestBuffer, chunk]);
      } else {
        this.requestDropped = true;
      }
    });
  }

  private setupResponseCapture(res: Response): void {
    // Capturing response body by overwriting the default write and end methods
    const oldWrite = res.write;
    const oldEnd = res.end;

    res.write = (chunk, ...args) => {
      this.captureResponse(chunk);

      //@ts-ignore TS cannot type args correctly
      return oldWrite.apply(res, [chunk, ...args]);
    };

    //@ts-ignore TS cannot type args correctly
    res.end = (...args) => {
      // #end has 3 signatures, the first argument is a chunk only if there are more than 1 argument
      if (args.length > 1) {
        this.captureResponse(new TextEncoder().encode(args[0]));
      }
      //@ts-ignore TS cannot type args correctly
      return oldEnd.apply(res, args);
    };
  }

  private captureResponse(chunk: any): void {
    if (
      this.responseBuffer.length + this.requestBuffer.length + chunk.length <=
      maxCaptureSize
    ) {
      this.responseBuffer = Buffer.concat([this.responseBuffer, chunk]);
    } else {
      this.responseDropped = true;
    }
  }
}
