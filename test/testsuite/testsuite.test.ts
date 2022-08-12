import express, { Express } from "express";
import { default as request, default as supertest } from "supertest";
import { setTimeNow, setTimeSince } from "../../src/time";

import { GRPCClient } from "../../src/transport";
import { SpeakeasySDK } from "../../src/speakeasy";
import fs from "fs";
import { setMaxCaptureSize } from "../../src/requestresponsewriter";

jest.mock("../../src/transport");

interface Fields {
  max_capture_size: number;
}

interface Args {
  method: string;
  url: string;
  headers: Record<string, string[]>;
  body: string;
  request_start_time: string;
  elapsed_time: number;
  response_status: number;
  response_body: string;
  response_headers: Record<string, string[]>;
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

    const app = createSimpleExpressApp(
      speakeasy,
      args.response_status,
      args.response_body,
      args.response_headers
    );

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

    for (const key in args.headers) {
      for (const value of args.headers[key]) {
        r = r.set(key, value);
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

function createSimpleExpressApp(
  speakeasy: SpeakeasySDK,
  status: number,
  resBody: string,
  resHeaders?: Record<string, string[]>
): Express {
  const app = express();
  app.use(speakeasy.expressMiddleware());
  app.all("*", (req, res) => {
    if (status > 0) {
      res.status(status);
    }

    if (resHeaders) {
      for (const key in resHeaders) {
        res.set(
          key,
          resHeaders[key].length == 1 ? resHeaders[key][0] : resHeaders[key]
        );
      }
    }

    if (resBody) {
      res.send(resBody);
    } else {
      res.end();
    }
  });
  return app;
}
