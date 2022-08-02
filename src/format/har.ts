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
} from "har-format";

// Cannot get TS to point to node's types, it's defaulting to types from the fetchApi
type Request = any;
type Response = any;

export type AdditionalData = {
  bodyString?: string;
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
      response: this.buildResponse(res),
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
      headersSize: -1, //TODO(kevinc): Header Size
      bodySize: -1, //TODO(kevinc): Body Size
    };
    const postData = this.buildRequestPostData(req, additionalData);
    if (postData != null) {
      result.postData = postData;
    }

    return result;
  }

  private buildResponse(res: Response): HarResponse {
    return {
      status: res.statusCode,
      statusText: res.statusMessage,
      httpVersion: "", // TODO(kevinc): Response HTTP version
      cookies: this.buildResponseCookie(res),
      headers: this.buildResponseHeaders(res.getHeaders()),
      content: null as any, //TODO(kevinc): Build content
      redirectURL: res.getHeader("location") ?? "",
      headersSize: -1, //TODO(kevinc): Header Size
      bodySize: -1, //TODO(kevinc): Body Size
    };
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
    if (additionalData.bodyString == undefined) {
      return undefined;
    }
    return {
      // TODO(kevinc): Parse params separately from other posted data
      // Currently assumes all posted types are not params
      mimeType: req.getHeader("content-type"),
      text: additionalData.bodyString,
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
