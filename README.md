# speakeasy-typescript-sdk

![180100416-b66263e6-1607-4465-b45d-0e298a67c397](https://user-images.githubusercontent.com/68016351/181640742-31ab234a-3b39-432e-b899-21037596b360.png)

Speakeasy is your API Platform team as a service. Use our drop in SDK to manage all your API Operations including customer facing embeds for request logs, usage metrics, understanding API drift and more.

The Speakeasy Typescript SDK for evaluating API requests/responses.

## Requirements

Supported frameworks: 

* Express
* NestJs

## Usage

The Speakeasy Typescript SDK is hosted on NPM and can be installed with the following command:

```bash
npm install @speakeasy-api/speakeasy-typescript-sdk
```

### Minimum configuration

[Sign up for free on our platform](https://www.speakeasyapi.dev/). After you've created a workspace and generated an API key enable Speakeasy in your API as follows:

#### Express  

Configure Speakeasy in your middleware chain as follows:

```typescript
import speakeasy, { Config } from "@speakeasy-api/speakeasy-typescript-sdk";
import express from "express";

const app = express();

// Configure the global speakeasy SDK instance
const cfg: Config = {
  apiKey: "YOUR API KEY HERE",			// retrieve from Speakeasy API dashboard.
  apiID: "YOUR API ID HERE", 			// custom Api ID to associate captured requests with.
  versionID: "YOUR VERSION ID HERE",	// custom Version ID to associate captured requests 
  port: 3000,							// The port number your express app is listening on (required to build full URLs on non-standard ports)
};
speakeasy.configure(cfg);

// Add the speakeasy middleware to your express app
app.use(speakeasy.expressMiddleware());

// Rest of your express app setup code
```

#### NestJS  

Configure Speakeasy in your NestJS app as follows:

```typescript
import speakeasy, { Config } from '@speakeasy-api/speakeasy-typescript-sdk';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Configure the global speakeasy SDK instance
	const cfg: Config = {
		apiKey: "YOUR API KEY HERE",			// retrieve from Speakeasy API dashboard.
		apiID: "YOUR API ID HERE", 			// custom Api ID to associate captured requests with.
		versionID: "YOUR VERSION ID HERE",	// custom Version ID to associate captured requests 
		port: 3000,							// The port number your express app is listening on (required to build full URLs on non-standard ports)
	};
	speakeasy.configure(cfg);

	// Configure the NestJS middleware for the routes of you Controller
    consumer.apply(speakeasy.nestJSMiddleware()).forRoutes(AppController);
  }
}
```

Build and deploy your app and that's it. Your API is being tracked in the Speakeasy workspace you just created
and will be visible on the dashboard next time you log in. Visit our [docs site](https://docs.speakeasyapi.dev/) to
learn more.


### Advanced configuration

The Speakeasy SDK provides both a global and per Api configuration option. If you want to use the SDK to track multiple Apis or Versions from the same service you can configure individual instances of the SDK.

#### Express  

```typescript
import { Config, SpeakeasySDK } from "@speakeasy-api/speakeasy-typescript-sdk";
import express from "express";

const app = express();

// Configure a new instance of the SDK for the store API
const storeSDK = new SpeakeasySDK({
  apiKey: "YOUR API KEY HERE",			// retrieved from Speakeasy API dashboard.
  apiID: "store_api", 			        // this is an ID you provide that you would like to associate captured requests with.
  versionID: "1.0.0",               // this is a Version you provide that you would like to associate captured requests with.
  port: 3000,							          // The port number your express app is listening on (required to build full URLs on non-standard ports)
});

// Configure a new instance of the SDK for the product AP
const productSDK = new SpeakeasySDK({
  apiKey: "YOUR API KEY HERE",			// retrieved from Speakeasy API dashboard.
  apiID: "product_api", 			      // this is an ID you provide that you would like to associate captured requests with.
  versionID: "1.0.0",               // this is a Version you provide that you would like to associate captured requests with.
  port: 3000,							          // The port number your express app is listening on (required to build full URLs on non-standard ports)
});

// The different instances of the SDK (with differnt IDs or even versions assigned) can be used to associate requests with different APIs and Versions.
const storeRouter = app.route("/store");
storeRouter.use(storeSDK.expressMiddleware());

const productsRouter = app.route("/products");
productsRouter.use(productSDK.expressMiddleware());

// Rest of your express app setup code
```

##### NestJS  

```typescript
import { Config, SpeakeasySDK } from '@speakeasy-api/speakeasy-typescript-sdk';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Configure a speakeasy SDK instance
	const cfg: Config = {
		apiKey: "YOUR API KEY HERE",			// retrieve from Speakeasy API dashboard.
		apiID: "YOUR API ID HERE", 			// custom Api ID to associate captured requests with.
		versionID: "YOUR VERSION ID HERE",	// custom Version ID to associate captured requests 
		port: 3000,							// The port number your express app is listening on (required to build full URLs on non-standard ports)
	};
	const sdk = new SpeakeasySDK(cfg);

	// Configure the NestJS middleware for the routes of you Controller
    consumer.apply(sdk.nestJSMiddleware()).forRoutes(AppController);
  }
}
```

This allows multiple instances of the SDK to be associated with different routers or routes within your service.

### On-Premise Configuration

The SDK provides a way to redirect the requests it captures to an on-premise deployment of the Speakeasy Platform. This is done through the use of environment variables listed below. These are to be set in the environment of your services that have integrated the SDK:

* `SPEAKEASY_SERVER_URL` - The url of the on-premise Speakeasy Platform's GRPC Endpoint. By default this is `grpc.prod.speakeasyapi.dev:443`.
* `SPEAKEASY_SERVER_SECURE` - Whether or not to use TLS for the on-premise Speakeasy Platform. By default this is `true` set to `SPEAKEASY_SERVER_SECURE="false"` if you are using an insecure connection.

## Request Matching

The Speakeasy SDK out of the box will do its best to match requests to your provided OpenAPI Schema. It does this by extracting the path template used by one of the supported frameworks above for each request captured and attempting to match it to the paths defined in the OpenAPI Schema, for example:

### Express

```typescript
const app = express();
app.use(speakeasy.expressMiddleware());
app.all("/v1/user/:id/action/:action", myHandler); // The path template "/v1/user/{id}/action/{action}" is captured automatically by the SDK after being normalized to the OpenAPI spec format for paths.
```

### NestJS

```typescript
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/v1/user/:id/action/:action') // The path template "/v1/user/{id}/action/{action}" is captured automatically by the SDK after being normalized to the OpenAPI spec format for paths.
  myHandler(): string {
    // handler code here
  }
}
```

This isn't always successful or even possible, meaning requests received by Speakeasy will be marked as `unknown`, and potentially not associated with your Api, Version or ApiEndpoints in the Speakeasy Dashboard.

This normally happens if your path contains regex patterns or is a catch all path and your handler parses the routes manually.

To help the SDK in these situations you can provide path hints per request that match the paths in your OpenAPI Schema:

```typescript
const app = express();
app.use(speakeasy.expressMiddleware());
app.all("/", (req, res) => {
	// Provide a path hint for the request using the OpenAPI Path Templating format: https://swagger.io/specification/#path-templating-matching
	req.controller.setPathHint("/v1/user/{id}/action/{action}");
	
	// the rest of your handlers code
});
```
The above example will work for NestJS as well, just get the Speakeasy MiddlewareController from the request object.  

NOTE: If using nested Routers in express or Controller path prefixs in NestJS the SpeakeasySDK will not be able to get the full path template for the request due to a [current issue](https://github.com/expressjs/express/issues/2879) in express. To work around this you can manually set path hints as above or we can monkey patch in a modification to express to enable the SpeakeasySDK to get the full path template:

```typescript
/* eslint-disable */
// @ts-nocheck
import express from "express";

/* Credit to @watson and @jagadish-kb https://github.com/expressjs/express/issues/2879#issuecomment-269433170 */

const origUse = express.Router.use;

express.Router.use = function (fn) {
  if (typeof fn === "string" && Array.isArray(this.stack)) {
    let offset = this.stack.length;
    const result = origUse.apply(this, arguments);
    let layer;
    for (; offset < this.stack.length; offset++) {
      layer = this.stack[offset];
      // I'm not sure if my check for `fast_slash` is the way to go here
      // But if I don't check for it, each stack element will add a slash to the path
      if (layer && layer.regexp && !layer.regexp.fast_slash)
        layer.__mountpath = fn;
    }
    return result;
  } else {
    return origUse.apply(this, arguments);
  }
};

var origPP = express.Router.process_params;

express.Router.process_params = function (layer, called, req, res, done) {
  const path =
    (req.route &&
      (req.route.path || (req.route.regexp && req.route.regexp.source))) ||
    layer.__mountpath ||
    "";
  if (req.__route && path) {
    const searchFromIdx = req.__route.length - path.length;
    if (req.__route.indexOf(path, searchFromIdx) > 0) {
      return origPP.apply(this, arguments);
    }
  }
  req.__route = (req.__route || "") + path;

  return origPP.apply(this, arguments);
};
```

Create a file called `expressmonkeypatch.ts` or similar and import it into your service's `main.ts` file `import "./expressmonkeypatch";`. This will path express and allow the SDK to determine the full path automatically.

## Capturing Customer IDs

To help associate requests with customers/users of your APIs you can provide a customer ID per request handler:  

```typescript
const app = express();
app.use(speakeasy.expressMiddleware());
app.all("/", (req, res) => {
	// Provide a path hint for the request using the OpenAPI Path Templating format: https://swagger.io/specification/#path-templating-matching
	req.controller.setCustomerID("a-customers-id"); // This customer ID will be used to associate this instance of a request with your customers/users
	
	// the rest of your handlers code
});
```

Note: This is not required, but is highly recommended. By setting a customer ID you can easily associate requests with your customers/users in the Speakeasy Dashboard, powering filters in the [Request Viewer](https://docs.speakeasyapi.dev/speakeasy-user-guide/request-viewer-coming-soon).

## Masking sensitive data

Speakeasy can mask sensitive data in the query string parameters, headers, cookies and request/response bodies captured by the SDK. This is useful for maintaining sensitive data isolation, and retaining control over the data that is captured.

Using the `Advanced Configuration` section above you can completely ignore certain routes by not assigning the middleware to their router, causing the SDK to not capture any requests to that router.

But if you would like to be more selective you can mask certain sensitive data using our middleware controller allowing you to mask fields as needed in different handlers:

```typescript
import { Masking } from '@speakeasy-api/speakeasy-typescript-sdk';

const app = express();
app.use(speakeasy.expressMiddleware());
app.all("/", (req, res) => {
	ctrl := req.controller;
	ctrl.setMaskingOpts(Masking.withRequestHeaderMask("authorization")) // Mask the authorization header in the request
	
	// the rest of your handlers code
}
```

The `Masking` function takes a number of different options to mask sensitive data in the request:

* `Masking.withQueryStringMask` - **withQueryStringMask** will mask the specified query strings with an optional mask string.
* `Masking.withRequestHeaderMask` - **withRequestHeaderMask** will mask the specified request headers with an optional mask string.
* `Masking.withResponseHeaderMask` - **withResponseHeaderMask** will mask the specified response headers with an optional mask string.
* `Masking.withRequestCookieMask` - **withRequestCookieMask** will mask the specified request cookies with an optional mask string.
* `Masking.withResponseCookieMask` - **withResponseCookieMask** will mask the specified response cookies with an optional mask string.
* `Masking.withRequestFieldMaskString` - **withRequestFieldMaskString** will mask the specified request body fields with an optional mask. Supports string fields only. Matches using regex.
* `Masking.withRequestFieldMaskNumber` - **withRequestFieldMaskNumber** will mask the specified request body fields with an optional mask. Supports number fields only. Matches using regex.
* `Masking.withResponseFieldMaskString` - **withResponseFieldMaskString** will mask the specified response body fields with an optional mask. Supports string fields only. Matches using regex.
* `Masking.withResponseFieldMaskNumber` - **withResponseFieldMaskNumber** will mask the specified response body fields with an optional mask. Supports number fields only. Matches using regex.

Masking can also be done more globally on all routes or a selection of routes by taking advantage of middleware. Here is an example:

```typescript
import speakeasy, { Config, Masking } from "@speakeasy-api/speakeasy-typescript-sdk";
import express from "express";

const app = express();

// Configure the global speakeasy SDK instance
const cfg: Config = {
  apiKey: "YOUR API KEY HERE",			// retrieve from Speakeasy API dashboard.
  apiID: "YOUR API ID HERE", 			// custom Api ID to associate captured requests with.
  versionID: "YOUR VERSION ID HERE",	// custom Version ID to associate captured requests 
  port: 3000,							// The port number your express app is listening on (required to build full URLs on non-standard ports)
};
speakeasy.configure(cfg);

// Add the speakeasy middleware to your express app
app.use(speakeasy.expressMiddleware());
app.use((req: Request, res: Response, next: NextFunction) => {
  	// Mask the authorization header in the request for all requests served by this middleware
		ctrl := req.controller;
		ctrl.setMaskingOpts(Masking.withRequestHeaderMask("authorization"))
    next();
});
```

## Embedded Request Viewer Access Tokens

The Speakeasy SDK can generate access tokens for the [Embedded Request Viewer](https://docs.speakeasyapi.dev/speakeasy-user-guide/request-viewer/embedded-request-viewer) that can be used to view requests captured by the SDK.

For documentation on how to configure filters, find that [HERE](https://docs.speakeasyapi.dev/speakeasy-user-guide/request-viewer/embedded-request-viewer).

Below are some examples on how to generate access tokens:

```typescript
import { EmbedAccessTokenRequest } from "@speakeasy-api/speakeasy-schemas/registry/embedaccesstoken/embedaccesstoken_pb";

// If the SDK is configured as a global instance, an access token can be generated using the `generateAccessToken` function on the speakeasy package.
const req = new EmbedAccessTokenRequest();
const filter = new EmbedAccessTokenRequest.Filter();
filter.setKey("customer_id");
filter.setOperator("=");
filter.setValue("a-customer-id");

req.setFiltersList([filter]);
const accessToken = await speakeasy.getEmbedAccessToken(req);

// If you have followed the `Advanced Configuration` section above you can also generate an access token using the `GenerateAccessToken` function on the sdk instance.
const req = new EmbedAccessTokenRequest();
const filter = new EmbedAccessTokenRequest.Filter();
filter.setKey("customer_id");
filter.setOperator("=");
filter.setValue("a-customer-id");

req.setFiltersList([filter]);
const accessToken = await storeSDK.getEmbedAccessToken(req);

// Or finally if you have a handler that you would like to generate an access token from, you can get the SDK instance for that handler from the middleware controller and use the `GetEmbedAccessToken` function it.
app.all("/", (req, res) => {
  const req = new EmbedAccessTokenRequest();
  const filter = new EmbedAccessTokenRequest.Filter();
  filter.setKey("customer_id");
  filter.setOperator("=");
  filter.setValue("a-customer-id");

  req.setFiltersList([filter]);
  const accessToken = await req.controller.getSDKInstance().getEmbedAccessToken(req);
	
	// the rest of your handlers code
});
```