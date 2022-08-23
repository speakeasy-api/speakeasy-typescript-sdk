import {
  Content,
  Cookie,
  Har,
  Request as HarRequest,
  Response as HarResponse,
  Header,
  QueryString,
} from "har-format";
import type { Request, Response } from "express";
import { timeNow, timeSince } from "./time";

import { Masking } from "./controller";
import { RequestResponseWriter } from "./requestresponsewriter";
import Timestamp from "timestamp-nano";
import cookie from "cookie";
import { maskBodyRegex } from "./bodymasking";
import setCookie from "set-cookie-parser";
import { speakeasyVersion } from "./speakeasy";
import url from "url";

const droppedText = "--dropped--";

export type AdditionalData = {
  reqBodyString?: string;
  reqBodyStringComment?: string;
  responseText?: string;
  responseSize?: number;
};

export class HarBuilder {
  private har: Har | null = null;

  // TODO this specifically supports express Request/Response format atm need to investigate work required to support other frameworks
  public static populate(
    req: Request,
    res: Response,
    reqResWriter: RequestResponseWriter,
    startTime: Timestamp,
    port: number,
    masking: Masking
  ): HarBuilder {
    return new HarBuilder().populate(
      req,
      res,
      reqResWriter,
      startTime,
      port,
      masking
    );
  }

