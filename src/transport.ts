import * as grpc from "@grpc/grpc-js";

import {
  CallOptions,
  Client,
  ClientUnaryCall,
  Metadata,
  ServiceError,
} from "@grpc/grpc-js";

import { EmbedAccessTokenRequest } from "@speakeasy-api/speakeasy-schemas/registry/embedaccesstoken/embedaccesstoken_pb";
import { EmbedAccessTokenServiceClient } from "@speakeasy-api/speakeasy-schemas/registry/embedaccesstoken/embedaccesstoken_grpc_pb";
import { IngestRequest } from "@speakeasy-api/speakeasy-schemas/registry/ingest/ingest_pb";
import { IngestServiceClient } from "@speakeasy-api/speakeasy-schemas/registry/ingest/ingest_grpc_pb";
import { Message } from "google-protobuf";

export class GRPCClient {
  private ingestClient: Promisified<IngestServiceClient>;
  private embedClient: Promisified<EmbedAccessTokenServiceClient>;
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

    this.ingestClient = promisify(
      new IngestServiceClient(address, credentials)
    );
    this.embedClient = promisify(
      new EmbedAccessTokenServiceClient(address, credentials)
    );

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

    this.ingestClient.ingest(request, metadata).catch((err) => {
      if (err) {
        console.error(err); // TODO log error with a provided logger?
      }
    });
  }

  public async getEmbedAccessToken(
    req: EmbedAccessTokenRequest
  ): Promise<string> {
    const metadata = new grpc.Metadata();
    metadata.set("x-api-key", this.apiKey);

    const res = await this.embedClient.get(req, metadata);
    return res.getAccesstoken();
  }
}

type OriginalCall<T, U> = (
  request: T,
  metadata: Metadata,
  options: Partial<CallOptions>,
  callback: (error: ServiceError, res: U) => void
) => ClientUnaryCall;

type PromisifiedCall<T, U> = (
  request: T,
  metadata?: Metadata,
  options?: Partial<CallOptions>
) => Promise<U>;

export type Promisified<C> = { $: C } & {
  [prop in Exclude<keyof C, keyof Client>]: C[prop] extends OriginalCall<
    infer T,
    infer U
  >
    ? PromisifiedCall<T, U>
    : never;
};

export function promisify<C extends Client>(client: C): Promisified<C> {
  return new Proxy(client, {
    get: (target, descriptor) => {
      let stack = "";

      // this step is required to get the correct stack trace
      // of course, this has some performance impact, but it's not that big in comparison with grpc calls
      try {
        throw new Error();
      } catch (e) {
        stack = e.stack;
      }

      if (descriptor === "$") {
        return target;
      }

      return (...args: any[]) =>
        new Promise((resolve, reject) =>
          target[descriptor](
            ...[
              ...args,
              (err: ServiceError, res: Message) => {
                if (err) {
                  err.stack += stack;
                  reject(err);
                } else {
                  resolve(res);
                }
              },
            ]
          )
        );
    },
  }) as unknown as Promisified<C>;
}
