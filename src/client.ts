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
      throw new Error("Speakeasy Server URL is required");
    }

    this.serverUrl = serverUrl;
  }
}