  public populate(
    req: Request,
    res: Response,
    reqResWriter: RequestResponseWriter,
    startTime: Timestamp,
    port: number,
    masking: Masking
  ): HarBuilder {
    const host = req.get("host") ?? "";

    const fullOriginalURL = `${req.protocol}://${host}${
      !host.includes(":") && port != 80 && port != 443 ? `:${port}` : ""
    }${req.originalUrl}`;

    const harQueryString = this.buildQueryString(fullOriginalURL, masking);

    const u = new URL(fullOriginalURL);

    u.search = "";

    harQueryString.forEach((qs) => {
      u.searchParams.append(qs.name, qs.value);
    });

    const fullURL = u.toString();

    const httpVersion = `HTTP/${req.httpVersion}`;

    this.har = {
      log: {
        version: "1.2",
        creator: {
          name: "speakeasy-typescript-sdk",
          version: speakeasyVersion,
        },
        comment: `request capture for ${fullURL}`,
        entries: [
          {
            startedDateTime: startTime.toJSON(),
            time: timeSince(startTime),
            request: this.buildRequest(
              req,
              reqResWriter,
              fullURL,
              httpVersion,
              masking,
              harQueryString
            ),
            response: this.buildResponse(
              res,
              reqResWriter,
              httpVersion,
              masking
            ),
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

  private buildRequest(
    req: Request,
    reqResWriter: RequestResponseWriter,
    fullURL: string,
    httpVersion: string,
    masking: Masking,
    harQueryString: QueryString[]
  ): HarRequest {
    const result: HarRequest = {
      method: req.method ?? "",
      url: fullURL,
      httpVersion: httpVersion,
      cookies: this.buildRequestCookie(req, masking),
      headers: this.buildRequestHeaders(req, masking),
      queryString: harQueryString,
      headersSize: this.buildRequestHeadersSize(req),
      bodySize: -1,
    };

    const body = reqResWriter.getRequestBody();

    if (body !== null) {
      if (body.length > 0) {
        const mimeType = req.headers["content-type"] ?? "";

        let bodyString = body.toString(reqResWriter.getRequestBodyEncoding());
        try {
          bodyString = maskBodyRegex(
            bodyString,
            mimeType,
            masking.requestFieldMasksString,
            masking.requestFieldMasksNumber
          );
        } catch (e) {
          // TODO: log error
        }

        result.postData = {
          mimeType: req.headers["content-type"] ?? "",
          text: bodyString,
        };
      }
    } else {
      result.postData = {
        mimeType: req.headers["content-type"] ?? "application/octet-stream",
        text: droppedText,
      };
    }

    if (result.postData) {
      result.bodySize = parseInt(req.headers["content-length"], 10);
    }

    return result;
  }

  private buildResponse(
    res: Response,
    reqResWriter: RequestResponseWriter,
    httpVersion: string,
    masking: Masking
  ): HarResponse {
    const content = this.buildResponseContent(res, reqResWriter, masking);
    const result: HarResponse = {
      status: res.statusCode,
      statusText: res.statusMessage,
      httpVersion: httpVersion,
      cookies: this.buildResponseCookie(res, masking),
      headers: this.buildResponseHeaders(res, masking),
      content: content,
      redirectURL: res.getHeader("location")?.toString() ?? "",
      headersSize: this.buildResponseHeadersSize(res),
      bodySize:
        res.statusCode == 304
          ? 0
          : parseInt(res.getHeader("content-length")?.toString() ?? "-1", 10),
    };

    return result;
  }

  private buildRequestCookie(req: Request, masking: Masking): Cookie[] {
    const cookies = req.headers.cookie ?? "";
    const entries: Cookie[] = [];
    if (!cookie) {
      return [];
    }
    Object.entries(cookie.parse(cookies)).forEach(([cookieName, cookieVal]) => {
      const cookieMask = masking.requestCookieMasks[cookieName];
      if (cookieMask) {
        cookieVal = cookieMask;
      }

      entries.push({
        name: cookieName,
        value: cookieVal,
      });
    });
    return entries;
  }

  private buildResponseCookie(res: Response, masking: Masking): Cookie[] {
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
      let cookieValue = cookie.value;
      const cookieMask = masking.responseCookieMasks[cookie.name];
      if (cookieMask) {
        cookieValue = cookieMask;
      }

      const hc: Cookie = {
        name: cookie.name,
        value: cookieValue,
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

  private buildRequestHeaders(req: Request, masking: Masking): Header[] {
    var headers: Header[] = [];

    const addHeader = (name: string, value: string) => {
      const headerMask = masking.requestHeaderMasks[name];
      if (headerMask) {
        value = headerMask;
      }
      headers.push({
        name,
        value,
      });
    };

    for (let [headerName, headerValue] of Object.entries(req.headers)) {
      if (!headerValue) {
        continue;
      }

      if (Array.isArray(headerValue)) {
        for (let value of headerValue) {
          addHeader(headerName, value);
        }
      } else {
        addHeader(headerName, headerValue);
      }
    }

    headers = headers.sort((a, b) => a.name.localeCompare(b.name));

    return headers;
  }

  private buildRequestHeadersSize(req: Request): number {
    // Building string to get actual byte size
    let rawHeaders = "";
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      rawHeaders += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    }
    return Buffer.byteLength(rawHeaders, "utf-8");
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
    return Buffer.byteLength(rawHeaders, "utf-8");
  }

  private buildResponseHeaders(res: Response, masking: Masking): Header[] {
    var headers: Header[] = [];

    const addHeader = (name: string, value: string) => {
      const headerMask = masking.responseHeaderMasks[name];
      if (headerMask) {
        value = headerMask;
      }
      headers.push({
        name,
        value,
      });
    };

    res.getHeaderNames().forEach((headerName) => {
      const value = res.getHeader(headerName);

      if (value == null) {
        return;
      }

      if (Array.isArray(value)) {
        for (const val of value) {
          addHeader(headerName, val);
        }
      } else {
        addHeader(headerName, value.toString());
      }
    });

    headers = headers.sort((a, b) => a.name.localeCompare(b.name));

    return headers;
  }

  private buildResponseContent(
    res: Response,
    reqResWriter: RequestResponseWriter,
    masking: Masking
  ): Content {
    const content: Content = {
      size: -1,
      mimeType:
        res.getHeader("content-type")?.toString() ?? "application/octet-stream",
    };
    const resBuf = reqResWriter.getResponseBody();

    if (resBuf !== null) {
      if (resBuf.length > 0) {
        let bodyStr = resBuf.toString("utf-8");
        try {
          bodyStr = maskBodyRegex(
            bodyStr,
            content.mimeType,
            masking.responseFieldMasksString,
            masking.responseFieldMasksNumber
          );
        } catch (e) {
          // TODO: log error
        }

        content.text = bodyStr;
        content.size = resBuf.length;
      }
    } else {
      content.text = droppedText;
      content.size = -1;
    }

    return content;
  }

  private buildQueryString(urlStr: string, masking: Masking): QueryString[] {
    const queryObj = url.parse(urlStr, true).query;
    const queryString: QueryString[] = [];

    const addQueryParam = (name: string, value: string) => {
      const queryMask = masking.queryStringMasks[name];
      if (queryMask) {
        value = queryMask;
      }
      queryString.push({
        name,
        value,
      });
    };

    Object.entries(queryObj).forEach(([name, value]) => {
      if (Array.isArray(value)) {
        for (const val of value) {
          addQueryParam(name, val);
        }
      } else {
        addQueryParam(name, value ?? "");
      }
    });
    return queryString;
  }
}
