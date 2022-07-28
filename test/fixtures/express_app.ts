import express from "express";
import { Express, Request, Response } from "express";

import { expressMiddleware } from "../../src/middleware/express/middleware";

export function createSimpleExpressApp(): Express {
  const app = express();
  app.use(expressMiddleware());
  app.get("/", (req, res) => {
    res.status(200).send("Hello world!");
  });
  return app;
}
