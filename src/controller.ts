type MaskingOption = (m: Masking) => void;

export class MiddlewareController {
  private pathHint: string = "";
  private customerID: string = "";
  private masking: Masking = new Masking();

  public getPathHint(): string {
    return this.pathHint;
  }

  public setPathHint(pathHint: string): void {
    this.pathHint = pathHint;
  }

  public getCustomerID(): string {
    return this.customerID;
  }

  public setCustomerID(customerID: string): void {
    this.customerID = customerID;
  }

  public setMaskingOpts(...opts: MaskingOption[]): void {
    opts.forEach((opt) => opt(this.masking));
  }

  public getMasking(): Masking {
    return this.masking;
  }
}

export const DefaultStringMask: string = "__masked__";
export const DefaultNumberMask = "-12321";

export class Masking {
  public queryStringMasks: Record<string, string> = {};
  public requestHeaderMasks: Record<string, string> = {};
  public responseHeaderMasks: Record<string, string> = {};
  public requestCookieMasks: Record<string, string> = {};
  public responseCookieMasks: Record<string, string> = {};
  public requestFieldMasksString: Record<string, string> = {};
  public requestFieldMasksNumber: Record<string, string> = {};
  public responseFieldMasksString: Record<string, string> = {};
  public responseFieldMasksNumber: Record<string, string> = {};

  // withQueryStringMask will mask the specified query strings with an optional mask string.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all query strings.
  // If the number of masks provided is equal to the number of query strings, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withQueryStringMask(
    keys: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      keys.forEach((key, index) => {
        switch (true) {
          case masks.length == 1:
            m.queryStringMasks[key] = masks[0];
            break;
          case masks.length > index:
            m.queryStringMasks[key] = masks[index];
            break;
          default:
            m.queryStringMasks[key] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withRequestHeaderMask will mask the specified request headers with an optional mask string.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all headers.
  // If the number of masks provided is equal to the number of headers, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withRequestHeaderMask(
    headers: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      headers.forEach((header, index) => {
        switch (true) {
          case masks.length == 1:
            m.requestHeaderMasks[header] = masks[0];
            break;
          case masks.length > index:
            m.requestHeaderMasks[header] = masks[index];
            break;
          default:
            m.requestHeaderMasks[header] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withResponseHeaderMask will mask the specified response headers with an optional mask string.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all headers.
  // If the number of masks provided is equal to the number of headers, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withResponseHeaderMask(
    headers: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      headers.forEach((header, index) => {
        switch (true) {
          case masks.length == 1:
            m.responseHeaderMasks[header] = masks[0];
            break;
          case masks.length > index:
            m.responseHeaderMasks[header] = masks[index];
            break;
          default:
            m.responseHeaderMasks[header] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withRequestCookieMask will mask the specified request cookies with an optional mask string.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all cookies.
  // If the number of masks provided is equal to the number of cookies, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withRequestCookieMask(
    cookies: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      cookies.forEach((cookie, index) => {
        switch (true) {
          case masks.length == 1:
            m.requestCookieMasks[cookie] = masks[0];
            break;
          case masks.length > index:
            m.requestCookieMasks[cookie] = masks[index];
            break;
          default:
            m.requestCookieMasks[cookie] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withResponseCookieMask will mask the specified response cookies with an optional mask string.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all cookies.
  // If the number of masks provided is equal to the number of cookies, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withResponseCookieMask(
    cookies: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      cookies.forEach((cookie, index) => {
        switch (true) {
          case masks.length == 1:
            m.responseCookieMasks[cookie] = masks[0];
            break;
          case masks.length > index:
            m.responseCookieMasks[cookie] = masks[index];
            break;
          default:
            m.responseCookieMasks[cookie] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withRequestFieldMaskString will mask the specified request body fields with an optional mask. Supports string fields only. Matches using regex.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all fields.
  // If the number of masks provided is equal to the number of fields, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withRequestFieldMaskString(
    fields: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      fields.forEach((field, index) => {
        switch (true) {
          case masks.length == 1:
            m.requestFieldMasksString[field] = masks[0];
            break;
          case masks.length > index:
            m.requestFieldMasksString[field] = masks[index];
            break;
          default:
            m.requestFieldMasksString[field] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withRequestFieldMaskNumber will mask the specified request body fields with an optional mask. Supports number fields only. Matches using regex.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all fields.
  // If the number of masks provided is equal to the number of fields, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "-12321").
  public static withRequestFieldMaskNumber(
    fields: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      fields.forEach((field, index) => {
        switch (true) {
          case masks.length == 1:
            m.requestFieldMasksNumber[field] = masks[0];
            break;
          case masks.length > index:
            m.requestFieldMasksNumber[field] = masks[index];
            break;
          default:
            m.requestFieldMasksNumber[field] = DefaultNumberMask;
            break;
        }
      });
    };
  }

  // withResponseFieldMaskString will mask the specified response body with an optional mask. Supports string only. Matches using regex.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all fields.
  // If the number of masks provided is equal to the number of fields, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "__masked__").
  public static withResponseFieldMaskString(
    fields: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      fields.forEach((field, index) => {
        switch (true) {
          case masks.length == 1:
            m.responseFieldMasksString[field] = masks[0];
            break;
          case masks.length > index:
            m.responseFieldMasksString[field] = masks[index];
            break;
          default:
            m.responseFieldMasksString[field] = DefaultStringMask;
            break;
        }
      });
    };
  }

  // withResponseFieldMaskNumber will mask the specified response body with an optional mask. Supports number fields only. Matches using regex.
  // If no mask is provided, the value will be masked with the default mask.
  // If a single mask is provided, it will be used for all fields.
  // If the number of masks provided is equal to the number of fields, masks will be used in order.
  // Otherwise, the masks will be used in order until it they are exhausted. If the masks are exhausted, the default mask will be used.
  // (defaults to "-12321").
  public static withResponseFieldMaskNumber(
    fields: string[],
    ...masks: string[]
  ): MaskingOption {
    return (m: Masking) => {
      fields.forEach((field, index) => {
        switch (true) {
          case masks.length == 1:
            m.responseFieldMasksNumber[field] = masks[0];
            break;
          case masks.length > index:
            m.responseFieldMasksNumber[field] = masks[index];
            break;
          default:
            m.responseFieldMasksNumber[field] = DefaultNumberMask;
            break;
        }
      });
    };
  }
}
