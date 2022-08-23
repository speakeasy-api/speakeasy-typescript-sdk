import {
  DefaultStringMask,
  Masking,
  MiddlewareController,
} from "../../src/controller";

describe("Masking Configuration", () => {
  describe("masking query string", () => {
    interface args {
      keys: string[];
      masks: string[];
    }

    interface test {
      name: string;
      args: args;
      wantQueryStringMasks: Record<string, string>;
    }
    const tests: test[] = [
      {
        name: "successfully adds single query string with default mask",
        args: {
          keys: ["test"],
          masks: [],
        },
        wantQueryStringMasks: {
          test: DefaultStringMask,
        },
      },
      {
        name: "successfully adds single query string with custom mask",
        args: {
          keys: ["test"],
          masks: ["testmask"],
        },
        wantQueryStringMasks: {
          test: "testmask",
        },
      },
      {
        name: "successfully adds multiple query string with default mask",
        args: {
          keys: ["test", "test2", "test3"],
          masks: [],
        },
        wantQueryStringMasks: {
          test: DefaultStringMask,
          test2: DefaultStringMask,
          test3: DefaultStringMask,
        },
      },
      {
        name: "successfully adds multiple query string with single custom mask",
        args: {
          keys: ["test", "test2", "test3"],
          masks: ["testmask"],
        },
        wantQueryStringMasks: {
          test: "testmask",
          test2: "testmask",
          test3: "testmask",
        },
      },
      {
        name: "successfully adds multiple query string with multiple matched custom masks",
        args: {
          keys: ["test", "test2", "test3"],
          masks: ["testmask", "test2mask", "test3mask"],
        },
        wantQueryStringMasks: {
          test: "testmask",
          test2: "test2mask",
          test3: "test3mask",
        },
      },
      {
        name: "successfully adds multiple query string with multiple unmatched custom masks",
        args: {
          keys: ["test", "test2", "test3"],
          masks: ["testmask", "test2mask"],
        },
        wantQueryStringMasks: {
          test: "testmask",
          test2: "test2mask",
          test3: DefaultStringMask,
        },
      },
    ];

    test.each(tests)("$name", ({ name, args, wantQueryStringMasks }) => {
      const controller = new MiddlewareController();
      controller.setMaskingOpts(
        Masking.withQueryStringMask(args.keys, ...args.masks)
      );
      expect(controller.getMasking().queryStringMasks).toEqual(
        wantQueryStringMasks
      );
    });
  });

  describe("masking request cookies", () => {
    interface args {
      keys: string[];
      masks: string[];
    }

    interface test {
      name: string;
      args: args;
      wantRequestCookieMasks: Record<string, string>;
    }
    const tests: test[] = [
      {
        name: "successfully adds single cookie with default mask",
        args: {
          keys: ["test"],
          masks: [],
        },
        wantRequestCookieMasks: {
          test: DefaultStringMask,
        },
      },
      {
        name: "successfully adds single cookie with custom mask",
        args: {
          keys: ["test"],
          masks: ["testmask"],
        },
        wantRequestCookieMasks: {
          test: "testmask",
        },
      },
      {
        name: "successfully adds multiple cookies with default mask",
        args: {
          keys: ["test", "test2", "test3"],
          masks: [],
        },
        wantRequestCookieMasks: {
          test: DefaultStringMask,
          test2: DefaultStringMask,
          test3: DefaultStringMask,
        },
      },
      {
        name: "successfully adds multiple cookies with single custom mask",
        args: {
          keys: ["test", "test2", "test3"],
          masks: ["testmask"],
        },
        wantRequestCookieMasks: {
          test: "testmask",
          test2: "testmask",
          test3: "testmask",
        },
      },
      {
        name: "successfully adds multiple cookies with multiple matched custom masks",
        args: {
          keys: ["test", "test2", "test3"],
          masks: ["testmask", "test2mask", "test3mask"],
        },
        wantRequestCookieMasks: {
          test: "testmask",
          test2: "test2mask",
          test3: "test3mask",
        },
      },
      {
        name: "successfully adds multiple cookies with multiple unmatched custom masks",
        args: {
          keys: ["test", "test2", "test3"],
          masks: ["testmask", "test2mask"],
        },
        wantRequestCookieMasks: {
          test: "testmask",
          test2: "test2mask",
          test3: DefaultStringMask,
        },
      },
    ];

    test.each(tests)("$name", ({ name, args, wantRequestCookieMasks }) => {
      const controller = new MiddlewareController();
      controller.setMaskingOpts(
        Masking.withRequestCookieMask(args.keys, ...args.masks)
      );
      expect(controller.getMasking().requestCookieMasks).toEqual(
        wantRequestCookieMasks
      );
    });
  });
});
