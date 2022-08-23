import express, { Express } from "express";
import { default as request, default as supertest } from "supertest";
import { setTimeNow, setTimeSince } from "../../src/time";

import { GRPCClient } from "../../src/transport";
import { Masking } from "../../src/controller";
import { SpeakeasySDK } from "../../src/speakeasy";
import fs from "fs";
import { setMaxCaptureSize } from "../../src/requestresponsewriter";

jest.mock("../../src/transport");

interface Header {
  key: string;
  values: string[];
}

interface Fields {
  max_capture_size: number;
}

interface Args {
  method: string;
  url: string;
  headers: Header[];
  body: string;
  request_start_time: string;
  elapsed_time: number;
  response_status: number;
  response_body: string;
  response_headers: Header[];
  query_string_masks: Record<string, string>;
  request_header_masks: Record<string, string>;
  request_cookie_masks: Record<string, string>;
  request_field_masks_string: Record<string, string>;
  request_field_masks_number: Record<string, string>;
  response_header_masks: Record<string, string>;
  response_cookie_masks: Record<string, string>;
  response_field_masks_string: Record<string, string>;
  response_field_masks_number: Record<string, string>;
}

interface Test {
  name: string;
  fields: Fields;
  args: Args;
  want_har: string;
}

const tests: Test[] = [];

fs.readdirSync(__dirname + "/testdata").forEach((file) => {
  if (file.endsWith("_input.json")) {
    const data = fs
      .readFileSync(__dirname + "/testdata/" + file)
      .toString("utf8");

    const test: Test = JSON.parse(data);

    const harData = fs
      .readFileSync(
        __dirname + "/testdata/" + file.replace("_input.json", "_output.json")
      )
      .toString("utf8");

    test.want_har = harData;

    tests.push(test);
  }
});

describe("Test Suite", () => {
  test.each(tests)("$name", ({ name, fields, args, want_har }) => {
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

    const app = createSimpleExpressApp(speakeasy, args);

    setMaxCaptureSize(fields.max_capture_size);

    setTimeNow(args.request_start_time ?? "2020-01-01T00:00:00.000Z");
    setTimeSince(args.elapsed_time ?? 1);

    const rt = supertest(app);

    var r: request.Test;

    switch (args.method) {
      case "GET":
        r = rt.get(args.url);
        break;
      case "POST":
        r = rt.post(args.url);
        break;
      case "PUT":
        r = rt.put(args.url);
        break;
      case "DELETE":
        r = rt.delete(args.url);
        break;
      case "PATCH":
        r = rt.patch(args.url);
        break;
      default:
        throw new Error("Unsupported method: " + args.method);
    }

    for (const header of args.headers) {
      for (const value of header.values) {
        r = r.set(header.key, value);
      }
    }

    if (args.body) {
      r = r.send(args.body);
    }

    return r
      .expect(
        args.response_status > 0 ? args.response_status : 200,
        args.response_status == 304 ? "" : args.response_body || ""
      )
      .expect((_: any) => {
        expect(mockGRPCClient.send).toHaveBeenCalled();
        const harRes = (mockGRPCClient.send as jest.Mock).mock.calls[0][0];

        const har = JSON.parse(harRes);
        const wantHar = JSON.parse(want_har);

        wantHar.log.comment = expect.stringMatching(wantHar.log.comment);
        wantHar.log.entries[0].request.url = expect.stringMatching(
          wantHar.log.entries[0].request.url
        );
        wantHar.log.entries[0].serverIPAddress = expect.anything();
        wantHar.log.entries[0].request.headers[0].value = expect.anything();

        expect(har).toMatchObject(wantHar);
      });
  });
});

function createSimpleExpressApp(speakeasy: SpeakeasySDK, args: Args): Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("etag", false);
  app.use(speakeasy.expressMiddleware());
  app.all("*", (req, res) => {
    try {
      const ctrl = req.controller;

      if (args.query_string_masks) {
        for (const key in args.query_string_masks) {
          ctrl.setMaskingOpts(
            Masking.withQueryStringMask([key], args.query_string_masks[key])
          );
        }
      }

      if (args.request_header_masks) {
        for (const key in args.request_header_masks) {
          ctrl.setMaskingOpts(
            Masking.withRequestHeaderMask([key], args.request_header_masks[key])
          );
        }
      }

      if (args.request_cookie_masks) {
        for (const key in args.request_cookie_masks) {
          ctrl.setMaskingOpts(
            Masking.withRequestCookieMask([key], args.request_cookie_masks[key])
          );
        }
      }

      if (args.request_field_masks_string) {
        for (const key in args.request_field_masks_string) {
          ctrl.setMaskingOpts(
            Masking.withRequestFieldMaskString(
              [key],
              args.request_field_masks_string[key]
            )
          );
        }
      }

      if (args.request_field_masks_number) {
        for (const key in args.request_field_masks_number) {
          ctrl.setMaskingOpts(
            Masking.withRequestFieldMaskNumber(
              [key],
              args.request_field_masks_number[key]
            )
          );
        }
      }

      if (args.response_header_masks) {
        for (const key in args.response_header_masks) {
          ctrl.setMaskingOpts(
            Masking.withResponseHeaderMask(
              [key],
              args.response_header_masks[key]
            )
          );
        }
      }

      if (args.response_cookie_masks) {
        for (const key in args.response_cookie_masks) {
          ctrl.setMaskingOpts(
            Masking.withResponseCookieMask(
              [key],
              args.response_cookie_masks[key]
            )
          );
        }
      }

      if (args.response_field_masks_string) {
        for (const key in args.response_field_masks_string) {
          ctrl.setMaskingOpts(
            Masking.withResponseFieldMaskString(
              [key],
              args.response_field_masks_string[key]
            )
          );
        }
      }

      if (args.response_field_masks_number) {
        for (const key in args.response_field_masks_number) {
          ctrl.setMaskingOpts(
            Masking.withResponseFieldMaskNumber(
              [key],
              args.response_field_masks_number[key]
            )
          );
        }
      }

      if (args.response_status > 0) {
        res.status(args.response_status);
      }

      if (args.response_headers) {
        for (const header of args.response_headers) {
          res.set(
            header.key,
            header.values.length == 1 ? header.values[0] : header.values
          );
        }
      }

      if (args.response_body) {
        res.send(args.response_body);
      } else {
        res.end();
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  });
  return app;
}
