import { SpeakeasySDK, sdkName, speakeasyVerion } from "../../src/speakeasy";
import express, { Express } from "express";
import { setTimeNow, setTimeSince } from "../../src/time";

import { GRPCClient } from "../../src/transport";
import { Har } from "har-format";
import request from "supertest";

jest.mock("../../src/transport");

const simpleSuccessHar: Har = {
  log: {
    version: "1.2",
    creator: {
      name: sdkName,
      version: speakeasyVerion,
    },
    comment: expect.stringMatching(
      `request capture for http://127\.0\.0\.1:.*?/`
    ),
    entries: [
      {
        startedDateTime: "2020-01-01T00:00:00.000Z",
        time: 1,
        request: {
          method: "GET",
          url: expect.stringMatching(`http://127\.0\.0\.1:.*?/`),
          httpVersion: "HTTP/1.1",
          cookies: [],
          headers: [
            {
              name: "host",
              value: expect.anything(),
            },
            {
              name: "accept-encoding",
              value: "gzip, deflate",
            },
            {
              name: "connection",
              value: "close",
            },
          ],
          queryString: [],
          headersSize: 76,
          bodySize: -1,
        },
        response: {
          status: 200,
          statusText: "OK",
          cookies: [],
          headers: [
            {
              name: "x-powered-by",
              value: "Express",
            },
            {
              name: "content-type",
              value: "text/html; charset=utf-8",
            },
            {
              name: "content-length",
              value: "12",
            },
            {
              name: "etag",
              value: 'W/"c-00hq6RNueFa8QiEjhep5cJRHWAI"',
            },
          ],
          content: {
            mimeType: "text/html; charset=utf-8",
            size: 12,
            text: "Hello world!",
          },
          redirectURL: "",
          httpVersion: "HTTP/1.1",
          headersSize: 126,
          bodySize: 12,
        },
        cache: {},
        timings: {
          send: -1,
          receive: -1,
          wait: -1,
        },
        serverIPAddress: expect.anything(),
        connection: "8080",
      },
    ],
  },
};

const simpleErrorHar: Har = {
  log: {
    version: "1.2",
    creator: {
      name: sdkName,
      version: speakeasyVerion,
    },
    comment: expect.stringMatching(
      `request capture for http://127\.0\.0\.1:.*?/`
    ),
    entries: [
      {
        startedDateTime: "2020-01-01T00:00:00.000Z",
        time: 1,
        request: {
          method: "GET",
          url: expect.stringMatching(`http://127\.0\.0\.1:.*?/`),
          httpVersion: "HTTP/1.1",
          cookies: [],
          headers: [
            {
              name: "host",
              value: expect.anything(),
            },
            {
              name: "accept-encoding",
              value: "gzip, deflate",
            },
            {
              name: "connection",
              value: "close",
            },
          ],
          queryString: [],
          headersSize: 76,
          bodySize: -1,
        },
        response: {
          status: 500,
          statusText: "Internal Server Error",
          cookies: [],
          headers: [
            {
              name: "x-powered-by",
              value: "Express",
            },
            {
              name: "content-security-policy",
              value: "default-src 'none'",
            },
            {
              name: "x-content-type-options",
              value: "nosniff",
            },
            {
              name: "content-type",
              value: "text/html; charset=utf-8",
            },
            {
              name: "content-length",
              value: expect.anything(),
            },
          ],
          content: {
            mimeType: "text/html; charset=utf-8",
            size: expect.any(Number),
            text: expect.anything(),
          },
          redirectURL: "",
          httpVersion: "HTTP/1.1",
          headersSize: 165,
          bodySize: expect.any(Number),
        },
        cache: {},
        timings: {
          send: -1,
          receive: -1,
          wait: -1,
        },
        serverIPAddress: expect.anything(),
        connection: "8080",
      },
    ],
  },
};

