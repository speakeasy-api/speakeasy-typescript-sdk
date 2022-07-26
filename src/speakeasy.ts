import { Config, SpeakeasyClient } from "./client";
import { outputError } from "./error";

let speakeasyInstance: SpeakeasyClient | null = null;

export function init(config: Config): SpeakeasyClient | null {
  if (speakeasyInstance != null) {
    outputError(
      "Speakeasy has already been initialized, skipping initialization"
    );
    return speakeasyInstance;
  }

  try {
    speakeasyInstance = new SpeakeasyClient(config);
  } catch (err: any) {
    outputError(err.message);
    return null;
  }
  return speakeasyInstance;
}

export function getInstance(): SpeakeasyClient | null {
  return speakeasyInstance;
}
