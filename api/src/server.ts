import "dotenv/config";
import express from "express";
import cors from "cors";

import sessionRoutes from "./routes/session-routes";
import evidenceRoutes from "./routes/evidence-routes";

import { initContract } from "./services/blockchain";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/sessions", sessionRoutes);
app.use("/evidence", evidenceRoutes);

const PORT = process.env.PORT || 3000;

initContract()
  .then(() => console.log("Connected to blockchain"))
  .catch(console.error);

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`ChainGuard backend running on 0.0.0.0:${PORT}`);
});
