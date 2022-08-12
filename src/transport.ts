import * as grpc from "@grpc/grpc-js";

import { IngestRequest } from "@speakeasy-api/speakeasy-schemas/registry/ingest/ingest_pb";
import { IngestServiceClient } from "@speakeasy-api/speakeasy-schemas/registry/ingest/ingest_grpc_pb";

export class GRPCClient {
  private client: IngestServiceClient;
  private apiKey: string;
  private apiID: string;
  private versionID: string;

  public constructor(
    address: string,
    apiKey: string,
    apiID: string,
    versionID: string,
    secure: boolean
  ) {
    var credentials = grpc.credentials.createSsl();
    if (!secure) {
      credentials = grpc.credentials.createInsecure();
    }

    this.client = new IngestServiceClient(address, credentials);

    this.apiKey = apiKey;
    this.apiID = apiID;
    this.versionID = versionID;
  }

  public send(har: string, pathHint: string, customerID: string) {
    const metadata = new grpc.Metadata();
    metadata.set("x-api-key", this.apiKey);

    const request = new IngestRequest();
    request.setApiId(this.apiID);
    request.setVersionId(this.versionID);
    request.setHar(har);
    request.setPathHint(pathHint);
    request.setCustomerId(customerID);

    this.client.ingest(request, metadata, (err, response) => {
      if (err) {
        console.error(err); // TODO log error?
      }
    });
  }
}
