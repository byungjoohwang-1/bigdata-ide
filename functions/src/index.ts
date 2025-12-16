import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

export const helloWorld = onRequest((req, res) => {
  logger.info("helloWorld called");
  res.send("Hello Firebase Functions!");
});
