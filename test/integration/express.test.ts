import request from "supertest";
import { createSimpleExpressApp } from "../fixtures/express_app";
import { sendApiCall } from "../../src/transport";
import { init, uninit } from "../../src/speakeasy";

var mockedSendApiCall = jest.fn();

jest.mock("../../src/transport", () => ({
  ...jest.requireActual("../../src/transport"),
  sendApiCall: jest.fn(),
}));

const simpleHar = {
  log: {
    version: "1.2",
    creator: {
      name: "Speakeasy Typescript SDK",
      version: "0.0.1",
    },
    browser: {
      name: "",
      version: "",
    },
    pages: [],
    entries: [
      {
        pageref: "page_0",
        startedDateTime: expect.anything(),
        time: 0,
        request: {
          method: "GET",
          url: "/",
          httpVersion: "1.1",
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
          headersSize: -1,
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
          content: null,
          redirectURL: "",
          httpVersion: "",
          headersSize: -1,
          bodySize: -1,
        },
        cache: {},
        timings: {
          send: 0,
          receive: 0,
          wait: 0,
        },
      },
    ],
    comment: "",
  },
};

describe("Simple Express Server", () => {
  describe("with an initalized speakeasy instance", () => {
    beforeEach(() => {
      init({ apiKey: "" });
    });

    afterEach(() => {
      uninit();
    });

    it("creates a properly formatted HAR", () => {
      const app = createSimpleExpressApp();
      return request(app)
        .get("/")
        .expect(200)
        .expect((_: any) => {
          expect(sendApiCall).toHaveBeenCalled();
          const har = (sendApiCall as jest.Mock).mock.calls[0][0];
          expect(har.har).toEqual(simpleHar);
        });
    });
  });
});
