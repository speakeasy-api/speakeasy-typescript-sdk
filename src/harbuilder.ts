import {
  Content,
  Cookie,
  Har,
  Request as HarRequest,
  Response as HarResponse,
  Header,
  PostData,
  QueryString,
} from "har-format";
import { Request, Response } from "express";
import { timeNow, timeSince } from "./time";

import { PassThrough } from "stream";
import Timestamp from "timestamp-nano";
import cookie from "cookie";
import getRawBody from "raw-body";
import { parse as parseContentType } from "content-type";
import setCookie from "set-cookie-parser";
import { speakeasyVerion } from "./speakeasy";
import url from "url";

export type AdditionalData = {
  reqBodyString?: string;
  reqBodyStringComment?: string;
  responseText?: string;
  responseSize?: number;
};

export class HarBuilder {
  private har: Har | null = null;

  // TODO this specifically supports express Request/Response format atm need to investigate work required to support other frameworks
  public static async populate(
    req: Request,
    reqPipe: PassThrough,
    res: Response,
    resBuf: Buffer,
    startTime: Timestamp,
    port: number
  ): Promise<HarBuilder> {
    return new HarBuilder().populate(
      req,
      reqPipe,
      res,
      resBuf,
      startTime,
      port
    );
  }

  public async populate(
    req: Request,
    reqPipe: PassThrough,
    res: Response,
    resBuf: Buffer,
    startTime: Timestamp,
    port: number
  ): Promise<HarBuilder> {
    const host = req.get("host") ?? "";

    const fullURL = `${req.protocol}://${host}${
      !host.includes(":") && port != 80 && port != 443 ? `:${port}` : ""
    }${req.originalUrl}`;

    const httpVersion = `HTTP/${req.httpVersion}`;

    this.har = {
      log: {
        version: "1.2",
        creator: {
          name: "speakeasy-typescript-sdk",
          version: speakeasyVerion,
        },
        comment: `request capture for ${fullURL}`,
        entries: [
          {
            startedDateTime: startTime.toJSON(),
            time: timeSince(startTime),
            request: await this.buildRequest(
              req,
              reqPipe,
              fullURL,
              httpVersion
            ),
            response: this.buildResponse(res, resBuf, httpVersion),
            cache: {},
            timings: {
              send: -1,
              receive: -1,
              wait: -1,
            },
            serverIPAddress: req.hostname,
            connection: port.toString(),
          },
        ],
      },
    };

    return this;
  }

  public build(): string {
    return JSON.stringify(this.har);
  }

  private async buildRequest(
    req: Request,
    reqPipe: PassThrough,
    fullURL: string,
    httpVersion: string
  ): Promise<HarRequest> {
    const result: HarRequest = {
      method: req.method ?? "",
      url: fullURL,
      httpVersion: httpVersion,
      cookies: this.buildRequestCookie(req),
      headers: this.buildRequestHeaders(req),
      queryString: this.buildQueryString(fullURL),
      headersSize: this.buildRequestHeadersSize(req),
      bodySize: -1,
    };
    const postData = await this.buildRequestPostData(req, reqPipe);
    if (postData != null) {
      result.postData = postData;
      result.bodySize = postData.text?.length ?? -1;
    }

    return result;
  }

  private buildResponse(
    res: Response,
    resBuf: Buffer,
    httpVersion: string
  ): HarResponse {
    const content = this.buildResponseContent(res, resBuf);
    const result: HarResponse = {
      status: res.statusCode,
      statusText: res.statusMessage,
      httpVersion: httpVersion,
      cookies: this.buildResponseCookie(res),
      headers: this.buildResponseHeaders(res),
      content: content,
      redirectURL: res.getHeader("location")?.toString() ?? "",
      headersSize: this.buildResponseHeadersSize(res),
      bodySize: content.size,
    };

    return result;
  }

  private buildRequestCookie(req: Request): Cookie[] {
    const cookies = req.headers.cookie ?? "";
    const entries: Cookie[] = [];
    if (!cookie) {
      return [];
    }
    Object.entries(cookie.parse(cookies)).forEach(([cookieName, cookieVal]) => {
      entries.push({
        name: cookieName,
        value: cookieVal,
      });
    });
    return entries;
  }

