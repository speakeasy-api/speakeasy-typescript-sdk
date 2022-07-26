const DEFAULT_SPEAKEASY_SERVER_URL = "grpc.speakeasyapi.dev:443"

export type Config = {
  apiKey: string;
};

export class SpeakeasyClient {
  apiKey: string;
  serverUrl: string;

  public constructor(config: Config) {
    const { apiKey } = config;
    if (apiKey == null) {
      throw new Error("Speakeasy API key is required");
    }

    this.apiKey = config.apiKey;

    const serverUrl = process.env.SPEAKEASY_SERVER_URL;
    if (serverUrl == null) {
      this.serverUrl = DEFAULT_SPEAKEASY_SERVER_URL;
    } else {
      this.serverUrl = serverUrl;
    }
  }
}
