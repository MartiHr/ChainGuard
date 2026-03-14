import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { assembleVideo } from "./services/assembler";
import { encryptVideo } from "./services/encryption";
import { uploadToIPFS } from "./services/ipfs";
import {
  initContract,
  submitEvidence,
  getEvidencesByUser,
  getPublicEvidences,
  checkBlockchainConnection,
} from "./services/blockchain";

const app = express();
app.use(cors());
app.use(express.json());

interface Session {
  walletAddress: string;
  publicKey: string;
  isPublic: boolean;
  gpsCoordinates: string;
  chunkCount: number;
  dir: string;
}

const sessions = new Map<string, Session>();

// --- Health check endpoint ---
app.get("/health", async (_req, res) => {
  try {
    const blockchainStatus = await checkBlockchainConnection();
    res.json({
      status: "ok",
      server: "running",
      blockchain: blockchainStatus,
    });
  } catch (error) {
    console.error("Error checking health:", error);
    res.status(500).json({
      status: "error",
      server: "running",
      error: String(error),
    });
  }
});

// --- Start session ---
app.post("/sessions", async (req, res) => {
  try {
    const { walletAddress, publicKey, isPublic, gpsCoordinates } = req.body;
    const sessionId = uuidv4();
    const dir = path.join(__dirname, "../uploads", sessionId);
    await fs.mkdir(dir, { recursive: true });

    sessions.set(sessionId, {
      walletAddress,
      publicKey,
      isPublic,
      gpsCoordinates,
      chunkCount: 0,
      dir,
    });

    res.json({ sessionId });
  } catch (error) {
    console.error("Error starting session:", error);
    res.status(500).json({ error: "Failed to start session" });
  }
});

// --- Receive chunk ---
const upload = multer({ dest: "uploads/tmp/" });

app.post(
  "/sessions/:sessionId/chunks",
  upload.single("chunk"),
  async (req, res) => {
    try {
      const sessionId = req.params.sessionId as string;
      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const chunkIndex = session.chunkCount;
      const destPath = path.join(
        session.dir,
        `chunk_${String(chunkIndex).padStart(5, "0")}.mp4`,
      );
      await fs.rename(req.file!.path, destPath);

      if (req.body.gpsCoordinates) {
        session.gpsCoordinates = req.body.gpsCoordinates;
      }

      session.chunkCount++;
      console.log(`Session ${sessionId}: received chunk ${chunkIndex}`);
      res.json({ received: true, chunkIndex });
    } catch (error) {
      console.error("Error receiving chunk:", error);
      res.status(500).json({ error: "Failed to receive chunk" });
    }
  },
);

// --- End session (triggers finalization) ---
app.post("/sessions/:sessionId/end", async (req, res) => {
  try {
    const sessionId = req.params.sessionId as string;
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    console.log(
      `Session ${sessionId}: finalizing (${session.chunkCount} chunks)...`,
    );

    // 1. Assemble chunks into single video
    const assembledPath = path.join(session.dir, "final.mp4");
    await assembleVideo(session.dir, assembledPath);
    console.log("  Video assembled.");

    // 2. Encrypt if private
    let fileToUpload: Buffer;
    if (!session.isPublic) {
      fileToUpload = await encryptVideo(assembledPath, session.publicKey);
      console.log("  Video encrypted.");
    } else {
      fileToUpload = await fs.readFile(assembledPath);
    }

    // 3. Upload to IPFS
    const fileName = session.isPublic ? "evidence.mp4" : "evidence.enc";
    const cid = await uploadToIPFS(fileToUpload, fileName);
    console.log(`  Uploaded to IPFS: ${cid}`);

    // 4. Submit to blockchain
    const transactionHash = await submitEvidence(
      cid,
      session.gpsCoordinates,
      session.isPublic,
      session.walletAddress,
    );
    console.log(`  Submitted to blockchain: ${transactionHash}`);

    // 5. Cleanup
    await fs.rm(session.dir, { recursive: true });
    sessions.delete(req.params.sessionId);

    res.json({ cid, transactionHash });
  } catch (error) {
    console.error("Error finalizing session:", error);
    res.status(500).json({ error: "Failed to finalize session" });
  }
});

// --- Query evidence (public must be before :walletAddress to avoid matching "public" as an address) ---
app.get("/evidence/public", async (_req, res) => {
  try {
    const evidence = await getPublicEvidences();
    res.json(evidence);
  } catch (error) {
    console.error("Error fetching public evidence:", error);
    res.status(500).json({ error: "Failed to fetch public evidence" });
  }
});

app.get("/evidence/:walletAddress", async (req, res) => {
  try {
    const evidence = await getEvidencesByUser(
      req.params.walletAddress as string,
    );
    res.json(evidence);
  } catch (error) {
    console.error("Error fetching evidence:", error);
    res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

const PORT = process.env.PORT || 3000;

// Initialize blockchain connection
initContract()
  .then(() => {
    console.log("Connected to local blockchain");
  })
  .catch((error: any) => {
    console.error("Failed to connect to blockchain:", error);
  });

app.listen(PORT, () => {
  console.log(`ChainGuard backend running on :${PORT}`);
});
