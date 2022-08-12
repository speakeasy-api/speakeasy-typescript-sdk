import type { RequestHandler } from "express";
import { SpeakeasySDK } from "../../speakeasy";
import { expressCompatibleMiddleware } from "../common/middleware";

export function expressMiddleware(speakeasy: SpeakeasySDK): RequestHandler {
  return expressCompatibleMiddleware(speakeasy);
}
