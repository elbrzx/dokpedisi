import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleUpdateSheet } from "./routes/update-sheet";
import { handleUploadSignature } from "./routes/upload-signature";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "5mb" })); // Increase limit for signatures
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Google Sheets update route
  app.post("/api/update-sheet", handleUpdateSheet);

  // Signature upload route
  app.post("/api/upload-signature", handleUploadSignature);

  return app;
}

// Start the server if run directly
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3001;
  const app = createServer();
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}
