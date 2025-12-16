import { onRequest } from "firebase-functions/https";
import * as logger from "firebase-functions/logger";

export const helloWorld = onRequest((req, res) => {
  logger.info("Hello function called");
  res.send("Hello from Firebase!");
});