describe("Simple Express Server", () => {
  describe("with an initalized speakeasy instance", () => {
    it("creates a properly formatted HAR", () => {
      setTimeNow("2020-01-01T00:00:00.000Z");
      setTimeSince(1);

      const mockGRPCClient = new GRPCClient("", "", "", "", false);

      const speakeasy = new SpeakeasySDK(
        {
          apiKey: "test",
          apiID: "testApiID1",
          versionID: "v1.0.0",
          port: 8080,
        },
        mockGRPCClient
      );

      const app = createSimpleExpressApp(speakeasy);
      return request(app)
        .get("/")
        .expect(200, "Hello world!")
        .expect((_: any) => {
          expect(mockGRPCClient.send).toHaveBeenCalled();
          const harRes = (mockGRPCClient.send as jest.Mock).mock.calls[0][0];

          const har = JSON.parse(harRes);

          expect(har).toEqual(simpleSuccessHar);
        });
    });
    it("captures errors as well", () => {
      setTimeNow("2020-01-01T00:00:00.000Z");
      setTimeSince(1);

      const mockGRPCClient = new GRPCClient("", "", "", "", false);

      const speakeasy = new SpeakeasySDK(
        {
          apiKey: "test",
          apiID: "testApiID1",
          versionID: "v1.0.0",
          port: 8080,
        },
        mockGRPCClient
      );

      const app = createSimpleExpressApp(speakeasy);
      return request(app)
        .get("/error")
        .expect(500)
        .expect((_: any) => {
          expect(mockGRPCClient.send).toHaveBeenCalled();
          const harRes = (mockGRPCClient.send as jest.Mock).mock.calls[0][0];

          const har = JSON.parse(harRes);

          expect(har).toEqual(simpleErrorHar);
        });
    });

    it("gets a basic path hint", () => {
      setTimeNow("2020-01-01T00:00:00.000Z");
      setTimeSince(1);

      const mockGRPCClient = new GRPCClient("", "", "", "", false);

      const speakeasy = new SpeakeasySDK(
        {
          apiKey: "test",
          apiID: "testApiID1",
          versionID: "v1.0.0",
          port: 8080,
        },
        mockGRPCClient
      );

      const app = createSimpleExpressApp(speakeasy);
      return request(app)
        .get("/")
        .expect(200, "Hello world!")
        .expect((_: any) => {
          expect(mockGRPCClient.send).toHaveBeenCalled();
          const pathHint = (mockGRPCClient.send as jest.Mock).mock.calls[0][1];
          expect(pathHint).toEqual("/");
        });
    });

    it("gets a short normalized path hint", () => {
      setTimeNow("2020-01-01T00:00:00.000Z");
      setTimeSince(1);

      const mockGRPCClient = new GRPCClient("", "", "", "", false);

      const speakeasy = new SpeakeasySDK(
        {
          apiKey: "test",
          apiID: "testApiID1",
          versionID: "v1.0.0",
          port: 8080,
        },
        mockGRPCClient
      );

      const app = createSimpleExpressApp(speakeasy);
      return request(app)
        .get("/v1/user/1")
        .expect(200, "Hello world!")
        .expect((_: any) => {
          expect(mockGRPCClient.send).toHaveBeenCalled();
          const pathHint = (mockGRPCClient.send as jest.Mock).mock.calls[0][1];
          expect(pathHint).toEqual("/v1/user/{id}");
        });
    });

    it("gets a long normalized path hint", () => {
      setTimeNow("2020-01-01T00:00:00.000Z");
      setTimeSince(1);

      const mockGRPCClient = new GRPCClient("", "", "", "", false);

      const speakeasy = new SpeakeasySDK(
        {
          apiKey: "test",
          apiID: "testApiID1",
          versionID: "v1.0.0",
          port: 8080,
        },
        mockGRPCClient
      );

      const app = createSimpleExpressApp(speakeasy);
      return request(app)
        .get("/v1/user/1/action/send/message/hello")
        .expect(200, "Hello world!")
        .expect((_: any) => {
          expect(mockGRPCClient.send).toHaveBeenCalled();
          const pathHint = (mockGRPCClient.send as jest.Mock).mock.calls[0][1];
          expect(pathHint).toEqual(
            "/v1/user/{id}/action/{action}/message/{message}"
          );
        });
    });

    it("gets a customer provided path hint", () => {
      setTimeNow("2020-01-01T00:00:00.000Z");
      setTimeSince(1);

      const mockGRPCClient = new GRPCClient("", "", "", "", false);

      const speakeasy = new SpeakeasySDK(
        {
          apiKey: "test",
          apiID: "testApiID1",
          versionID: "v1.0.0",
          port: 8080,
        },
        mockGRPCClient
      );

      const app = createSimpleExpressApp(speakeasy);
      return request(app)
        .get("/user/1")
        .expect(200, "Hello world!")
        .expect((_: any) => {
          expect(mockGRPCClient.send).toHaveBeenCalled();
          const pathHint = (mockGRPCClient.send as jest.Mock).mock.calls[0][1];
          expect(pathHint).toEqual("/user/{id}");
        });
    });
  });
});

function createSimpleExpressApp(sdk: SpeakeasySDK): Express {
  const app = express();
  app.use(sdk.expressMiddleware());
  app.all("/v1/user/:id", (req, res) => {
    res.status(200).send("Hello world!");
  });
  app.all("/v1/user/:id/action/:action/message/:message", (req, res) => {
    res.status(200).send("Hello world!");
  });
  app.all("/user/*", (req, res) => {
    req.controller.setPathHint("/user/{id}");
    res.status(200).send("Hello world!");
  });
  app.all("/error", (req, res) => {
    throw new Error("test fail");
  });
  app.all("/", (req, res) => {
    res.status(200).send("Hello world!");
  });
  return app;
}
