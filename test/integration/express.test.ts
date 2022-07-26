import request from "supertest";
import { createSimpleExpressApp } from "../fixtures/express_app";
import { sendApiCall } from "../../src/transport";
import { init } from "../../src/speakeasy";

jest.mock("../../src/transport", () => ({
  ...jest.requireActual("../../src/transport"),
  sendApiCall: jest.fn(),
}));

describe("Simple Express Server", () => {
  describe("with an initalized speakeasy instance", () => {
    it("properly calls transport once", () => {
      init({ apiKey: "" });
      const app = createSimpleExpressApp();
      return request(app)
        .get("/")
        .expect(200)
        .expect((_: any) => {
          expect(sendApiCall).toHaveBeenCalled();
        });
    });
  });
});
