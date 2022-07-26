import { Config, SpeakeasyClient } from "./client";
import { outputError } from "./error";

let speakeasyInstance: SpeakeasyClient | null = null;

export function init(config: Config): SpeakeasyClient {
  if (speakeasyInstance != null) {
    outputError(
      "Speakeasy has already been initialized, skipping initialization"
    );
    return speakeasyInstance;
  }

  speakeasyInstance = new SpeakeasyClient(config);
  return speakeasyInstance;
}

export function getInstance(): SpeakeasyClient | null {
  return speakeasyInstance;
}
