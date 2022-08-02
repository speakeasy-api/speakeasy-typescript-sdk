import url from "url";
import http from "http";

import cookie from "cookie";
import setCookie from "set-cookie-parser";
import {
  Har as HarType,
  Cookie,
  Entry,
  Request as HarRequest,
  Response as HarResponse,
  Header,
  QueryString,
  PostData,
  Content,
} from "har-format";

// Cannot get TS to point to node's types, it's defaulting to types from the fetchApi
type Request = any;
type Response = any;

export type AdditionalData = {
  reqBodyString?: string;
  reqBodyStringComment?: string;
  responseText?: string;
  responseSize?: number;
};

export class Har {
  har: HarType;

  public constructor() {
    this.har = {
      log: {
        version: "1.2",
        creator: {
          name: "Speakeasy Typescript SDK",
          version: "0.0.1", //TODO(kevinc): Use actual version
        },
        browser: {
          name: "",
          version: "",
        },
        pages: [],
        entries: [],
        comment: "",
      },
    };
  }

  public populate(req: Request, res: Response, additionalData: AdditionalData) {
    this.har.log.entries.push(this.buildEntry(req, res, additionalData));
  }

  public static buildHar(
    req: Request,
    res: Response,
    additionalData: AdditionalData = {}
  ): Har {
    const har = new Har();
    har.populate(req, res, additionalData);
    return har;
  }

  public toString(): string {
    return JSON.stringify(this.har);
  }

  private buildEntry(
    req: Request,
    res: Response,
    additionalData: AdditionalData
  ): Entry {
    return {
      pageref: "page_0",
      startedDateTime: new Date().toISOString(), //TODO(kevinc): Get the actual start date time from the header
      time: 0, //TODO(kevinc): Compute the actual elapsed time
      request: this.buildRequest(req, additionalData),
      response: this.buildResponse(res, additionalData),
      cache: {},
      timings: {
        send: 0,
        receive: 0,
        wait: 0,
      },
    };
  }

  private buildRequest(
    req: Request,
    additionalData: AdditionalData
  ): HarRequest {
    const result: HarRequest = {
      method: req.method,
      url: req.url,
      httpVersion: req.httpVersion,
      cookies: this.buildRequestCookie(req),
      headers: this.buildRequestHeaders(req.headers),
      queryString: this.buildQueryString(req.url),
      headersSize: this.buildRequestHeadersSize(req),
      bodySize: -1,
    };
    const postData = this.buildRequestPostData(req, additionalData);
    if (postData != null) {
      result.postData = postData;
      result.bodySize = postData.text?.length ?? -1;
    }

    return result;
  }

  private buildResponse(
    res: Response,
    additionalData: AdditionalData
  ): HarResponse {
    const content = this.buildResponseContent(res, additionalData);
    const result: HarResponse = {
      status: res.statusCode,
      statusText: res.statusMessage,
      httpVersion: "", // TODO(kevinc): Response HTTP version
      cookies: this.buildResponseCookie(res),
      headers: this.buildResponseHeaders(res.getHeaders()),
      content: content,
      redirectURL: res.getHeader("location") ?? "",
      headersSize: this.buildResponseHeadersSize(res.req, res),
      bodySize: content.size,
    };

    return result;
  }

  private buildRequestCookie(req: Request): Cookie[] {
    const cookies = req.header("cookie");
    const entries: Cookie[] = [];
    if (cookies == null) {
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

  private buildRequestPostData(
    req: Request,
    additionalData: AdditionalData
  ): PostData | undefined {
    if (additionalData.reqBodyString == undefined) {
      return undefined;
    }
    return {
      // We don't parse the body params
      mimeType: req.getHeader("content-type"),
      text: additionalData.reqBodyString,
    };
  }

  private buildResponseCookie(res: Response): Cookie[] {
    return setCookie.parse(res).map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      path: cookie.path,
      domain: cookie.domain,
      expires:
        cookie.expires == null ? undefined : cookie.expires.toUTCString(),
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
    }));
  }

  private buildRequestHeaders(headers: Object): Header[] {
    return Object.entries(headers).map(([name, value]) => ({
      name,
      value,
    }));
  }

  private buildRequestHeadersSize(req: Request): number {
    // Building string to get actual byte size
    let rawHeaders = "";
    rawHeaders += `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      rawHeaders += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    }
    rawHeaders += "\r\n";
    return Buffer.byteLength(rawHeaders, "utf8");
  }

  private buildResponseHeadersSize(req: Request, res: Response): number {
    // Building string to get actual byte size
    let rawHeaders = "";
    rawHeaders += `HTTP/${req.httpVersion} ${res.statusCode} ${res.statusMessage}\r\n`;
    Object.entries(res.getHeaders()).forEach(([header, value]) => {
      rawHeaders += `${header}: ${value}`;
    });
    rawHeaders += "\r\n";
    return Buffer.byteLength(rawHeaders, "utf8");
  }

  private buildResponseHeaders(headers: Object): Header[] {
    const responseHeaders: Header[] = [];
    Object.entries(headers).forEach(([name, value]) => {
      if (Array.isArray(value)) {
        responseHeaders.concat(
          value.map((val) => ({
            name: name,
            value: val,
          }))
        );
      } else {
        responseHeaders.push({
          name,
          value,
        });
      }
    });
    return responseHeaders;
  }

  private buildResponseContent(
    res: Response,
    additionalData: AdditionalData
  ): Content {
    const content: Content = {
      size: -1,
      mimeType: res.getHeaders()["content-type"] ?? "",
    };
    if (additionalData.responseText != null) {
      content.text = additionalData.responseText;
    }
    if (additionalData.responseSize != null) {
      content.size = additionalData.responseSize;
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
