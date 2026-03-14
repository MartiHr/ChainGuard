import express from "express";
import { upload } from "../middleware/upload";
import {
  endSession,
  startSession,
  uploadChunk,
} from "../controllers/session-controller";

const router = express.Router();

router.post("/", startSession);
router.post("/:sessionId/chunks", upload.single("chunk"), uploadChunk);
router.post("/:sessionId/end", endSession);

export default router;
