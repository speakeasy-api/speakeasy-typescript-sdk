import {
  Config,
  SpeakeasySDK,
  configure,
  expressMiddleware,
  nestJSMiddleware,
} from "./speakeasy";
import { Masking, MiddlewareController } from "./controller";

const speakeasy = {
  configure: configure,
  expressMiddleware: expressMiddleware,
  nestJSMiddleware: nestJSMiddleware,
};

declare global {
  namespace Express {
    interface Request {
      controller: MiddlewareController;
      __route: string;
    }
  }
}

export default speakeasy;
export { Config, SpeakeasySDK, MiddlewareController, Masking };
