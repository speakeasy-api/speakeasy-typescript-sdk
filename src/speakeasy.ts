import { GRPCClient } from "./transport";
import { RequestHandler } from "express";
import { expressMiddleware as eMiddleware } from "./middleware/express/middleware";
import { nestJSMiddleware as nMiddleware } from "./middleware/nestjs/middleware";

export const speakeasyVerion = "1.1.0";
export const sdkName = "speakeasy-typescript-sdk";

let speakeasyInstance: SpeakeasySDK | null = null;

const DEFAULT_SPEAKEASY_SERVER_URL = "grpc.prod.speakeasyapi.dev:443";

export type Config = {
  apiKey: string;
  apiID: string;
  versionID: string;
  port: number;
};

export class SpeakeasySDK {
  public port: number;
  grpcClient: GRPCClient;

  public constructor(config: Config, grpcClient?: GRPCClient) {
    validateConfig(config);

    this.port = config.port;

    var serverUrl = DEFAULT_SPEAKEASY_SERVER_URL;
    if (process.env.SPEAKEASY_SERVER_URL) {
      serverUrl = process.env.SPEAKEASY_SERVER_URL;
    }

    var secure = true;
    if (process.env.SPEAKEASY_SERVER_SECURE === "false") {
      secure = false;
    }

    this.grpcClient =
      grpcClient ||
      new GRPCClient(
        serverUrl,
        config.apiKey,
        config.apiID,
        config.versionID,
        secure
      );
  }

  public expressMiddleware(): RequestHandler {
    return eMiddleware(this);
  }

  public nestJSMiddleware(): RequestHandler {
    return nMiddleware(this);
  }

  public send(har: string, pathHint: string, customerID: string) {
    this.grpcClient.send(har, pathHint, customerID);
  }
}

export function configure(config: Config): void {
  speakeasyInstance = new SpeakeasySDK(config);
}

export function expressMiddleware(): RequestHandler {
  if (!speakeasyInstance) {
    throw new Error("speakeasy is not configured");
  }

  return speakeasyInstance.expressMiddleware();
}

export function nestJSMiddleware(): RequestHandler {
  if (!speakeasyInstance) {
    throw new Error("speakeasy is not configured");
  }

  return speakeasyInstance.nestJSMiddleware();
}

const maxIDSize = 128;
const validCharsRegexStr = "[^a-zA-Z0-9.\\-_~]";

function validateConfig(cfg: Config) {
  if (!cfg.apiKey) {
    throw new Error("Speakeasy API key is required");
  }

  if (!cfg.apiID) {
    throw new Error("apiID is required");
  }

  if (cfg.apiID.length > maxIDSize) {
    throw new Error(`apiID is too long. Max length is ${maxIDSize}`);
  }

  if (cfg.apiID.match(new RegExp(validCharsRegexStr))) {
    throw new Error(`apiID contains invalid characters ${validCharsRegexStr}`);
  }

  if (!cfg.versionID) {
    throw new Error("versionID is required");
  }

  if (cfg.versionID.length > maxIDSize) {
    throw new Error(`versionID is too long. Max length is ${maxIDSize}`);
  }

  if (cfg.versionID.match(new RegExp(validCharsRegexStr))) {
    throw new Error(
      `versionID contains invalid characters ${validCharsRegexStr}`
    );
  }
}
