import { maskBodyRegex } from "../../src/bodymasking";

describe("Body Masking", () => {
  describe("succeeds", () => {
    interface args {
      body: string;
      mimeType: string;
      stringMasks: Record<string, string>;
      numberMasks: Record<string, string>;
    }

    interface test {
      name: string;
      args: args;
      wantBody: string;
    }
    const tests: test[] = [
      {
        name: "successfully masks body with single string field",
        args: {
          body: `{"test": "test"}`,
          mimeType: "application/json",
          stringMasks: {
            test: "testmask",
          },
          numberMasks: {},
        },
        wantBody: `{"test": "testmask"}`,
      },
      {
        name: "successfully masks body with single int field",
        args: {
          body: `{"test": 123}`,
          mimeType: "application/json",
          stringMasks: {},
          numberMasks: {
            test: "-123456789",
          },
        },
        wantBody: `{"test": -123456789}`,
      },
      {
        name: "successfully masks body with single negative field",
        args: {
          body: `{"test": -123}`,
          mimeType: "application/json",
          stringMasks: {},
          numberMasks: {
            test: "-123456789",
          },
        },
        wantBody: `{"test": -123456789}`,
      },
      {
        name: "successfully masks body with single float field",
        args: {
          body: `{"test": 123.123}`,
          mimeType: "application/json",
          stringMasks: {},
          numberMasks: {
            test: "-123456789",
          },
        },
        wantBody: `{"test": -123456789}`,
      },
      {
        name: "successfully masks body with nested fields",
        args: {
          body: `{"test": {"test": "test", "test1": 123}}`,
          mimeType: "application/json",
          stringMasks: {
            test: "testmask",
          },
          numberMasks: {
            test1: "-123456789",
          },
        },
        wantBody: `{"test": {"test": "testmask", "test1": -123456789}}`,
      },
      {
        name: "successfully masks formatted body",
        args: {
          body: `{
          "test": {
              "test": "test",
              "test1": 123
          }
      }`,
          mimeType: "application/json",
          stringMasks: {
            test: "testmask",
          },
          numberMasks: {
            test1: "-123456789",
          },
        },
        wantBody: `{
          "test": {
              "test": "testmask",
              "test1": -123456789
          }
      }`,
      },
      {
        name: "successfully masks body with complex string field",
        args: {
          body: `{"test": "\\",{abc}: .\\""}`,
          mimeType: "application/json",
          stringMasks: {
            test: "testmask",
          },
          numberMasks: {},
        },
        wantBody: `{"test": "testmask"}`,
      },
      {
        name: "successfully masks body with complex field key",
        args: {
          body: `{"test\\"hello\\": ": "\\",{abc}: .\\""}`,
          mimeType: "application/json",
          stringMasks: {
            'test\\"hello\\": ': "testmask",
          },
          numberMasks: {},
        },
        wantBody: `{"test\\"hello\\": ": "testmask"}`,
      },
    ];

    test.each(tests)("$name", ({ name, args, wantBody }) => {
      const body = maskBodyRegex(
        args.body,
        args.mimeType,
        args.stringMasks,
        args.numberMasks
      );
      expect(body).toEqual(wantBody);
    });
  });
});