  private async buildRequestPostData(
    req: Request,
    reqPipe: PassThrough
  ): Promise<PostData | undefined> {
    const rawBodyOptions: {
      encoding: string;
    } = {
      encoding: "utf-8",
    };
    try {
      rawBodyOptions.encoding = parseContentType(req).parameters.charset;
    } catch (err) {}

    const rawBody: Buffer | string = await getRawBody(reqPipe, rawBodyOptions);

    if (!rawBody) {
      return undefined;
    }

    return {
      // We don't parse the body params
      mimeType: req.headers["content-type"] ?? "",
      text: rawBody.toString(),
    };
  }

  private buildResponseCookie(res: Response): Cookie[] {
    const setCookieHeader = res.getHeader("set-cookie");
    if (setCookieHeader == null) {
      return [];
    }

    const rawCookies: string[] = [];

    if (Array.isArray(setCookieHeader)) {
      for (const cookie of setCookieHeader) {
        rawCookies.push(...setCookie.splitCookiesString(cookie));
      }
    } else {
      rawCookies.push(
        ...setCookie.splitCookiesString(setCookieHeader.toString())
      );
    }

    return setCookie.parse(rawCookies).map((cookie) => {
      const hc: Cookie = {
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        domain: cookie.domain,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
      };

      if (cookie.expires) {
        hc.expires = cookie.expires.toISOString();
      } else if (cookie.maxAge) {
        hc.expires = timeNow()
          .addNano(cookie.maxAge * 1000000000)
          .toJSON();
      }

      return hc;
    });
  }

  private buildRequestHeaders(req: Request): Header[] {
    const headers: Header[] = [];

    for (const [headerName, headerValue] of Object.entries(req.headers)) {
      if (!headerValue) {
        continue;
      }

      if (Array.isArray(headerValue)) {
        for (const value of headerValue) {
          headers.push({
            name: headerName,
            value: value,
          });
        }
      } else {
        headers.push({
          name: headerName,
          value: headerValue.toString(),
        });
      }
    }

    return headers;
  }

  private buildRequestHeadersSize(req: Request): number {
    // Building string to get actual byte size
    let rawHeaders = "";
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      rawHeaders += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    }
    rawHeaders += "\r\n";
    return Buffer.byteLength(rawHeaders, "utf8");
  }

  private buildResponseHeadersSize(res: Response): number {
    // Building string to get actual byte size
    let rawHeaders = "";
    res.getHeaderNames().forEach((headerName) => {
      const headerValue = res.getHeader(headerName);

      if (headerValue == null) {
        return;
      }

      if (Array.isArray(headerValue)) {
        for (const value of headerValue) {
          rawHeaders += `${headerName}: ${value}\r\n`;
        }
      } else {
        rawHeaders += `${headerName}: ${headerValue}\r\n`;
      }
    });
    rawHeaders += "\r\n";
    return Buffer.byteLength(rawHeaders, "utf8");
  }

  private buildResponseHeaders(res: Response): Header[] {
    const headers: Header[] = [];
    res.getHeaderNames().forEach((headerName) => {
      const value = res.getHeader(headerName);

      if (value == null) {
        return;
      }

      if (Array.isArray(value)) {
        for (const val of value) {
          headers.push({
            name: headerName,
            value: val,
          });
        }
      } else {
        headers.push({
          name: headerName,
          value: value.toString(),
        });
      }
    });

    return headers;
  }

  private buildResponseContent(res: Response, resBuf: Buffer): Content {
    const content: Content = {
      size: -1,
      mimeType:
        res.getHeader("content-type")?.toString() ?? "application/octet-stream",
    };
    if (resBuf.length > 0) {
      content.text = resBuf.toString("utf8");
      content.size = resBuf.length;
    }

    return content;
  }

  private buildQueryString(urlStr: string): QueryString[] {
    const queryObj = url.parse(urlStr, true).query;
    const queryString: QueryString[] = [];
    Object.entries(queryObj).forEach(([name, value]) => {
      if (value === undefined) {
        queryString.push({
          name: name,
          value: "",
        });
      } else if (Array.isArray(value)) {
        queryString.concat(
          value.map((val) => ({
            name: name,
            value: val,
          }))
        );
      } else {
        queryString.push({
          name,
          value,
        });
      }
    });
    return queryString;
  }
}
