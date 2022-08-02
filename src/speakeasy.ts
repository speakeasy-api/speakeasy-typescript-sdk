import { Config, SpeakeasySDK } from "./client";
import { outputError } from "./error";

let speakeasyInstance: SpeakeasySDK | null = null;

export function init(config: Config): SpeakeasySDK | null {
  if (speakeasyInstance != null) {
    outputError(
      "Speakeasy has already been initialized, skipping initialization"
    );
    return speakeasyInstance;
  }

  try {
    speakeasyInstance = new SpeakeasySDK(config);
  } catch (err: any) {
    outputError(err.message);
    return null;
  }
  return speakeasyInstance;
}

export function uninit() {
  speakeasyInstance = null;
}

export function getInstance(): SpeakeasySDK | null {
  return speakeasyInstance;
}
