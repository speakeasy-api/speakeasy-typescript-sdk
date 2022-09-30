import { Request } from "express";

export interface ResolvedURLInfo {
  scheme: string;
  host: string;
}

export function resolveProxyHeaders(req: Request): ResolvedURLInfo {
  const scheme = getScheme(req);

  return {
    scheme: scheme != "" ? scheme : req.protocol,
    host: (req.headers["x-forwarded-host"] as string) ?? req.headers.host,
  };
}

function getScheme(req: Request): string {
  let scheme: string = "";

  if (req.headers["x-forwarded-proto"]) {
    scheme = (req.headers["x-forwarded-proto"] as string).toLowerCase();
  } else if (req.headers["x-forwarded-scheme"]) {
    scheme = (req.headers["x-forwarded-scheme"] as string).toLowerCase();
  } else if (req.headers["forwarded"]) {
    const forwarded = req.headers["forwarded"] as string;

    const protoRegex = new RegExp(`(?i)(?:proto=)(https|http)`);

    const matches = protoRegex.exec(forwarded);
    if (matches.length > 1) {
      scheme = matches[1].toLowerCase();
    }
  }

  return scheme;
}
